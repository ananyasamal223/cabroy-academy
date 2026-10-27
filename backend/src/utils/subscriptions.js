// Clamp calendar billing periods (Jan 31 -> Feb 28, leap day -> Feb 28).
export function subscriptionExpiry(start, billing) {
  const result = new Date(start);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + (billing === "yearly" ? 12 : 1));
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

export function subscriptionRow(payment, now = new Date()) {
  const purchasedAt = payment.paidAt || payment.subscriptionStartsAt || payment.createdAt;
  const expiresAt = payment.subscriptionExpiresAt || subscriptionExpiry(purchasedAt, payment.billing);
  return {
    id: String(payment._id), userId: String(payment.user?._id || payment.user || payment._id),
    name: payment.user?.name || "Deleted customer", email: payment.user?.email || "",
    planId: payment.planId, planName: payment.planName || payment.planId,
    billing: payment.billing, amount: payment.amount, purchasedAt, expiresAt,
    status: new Date(expiresAt) > now ? "active" : "expired",
    orderId: payment.razorpayOrderId, paymentId: payment.razorpayPaymentId,
    method: payment.method, discount: payment.discount || 0,
  };
}

export function subscriptionSummary(rows, now = new Date()) {
  const active = rows.filter(row => row.status === "active");
  const counts = { starter: 0, pro: 0, business: 0 };
  for (const plan of Object.keys(counts)) counts[plan] = new Set(active.filter(row => row.planId === plan).map(row => row.userId)).size;
  return { ...counts, active: new Set(active.map(row => row.userId)).size,
    expiring: new Set(active.filter(row => new Date(row.expiresAt) <= new Date(now.getTime() + 30 * 86400000)).map(row => row.userId)).size };
}
