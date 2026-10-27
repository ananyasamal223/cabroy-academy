import StudentNotification from "../models/StudentNotification.js";
export async function notifyStudent(notification) {
 try {
  await StudentNotification.updateOne(
   { user: notification.user, eventKey: notification.eventKey },
   { $setOnInsert: notification }, { upsert: true }
  );
 } catch (error) {
  if (error.code !== 11000) console.error("Student notification failed:", error.message);
 }
}
