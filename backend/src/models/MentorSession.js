import mongoose from "mongoose";

const mentorSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: function () { return !this.subscription; }, index: true },
    subscription: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", default: null, index: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    date: { type: Date, required: true },
    type: { type: String, default: "Live Doubt Session" },
    note: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

mentorSessionSchema.index({ user: 1, date: 1 });

export default mongoose.model("MentorSession", mentorSessionSchema);
