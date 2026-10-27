import test from "node:test";
import assert from "node:assert/strict";
import { authToken, saveAuth, clearAuth, saveAuthUser } from "./authStorage.js";
const storage = () => { const values = new Map(); return { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }; };
test("remembered sessions persist while unchecked sessions remain tab-scoped", () => {
 globalThis.localStorage = storage(); globalThis.sessionStorage = storage();
 saveAuth("persistent", { name: "Learner" }, true);
 assert.equal(localStorage.getItem("rathi-token"), "persistent");
 saveAuth("temporary", { name: "Learner" }, false);
 assert.equal(localStorage.getItem("rathi-token"), null);
 assert.equal(sessionStorage.getItem("rathi-token"), "temporary");
 assert.equal(authToken(), "temporary");
 saveAuthUser({ name: "Updated" });
 assert.equal(JSON.parse(sessionStorage.getItem("rathi-user")).name, "Updated");
 clearAuth(); assert.equal(authToken(), null);
});
