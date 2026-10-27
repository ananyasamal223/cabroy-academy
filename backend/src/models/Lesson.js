import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    videoUrl: { type: String, default: "" },
    resourceUrl: { type: String, default: "" },
    durationMinutes: { type: Number, default: 0 },
    durationSeconds: { type: Number, default: 0 },
    module: { type: String, default: "" },
    order: { type: Number, default: 0 },
    isPreview: { type: Boolean, default: false },
  },
  { timestamps: true }
);

lessonSchema.index({ course: 1, order: 1 });

export default mongoose.model("Lesson", lessonSchema);
