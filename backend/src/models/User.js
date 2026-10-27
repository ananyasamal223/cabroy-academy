import mongoose from "mongoose";

const ADMIN_PERMISSIONS = [
  "dashboard",
  "reports",
  "courses",
  "revenue",
  "instructors",
  "certificates",
  "employees",
  "sales",
  "sales_manage",
  "instructor_portal",
];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, unique: true, sparse: true, trim: true },
    password: { type: String, required: true, select: false },
    googleId: { type: String, default: null, index: true, sparse: true },
    avatar: { type: String, default: "" },
    authVersion: { type: Number, default: 0 },
    emailVerifiedAt: { type: Date, default: null },
    termsAcceptedAt: { type: Date, default: null },
    policyVersion: { type: String, default: "" },
    location: { type: String, default: "" },
    role: {
      type: String,
      enum: ["student", "instructor", "admin", "employee"],
      default: "student",
    },
    isActive: { type: Boolean, default: true },
    bio: { type: String, default: "" },
    notificationPreferences: {
      emailNotifications: { type: Boolean, default: true },
      courseUpdates: { type: Boolean, default: true },
      assignmentReminders: { type: Boolean, default: true },
      mentorSessionReminders: { type: Boolean, default: true },
      communityUpdates: { type: Boolean, default: false },
    },

    // Employee management / restricted admin access
    employeeId: { type: String, unique: true, sparse: true, trim: true, uppercase: true, index: true },
    employeeRole: {
      type: String,
      enum: ["sales", "instructor", "content_reviewer", "academic_manager", "analyst", "support", "admin"],
      default: null,
    },
    department: { type: String, default: "", trim: true },
    adminAccess: { type: Boolean, default: false },
    adminPermissions: [{ type: String, enum: ADMIN_PERMISSIONS }],
    adminAccessNote: { type: String, default: "", trim: true },
    salesPerson: { type: mongoose.Schema.Types.ObjectId, ref: "SalesPerson", default: null },
    assignedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],

    // Instructor-only fields
    instructorStatus: {
      type: String,
      enum: ["active", "on-leave", "inactive"],
      default: "active",
    },
    statusNote: { type: String, default: "" },
  },
  { timestamps: true }
);

export { ADMIN_PERMISSIONS };
export default mongoose.model("User", userSchema);
