import { randomUUID } from "node:crypto";
const testPaymentSecret = randomUUID();
const testPaymentKey = randomUUID();
import test from "node:test";
import process from "node:process";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import Razorpay from "razorpay";
import Payment from "../models/Payment.js";
import { createOrder, verifyPayment } from "./payment.controller.js";
import { subscriptionRow } from "../utils/subscriptions.js";
const response = () => ({ code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; } });
test("checkout cannot silently purchase under an account different from the entered email", async () => {
  for (const accountEmail of ["akshita@example.com", undefined]) {
    const res = response();
    await createOrder({ body: { planId: "pro", billing: "monthly", accountEmail }, user: { _id: "admin", email: "admin@example.com" } }, res);
    assert.equal(res.code, 409);
    assert.match(res.body.message, /signed-in account/);
  }
});
function setup(t, details = {}) {
  const previous = { id: process.env.RAZORPAY_KEY_ID, secret: process.env.RAZORPAY_KEY_SECRET };
  process.env.RAZORPAY_KEY_ID = testPaymentKey;
  process.env.RAZORPAY_KEY_SECRET = testPaymentSecret;
  t.after(() => {
    for (const [key, value] of [["RAZORPAY_KEY_ID", previous.id], ["RAZORPAY_KEY_SECRET", previous.secret]]) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });
  t.mock.method(Razorpay.prototype, "addResources", function () {
    this.orders = { create: async order => ({ ...order, id: "order_test" }) };
    this.payments = { fetch: async () => ({ order_id: "order_test", amount: 199900, currency: "INR", status: "captured", created_at: Date.parse("2026-01-31T12:00:00Z") / 1000, method: "upi", ...details }) };
  });
}
const body = () => ({ razorpay_order_id: "order_test", razorpay_payment_id: "pay_test", razorpay_signature: crypto.createHmac("sha256", testPaymentSecret).update("order_test|pay_test").digest("hex") });
test("homepage plan checkout uses server prices and verified purchase reaches subscription reporting", async t => {
  setup(t);
  let saved;
  t.mock.method(Payment, "create", async data => { saved = { ...data, _id: "payment", createdAt: new Date(), async save() {} }; return saved; });
  const order = response();
  await createOrder({ body: { planId: "pro", billing: "monthly", amount: 1, accountEmail: "customer@example.com" }, user: { _id: "customer", email: "customer@example.com" } }, order);
  assert.equal(order.code, 201);
  assert.equal(order.body.order.amount, 199900);
  assert.equal(saved.status, "created");
  t.mock.method(Payment, "findOne", async query => {
    assert.equal(query.user, "customer");
    assert.equal(query.razorpayOrderId, "order_test");
    return saved;
  });
  await verifyPayment({ body: body(), user: { _id: "customer" } }, response());
  assert.equal(saved.status, "paid");
  assert.equal(saved.subscriptionExpiresAt.toISOString(), "2026-02-28T12:00:00.000Z");
  const expiry = saved.subscriptionExpiresAt.toISOString();
  await verifyPayment({ body: body(), user: { _id: "customer" } }, response());
  assert.equal(saved.subscriptionExpiresAt.toISOString(), expiry);
  const row = subscriptionRow(saved, new Date("2026-02-01"));
  assert.equal(row.status, "active");
  assert.equal(row.planId, "pro");
  assert.equal(row.amount, 1999);
});
test("uncaptured or mismatched payments do not activate plans", async t => {
  for (const details of [{ status: "authorized" }, { amount: 1 }, { order_id: "different" }, { currency: "USD" }]) {
    await t.test(JSON.stringify(details), async t => {
      setup(t, details);
      const payment = { razorpayOrderId: "order_test", amount: 1999, currency: "INR", status: "created", async save() { assert.fail("unverified payment must not be saved"); } };
      t.mock.method(Payment, "findOne", async () => payment);
      const res = response();
      await verifyPayment({ body: body(), user: { _id: "customer" } }, res);
      assert.ok([400, 409].includes(res.code));
      assert.equal(payment.status, "created");
    });
  }
});
test("forged signatures and orders owned by another user are rejected", async t => {
  setup(t);
  t.mock.method(Payment, "findOne", async query => query.user === "customer" ? { razorpayOrderId: "order_test" } : null);
  const forged = response();
  await verifyPayment({ body: { ...body(), razorpay_signature: "0".repeat(64) }, user: { _id: "customer" } }, forged);
  assert.equal(forged.code, 400);
  const other = response();
  await verifyPayment({ body: body(), user: { _id: "other" } }, other);
  assert.equal(other.code, 404);
});
