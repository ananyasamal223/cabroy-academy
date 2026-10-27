import { notifyStudent } from "./studentNotifications.js";
import Enrollment from "../models/Enrollment.js";

export async function enrollUserInCourse(userId, courseId) {
  const enrollment = await Enrollment.findOneAndUpdate(
    { user: userId, course: courseId },
    { $setOnInsert: { user: userId, course: courseId } },
    { upsert: true, new: true }
  );
  await notifyStudent({ user: userId, eventKey: "enrollment:" + enrollment._id, type: "enrollment", title: "Course access ready", message: "Your course is available in My Courses.", link: "/my-courses" });
  return enrollment;
}
