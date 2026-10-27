import mongoose from "mongoose";
import AdminNotification from "../models/AdminNotification.js";
function scope(user) {
 if (user.role === "admin") return {};
 return { permission: { $in: user.adminPermissions || [] } };
}
export function notificationAccess(req, res, next) {
 if (req.user.role === "admin" || (req.user.adminAccess && req.user.adminPermissions?.some(p => ["reports", "instructors"].includes(p)))) return next();
 return res.status(403).json({ message: "You do not have access to admin notifications." });
}
export async function listAdminNotifications(req, res) {
 const filter = scope(req.user);
 const [notifications, unreadCount] = await Promise.all([
  AdminNotification.find(filter).sort({ createdAt: -1, _id: -1 }).limit(50).lean(),
  AdminNotification.countDocuments({ ...filter, readBy: { $ne: req.user._id } }),
 ]);
 res.json({ notifications: notifications.map(n => ({ id: n._id, type: n.type, title: n.title, message: n.message, link: n.link, createdAt: n.createdAt, read: n.readBy.some(id => String(id) === String(req.user._id)) })), unreadCount });
}
export async function readAdminNotifications(req, res) {
 const { ids, all } = req.body;
 if (all !== true && (!Array.isArray(ids) || !ids.length || ids.length > 50 || ids.some(id => typeof id !== "string" || !mongoose.isValidObjectId(id)))) return res.status(400).json({ message: "Choose valid notifications." });
 const filter = { ...scope(req.user), ...(all === true ? {} : { _id: { $in: ids } }) };
 await AdminNotification.updateMany(filter, { $addToSet: { readBy: req.user._id } });
 res.json({ message: "Notifications marked as read." });
}
