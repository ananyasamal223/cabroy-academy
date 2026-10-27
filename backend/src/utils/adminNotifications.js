import AdminNotification from "../models/AdminNotification.js";
// A notification delivery failure must not make a successfully saved submission
// look unsuccessful to the student and cause duplicate retries.
export async function notifyAdmins(notification) {
 try { await AdminNotification.create(notification); }
 catch (error) { console.error("Could not save admin notification:", error.message); }
}
