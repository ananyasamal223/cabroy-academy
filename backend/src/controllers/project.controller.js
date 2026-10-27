import { notifyStudent } from "../utils/studentNotifications.js";
import { notifyAdmins } from "../utils/adminNotifications.js";
import Project from "../models/Project.js";
import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";

async function effectiveInstructorFor(userId, courseId) {
  const [enrollment, course] = await Promise.all([
    Enrollment.findOne({ user: userId, course: courseId, status: { $ne: "cancelled" } }).select("mentor"),
    Course.findById(courseId).select("instructor"),
  ]);
  return enrollment?.mentor || course?.instructor || null;
}

export async function submitProject(req, res) {
  const assignedInstructor = await effectiveInstructorFor(req.user._id, req.params.courseId);
  const project = await Project.create({
    ...req.body,
    user: req.user._id,
    course: req.params.courseId,
    assignedInstructor,
  });
  await notifyAdmins({ type: "project", title: "Project submitted", message: `${req.user.name} submitted ${project.title}.`, permission: assignedInstructor ? "instructors" : "reports", link: assignedInstructor ? `/admin/instructors/${assignedInstructor}?tab=projects` : "/admin/user-overview" });
  res.status(201).json({ project });
}

export async function myProjects(req, res) {
  const projects = await Project.find({ user: req.user._id })
    .populate("course", "title thumbnail")
    .populate("assignedInstructor", "name email")
    .sort({ createdAt: -1 });
  res.json({ projects });
}

// Admin sees all projects. Instructors only see projects assigned to them.
// Legacy projects that pre-date assignedInstructor are resolved from the
// student's Enrollment.mentor, falling back to Course.instructor.
export async function listProjects(req, res) {
  let projects = [];

  if (req.user.role === "admin") {
    projects = await Project.find()
      .populate("user", "name email")
      .populate("course", "title instructor")
      .populate("assignedInstructor", "name email")
      .sort({ createdAt: -1 });
  } else {
    const ownedCourses = await Course.find({ instructor: req.user._id }, "_id");
    const ownedCourseIds = ownedCourses.map((course) => course._id);

    const [explicitEnrollments, fallbackEnrollments] = await Promise.all([
      Enrollment.find({ mentor: req.user._id, status: { $ne: "cancelled" } }).select("user course"),
      ownedCourseIds.length
        ? Enrollment.find({ mentor: null, course: { $in: ownedCourseIds }, status: { $ne: "cancelled" } }).select("user course")
        : [],
    ]);

    const pairSet = new Set(
      [...explicitEnrollments, ...fallbackEnrollments].map(
        (e) => `${String(e.user)}:${String(e.course)}`
      )
    );
    const userIds = [...new Set([...explicitEnrollments, ...fallbackEnrollments].map((e) => String(e.user)))];
    const courseIds = [...new Set([...explicitEnrollments, ...fallbackEnrollments].map((e) => String(e.course)))];

    const query = [{ assignedInstructor: req.user._id }];
    if (userIds.length && courseIds.length) {
      query.push({ assignedInstructor: null, user: { $in: userIds }, course: { $in: courseIds } });
    }

    const candidates = await Project.find({ $or: query })
      .populate("user", "name email")
      .populate("course", "title instructor")
      .populate("assignedInstructor", "name email")
      .sort({ createdAt: -1 });

    projects = candidates.filter((project) => {
      if (project.assignedInstructor) return String(project.assignedInstructor._id) === String(req.user._id);
      return pairSet.has(`${String(project.user?._id)}:${String(project.course?._id)}`);
    });
  }

  res.json({ projects });
}

export async function reviewProject(req, res) {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: "Project not found" });

  if (req.user.role === "instructor") {
    const effectiveInstructor = project.assignedInstructor || (await effectiveInstructorFor(project.user, project.course));
    if (!effectiveInstructor || String(effectiveInstructor) !== String(req.user._id)) {
      return res.status(403).json({ message: "This project is not assigned to you" });
    }
  }

  const { status, feedback } = req.body;
  if (!['approved', 'rejected', 'submitted'].includes(status)) {
    return res.status(400).json({ message: "Invalid project status" });
  }

  const changed = project.status !== status || project.feedback !== (feedback || "");
  project.status = status;
  project.feedback = feedback || "";
  project.reviewedBy = req.user._id;
  if (!project.assignedInstructor && req.user.role === "instructor") {
    project.assignedInstructor = req.user._id;
  }
  await project.save();
  if (changed) await notifyStudent({ user: project.user, eventKey: "project:" + project._id + ":" + project.updatedAt.toISOString(), type: "project", title: "Project review updated", message: project.title + " is " + status + (project.feedback ? ". Feedback: " + project.feedback : "."), link: "/projects" });

  const populated = await Project.findById(project._id)
    .populate("user", "name email")
    .populate("course", "title")
    .populate("assignedInstructor", "name email")
    .populate("reviewedBy", "name email");

  res.json({ project: populated });
}
