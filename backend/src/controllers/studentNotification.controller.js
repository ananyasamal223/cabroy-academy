import mongoose from "mongoose";
import StudentNotification from "../models/StudentNotification.js";
export async function listStudentNotifications(req, res) {
 const filter = { user: req.user._id };
 const [notifications, unreadCount] = await Promise.all([
  StudentNotification.find(filter).sort({ createdAt: -1, _id: -1 }).limit(50).lean(),
  StudentNotification.countDocuments({ ...filter, readAt: null }),
 ]);
 res.json({ notifications: notifications.map(n => ({ id: n._id, type: n.type, title: n.title, message: n.message, link: n.link, createdAt: n.createdAt, read: Boolean(n.readAt) })), unreadCount });
}
export async function readStudentNotifications(req, res) {
 const { ids, all } = req.body;
 if (all !== true && (!Array.isArray(ids) || !ids.length || ids.length > 50 || ids.some(id => typeof id !== "string" || !mongoose.isValidObjectId(id)))) return res.status(400).json({ message: "Choose valid notifications." });
 await StudentNotification.updateMany({ user: req.user._id, readAt: null, ...(all === true ? {} : { _id: { $in: ids } }) }, { $set: { readAt: new Date() } });
 res.json({ message: "Notifications marked as read." });
}
