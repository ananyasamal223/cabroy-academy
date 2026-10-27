import mongoose from "mongoose";
const schema = new mongoose.Schema({
 email: { type: String, required: true, unique: true, lowercase: true },
 name: { type: String, required: true }, phone: String,
 password: { type: String, required: true, select: false },
 code: { type: String, required: true, select: false },
 attempts: { type: Number, default: 0 },
 termsAcceptedAt: { type: Date, required: true }, policyVersion: String,
 lastSentAt: { type: Date, required: true },
 expiresAt: { type: Date, required: true, expires: 0 },
}, { timestamps: true });
export default mongoose.model("PendingSignup", schema);
