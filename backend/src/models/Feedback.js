import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    liked: {
      type: [String],
      enum: ["Content Quality", "Mentor Support", "Assignments", "Platform Experience"],
      default: [],
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    // Admin moderation status. Existing feedback documents without this field
    // are treated as published by the admin API for backward compatibility.
    status: {
      type: String,
      enum: ["published", "pending"],
      default: "published",
      index: true,
    },
  },
  { timestamps: true }
);

feedbackSchema.index({ user: 1, course: 1 }, { unique: true });
feedbackSchema.index({ createdAt: -1 });

export default mongoose.model("Feedback", feedbackSchema);
