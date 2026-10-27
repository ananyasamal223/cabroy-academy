import mongoose from "mongoose";
const schema = new mongoose.Schema({
 user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
 eventKey: { type: String, required: true },
 type: { type: String, required: true },
 title: { type: String, required: true },
 message: { type: String, required: true },
 link: { type: String, required: true },
 readAt: { type: Date, default: null },
}, { timestamps: true });
schema.index({ user: 1, eventKey: 1 }, { unique: true });
schema.index({ user: 1, createdAt: -1 });
export default mongoose.model("StudentNotification", schema);
