import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    shortDescription: { type: String, default: "" },
    description: { type: String, default: "" },
    category: { type: String, default: "General" },
    level: { type: String, default: "Beginner" },
    thumbnail: { type: String, default: "" },
    price: { type: Number, default: 0, min: 0 },
    accessOptions: {
      type: [{ type: String, enum: ["individual", "starter", "pro", "business"] }],
      default: ["individual"],
      validate: { validator: value => Array.isArray(value) && value.length > 0 && new Set(value).size === value.length, message: "Choose at least one valid, unique course access option" },
    },
    originalPrice: { type: Number, default: null, min: 0 },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isPublished: { type: Boolean, default: false },
    tags: [{ type: String }],
    durationMinutes: { type: Number, default: 0 },
    duration: { type: String, default: "" },
    sessions: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    students: { type: Number, default: 0 },
    skills: [{ type: String }],
    modules: [{ type: String }],
    curriculum: [{ _id: false, title: { type: String, required: true, trim: true }, submodules: [{ type: String, required: true, trim: true }] }],
    projects: [{
      title: { type: String, required: true, trim: true },
      problemStatement: { type: String, required: true, trim: true },
      deliverables: [{ type: String, trim: true }],
      resourceLinks: [{ type: String, trim: true }],
      submissionRequirements: {
        projectLink: { type: Boolean, default: true },
        description: { type: Boolean, default: true },
        githubLink: { type: Boolean, default: false },
        additionalLink: { type: Boolean, default: false },
        supportingFile: { type: Boolean, default: false },
      },
      availability: { type: String, enum: ["after_purchase", "after_module"], default: "after_purchase" },
      unlockModuleIndex: { type: Number, default: null, min: 0 },
      deadlineType: { type: String, enum: ["relative", "fixed", "none"], default: "relative" },
      deadlineDays: { type: Number, default: 14, min: 1 },
      fixedDeadline: { type: Date, default: null },
      timerHours: { type: Number, default: null, min: 0.25 },
      reviewCriteria: { type: String, default: "", trim: true },
      requiredForCertificate: { type: Boolean, default: false },
    }],
    requirements: [{ type: String }],
    materialUrl: { type: String, default: "", select: false, validate: { validator: value => !value || /^https:\/\//i.test(value), message: "Resource link must use HTTPS" } },
  },
  { timestamps: true }
);

courseSchema.index({ title: "text", description: "text", tags: "text" });

export default mongoose.model("Course", courseSchema);
