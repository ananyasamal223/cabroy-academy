import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    assignedInstructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    submissionUrl: { type: String, default: "" },
    status: { type: String, enum: ["submitted", "approved", "rejected"], default: "submitted", index: true },
    feedback: { type: String, default: "" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

schema.index({ assignedInstructor: 1, status: 1, createdAt: -1 });
schema.index({ user: 1, course: 1, createdAt: -1 });

export default mongoose.model("Project", schema);
