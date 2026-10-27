import mongoose from "mongoose";

// Tracks the STATUS of an instructor being assigned to a course —
// separate from Course.instructor (which just says who currently owns it).
// This lets an assignment move through a lifecycle: assigned -> in-progress -> completed.
const assignmentSchema = new mongoose.Schema(
  {
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    status: {
      type: String,
      enum: ["assigned", "in-progress", "completed"],
      default: "assigned",
    },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true }
);

// One assignment record per instructor+course pair
assignmentSchema.index({ instructor: 1, course: 1 }, { unique: true });

export default mongoose.model("Assignment", assignmentSchema);
