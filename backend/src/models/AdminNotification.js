import mongoose from "mongoose";
const schema = new mongoose.Schema({
 type: { type: String, required: true },
 title: { type: String, required: true },
 message: { type: String, required: true },
 permission: { type: String, required: true, enum: ["reports", "instructors"] },
 link: { type: String, required: true },
 readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true });
schema.index({ permission: 1, createdAt: -1 });
export default mongoose.model("AdminNotification", schema);
