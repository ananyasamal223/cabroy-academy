import { notifyAdmins } from "../utils/adminNotifications.js";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Progress from "../models/Progress.js";
import Payment from "../models/Payment.js";
import Project from "../models/Project.js";
import Contact from "../models/Contact.js";
import Review from "../models/Review.js";
import MentorSession from "../models/MentorSession.js";
import Assignment from "../models/Assignment.js";
import SalesPerson from "../models/SalesPerson.js";
import Lesson from "../models/Lesson.js";

/* =========================================================
   DASHBOARD STATS - GET /api/admin/stats
========================================================= */
export async function dashboardStats(req, res) {
  const [
    totalStudents,
    activeCourses,
    totalEnrollments,
    completedEnrollments,
    revenueAgg,
    submittedProjects,
    unreadContacts,
    recentEnrollments,
  ] = await Promise.all([
    User.countDocuments({ role: "student" }),
    Course.countDocuments({ isPublished: true }),
    Enrollment.countDocuments({ status: { $ne: "cancelled" } }),
    Enrollment.countDocuments({ status: "completed" }),
    Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Project.countDocuments({ status: "submitted" }),
    Contact.countDocuments({ status: "new" }),
    Enrollment.find({ status: { $ne: "cancelled" } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name email")
      .populate("course", "title"),
  ]);

  const totalRevenue = revenueAgg[0]?.total || 0;
  const completionRate = totalEnrollments
    ? Math.round((completedEnrollments / totalEnrollments) * 1000) / 10
    : 0;
  const dropOffRate = totalEnrollments ? Math.round((100 - completionRate) * 10) / 10 : 0;

  // Attach real progress % to each recent enrollment
  const recentStudents = await Promise.all(
    recentEnrollments
      .filter((e) => e.user && e.course)
      .map(async (e) => {
        const progress = await Progress.findOne({ user: e.user._id, course: e.course._id });
        return {
          name: e.user.name,
          email: e.user.email,
          course: e.course.title,
          progress: progress?.percentage || 0,
          joinDate: e.createdAt,
          status: e.status, // active | completed
        };
      })
  );

  res.json({
    stats: {
      totalStudents,
      activeCourses,
      totalRevenue,
      completionRate,
      dropOffRate,
      // kept for backward compatibility with anything already reading these
      users: totalStudents,
      courses: activeCourses,
      enrollments: totalEnrollments,
      submittedProjects,
      unreadContacts,
    },
    recentStudents,
  });
}

/* =========================================================
   REVENUE - GET /api/admin/revenue
========================================================= */
export async function revenueStats(req, res) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7)); // Monday
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const last30Start = new Date(startOfToday);
  last30Start.setDate(last30Start.getDate() - 29);

  const sumSince = async (since) => {
    const agg = await Payment.aggregate([
      { $match: { status: "paid", createdAt: { $gte: since } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    return agg[0]?.total || 0;
  };

  const [
    totalRevenueAgg,
    totalOrders,
    failedOrders,
    distinctPayers,
    todayRevenue,
    weekRevenue,
    monthRevenue,
    yearRevenue,
    dailyRevenueAgg,
    recentTransactions,
    topCoursesAgg,
  ] = await Promise.all([
    Payment.aggregate([
      { $match: { status: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Payment.countDocuments({ status: "paid" }),
    Payment.countDocuments({ status: "failed" }),
    Payment.distinct("user", { status: "paid" }),
    sumSince(startOfToday),
    sumSince(startOfWeek),
    sumSince(startOfMonth),
    sumSince(startOfYear),
    Payment.aggregate([
      { $match: { status: "paid", createdAt: { $gte: last30Start } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // FIX: "courses" (plural array) — Payment.courses is an array to support
    // cart checkout. "course" (singular) does not exist on this schema.
    Payment.find({ status: { $in: ["paid", "failed"] } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("user", "name email")
      .populate("courses", "title"),
    Payment.aggregate([
      { $match: { status: "paid" } },
      { $unwind: "$courses" },
      { $group: { _id: "$courses", revenue: { $sum: "$amount" }, enrollments: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const totalRevenue = totalRevenueAgg[0]?.total || 0;
  const totalAttempts = totalOrders + failedOrders;
  const conversionRate = totalAttempts
    ? Math.round((totalOrders / totalAttempts) * 1000) / 10
    : 0;
  const averageOrderValue = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;

  const dailyRevenue = dailyRevenueAgg.map((d) => ({ date: d._id, amount: d.total }));

  const recentTransactionsFormatted = recentTransactions
    .filter((p) => p.user)
    .map((p) => ({
      id: p._id,
      name: p.user.name,
      course: (p.courses || []).filter(Boolean).map((c) => c.title).join(", ") || "Course",
      amount: p.amount,
      method: p.method || "unknown",
      date: p.createdAt,
      status: p.status === "paid" ? "Completed" : "Failed",
    }));

  const courseIds = topCoursesAgg.map((c) => c._id);
  const courses = await Course.find({ _id: { $in: courseIds } }, "title thumbnail");
  const courseMap = Object.fromEntries(courses.map((c) => [String(c._id), c]));

  const topSellingCourses = topCoursesAgg.map((c) => ({
    id: c._id,
    title: courseMap[String(c._id)]?.title || "Course",
    thumbnail: courseMap[String(c._id)]?.thumbnail || "",
    revenue: c.revenue,
    enrollments: c.enrollments,
  }));

  res.json({
    totalRevenue,
    totalOrders,
    totalStudentsPaid: distinctPayers.length,
    averageOrderValue,
    conversionRate,
    todayRevenue,
    weekRevenue,
    monthRevenue,
    yearRevenue,
    dailyRevenue,
    recentTransactions: recentTransactionsFormatted,
    topSellingCourses,
  });
}

/* =========================================================
   INSTRUCTOR OVERVIEW HELPERS
   Students are linked to an instructor by Enrollment.mentor.
   For existing/legacy records where mentor is empty, the owning
   Course.instructor is used as the fallback so old data still works.
========================================================= */
function uniqueDocumentsById(items = []) {
  const seen = new Set();
  return items.filter((item) => {
    const id = String(item?._id || "");
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

async function coursesForInstructor(instructor) {
  const assignedCourseIds = (instructor.assignedCourses || []).map((value) => value?._id || value).filter(Boolean);
  return Course.find({
    $or: [
      { instructor: instructor._id },
      ...(assignedCourseIds.length ? [{ _id: { $in: assignedCourseIds } }] : []),
    ],
  }).select("title category level thumbnail isPublished instructor createdAt").sort({ createdAt: -1 });
}

async function effectiveEnrollmentsForInstructor(instructor, courses) {
  const courseIds = courses.map((course) => course._id);
  const [explicit, fallback] = await Promise.all([
    Enrollment.find({ mentor: instructor._id, status: { $ne: "cancelled" } })
      .populate("user", "name email avatar isActive")
      .populate("course", "title category level")
      .sort({ createdAt: -1 }),
    courseIds.length
      ? Enrollment.find({ mentor: null, course: { $in: courseIds }, status: { $ne: "cancelled" } })
          .populate("user", "name email avatar isActive")
          .populate("course", "title category level")
          .sort({ createdAt: -1 })
      : [],
  ]);
  return uniqueDocumentsById([...explicit, ...fallback]).filter((row) => row.user && row.course);
}

function enrollmentPairSet(enrollments = []) {
  return new Set(
    enrollments.map((row) => `${String(row.user?._id || row.user)}:${String(row.course?._id || row.course)}`)
  );
}

async function effectiveSessionsForInstructor(instructor, courses, enrollments) {
  const courseIds = courses.map((course) => course._id);
  const pairs = enrollmentPairSet(enrollments);
  const query = [{ mentor: instructor._id }];
  if (courseIds.length) query.push({ mentor: null, course: { $in: courseIds } });

  const sessions = await MentorSession.find({
    status: { $ne: "cancelled" },
    $or: query,
  })
    .populate("user", "name email avatar")
    .populate("course", "title")
    .populate("mentor", "name email")
    .sort({ date: -1 });

  return sessions.filter((session) => {
    if (session.mentor) return String(session.mentor._id) === String(instructor._id);
    return pairs.has(`${String(session.user?._id)}:${String(session.course?._id)}`);
  });
}

async function effectiveProjectsForInstructor(instructor, courses, enrollments) {
  const courseIds = courses.map((course) => course._id);
  const userIds = [...new Set(enrollments.map((row) => String(row.user?._id)).filter(Boolean))];
  const pairs = enrollmentPairSet(enrollments);
  const query = [{ assignedInstructor: instructor._id }];

  if (courseIds.length && userIds.length) {
    query.push({ assignedInstructor: null, course: { $in: courseIds }, user: { $in: userIds } });
  }

  const projects = await Project.find({ $or: query })
    .populate("user", "name email avatar")
    .populate("course", "title")
    .populate("assignedInstructor", "name email")
    .populate("reviewedBy", "name email")
    .sort({ createdAt: -1 });

  return projects.filter((project) => {
    if (project.assignedInstructor) return String(project.assignedInstructor._id) === String(instructor._id);
    return pairs.has(`${String(project.user?._id)}:${String(project.course?._id)}`);
  });
}

async function buildInstructorDetail(instructor) {
  const courses = await coursesForInstructor(instructor);
  const enrollments = await effectiveEnrollmentsForInstructor(instructor, courses);
  const [sessions, projects] = await Promise.all([
    effectiveSessionsForInstructor(instructor, courses, enrollments),
    effectiveProjectsForInstructor(instructor, courses, enrollments),
  ]);

  const confirmedSessions = sessions.filter((session) => session.status === "confirmed");
  const pendingProjects = projects.filter((project) => project.status === "submitted");
  const uniqueStudentIds = new Set(enrollments.map((row) => String(row.user?._id)).filter(Boolean));

  const sessionsByPair = new Map();
  for (const session of confirmedSessions) {
    const key = `${String(session.user?._id)}:${String(session.course?._id)}`;
    const list = sessionsByPair.get(key) || [];
    list.push(session);
    sessionsByPair.set(key, list);
  }

  const projectsByPair = new Map();
  for (const project of projects) {
    const key = `${String(project.user?._id)}:${String(project.course?._id)}`;
    const list = projectsByPair.get(key) || [];
    list.push(project);
    projectsByPair.set(key, list);
  }

  const students = enrollments.map((enrollment) => {
    const key = `${String(enrollment.user?._id)}:${String(enrollment.course?._id)}`;
    const studentSessions = sessionsByPair.get(key) || [];
    const studentProjects = projectsByPair.get(key) || [];
    const timestamps = [
      enrollment.updatedAt,
      ...studentSessions.map((item) => item.updatedAt || item.date),
      ...studentProjects.map((item) => item.updatedAt || item.createdAt),
    ]
      .map((value) => (value ? new Date(value).getTime() : 0))
      .filter(Boolean);

    return {
      enrollmentId: enrollment._id,
      studentId: enrollment.user?._id,
      studentName: enrollment.user?.name || "Unknown student",
      studentEmail: enrollment.user?.email || "",
      studentAvatar: enrollment.user?.avatar || "",
      courseId: enrollment.course?._id,
      courseTitle: enrollment.course?.title || "Course",
      enrollmentStatus: enrollment.status,
      sessionCount: studentSessions.length,
      submittedProjects: studentProjects.length,
      pendingReviews: studentProjects.filter((item) => item.status === "submitted").length,
      lastActivity: timestamps.length ? new Date(Math.max(...timestamps)) : enrollment.updatedAt,
    };
  });

  const courseRows = courses.map((course) => ({
    id: course._id,
    title: course.title,
    category: course.category,
    level: course.level,
    thumbnail: course.thumbnail,
    isPublished: course.isPublished,
    students: enrollments.filter((row) => String(row.course?._id) === String(course._id)).length,
    projects: projects.filter((row) => String(row.course?._id) === String(course._id)).length,
  }));

  return {
    profile: {
      id: instructor._id,
      name: instructor.name,
      email: instructor.email,
      avatar: instructor.avatar,
      employeeId: instructor.employeeId || "",
      department: instructor.department || "",
      expertise: instructor.bio || "",
      status: instructor.instructorStatus || "active",
      statusLabel: STATUS_LABEL_BACKEND[instructor.instructorStatus || "active"] || "Active",
      statusNote: instructor.statusNote || "",
      joinedDate: instructor.createdAt,
    },
    summary: {
      students: uniqueStudentIds.size,
      courses: courses.length,
      sessions: confirmedSessions.length,
      pendingProjects: pendingProjects.length,
      totalProjects: projects.length,
    },
    students,
    sessions: sessions.map((session) => ({
      id: session._id,
      studentId: session.user?._id,
      studentName: session.user?.name || "Unknown student",
      studentEmail: session.user?.email || "",
      courseId: session.course?._id,
      courseTitle: session.course?.title || "Course",
      date: session.date,
      type: session.type,
      note: session.note,
      status: session.status,
    })),
    projects: projects.map((project) => ({
      id: project._id,
      studentId: project.user?._id,
      studentName: project.user?.name || "Unknown student",
      studentEmail: project.user?.email || "",
      courseId: project.course?._id,
      courseTitle: project.course?.title || "Course",
      title: project.title,
      description: project.description,
      submissionUrl: project.submissionUrl,
      status: project.status,
      feedback: project.feedback,
      submittedAt: project.createdAt,
      reviewedAt: project.updatedAt,
      reviewedBy: project.reviewedBy?.name || "",
    })),
    courses: courseRows,
  };
}

const STATUS_LABEL_BACKEND = {
  active: "Active",
  "on-leave": "On Leave",
  inactive: "Inactive",
};

/* =========================================================
   INSTRUCTOR OVERVIEW - GET /api/admin/instructors
========================================================= */
export async function instructorOverview(req, res) {
  const instructors = await User.find({ role: "instructor" })
    .select("name email avatar bio employeeId department instructorStatus statusNote assignedCourses isActive createdAt")
    .sort({ createdAt: -1 });

  const detailed = await Promise.all(
    instructors.map(async (instructor) => {
      const detail = await buildInstructorDetail(instructor);
      return {
        id: instructor._id,
        name: instructor.name,
        email: instructor.email,
        avatar: instructor.avatar,
        employeeId: instructor.employeeId || "",
        department: instructor.department || "",
        expertise: instructor.bio || "",
        status: instructor.instructorStatus || "active",
        isActive: instructor.isActive !== false,
        statusNote: instructor.statusNote || "",
        joinedDate: instructor.createdAt,
        totalCourses: detail.summary.courses,
        courseTitles: detail.courses.map((course) => course.title),
        studentsManaged: detail.summary.students,
        sessionsTaken: detail.summary.sessions,
        totalProjects: detail.summary.totalProjects,
        pendingProjects: detail.summary.pendingProjects,
      };
    })
  );

  res.json({
    total: detailed.length,
    active: detailed.filter((item) => item.status === "active").length,
    onLeave: detailed.filter((item) => item.status === "on-leave").length,
    inactive: detailed.filter((item) => item.status === "inactive").length,
    studentsAssigned: detailed.reduce((sum, item) => sum + Number(item.studentsManaged || 0), 0),
    pendingProjectReviews: detailed.reduce((sum, item) => sum + Number(item.pendingProjects || 0), 0),
    instructors: detailed,
  });
}

// GET /api/admin/instructors/:id
export async function getInstructorDetails(req, res) {
  const instructor = await User.findOne({ _id: req.params.id, role: "instructor" })
    .select("name email avatar bio employeeId department instructorStatus statusNote assignedCourses createdAt");
  if (!instructor) return res.status(404).json({ message: "Instructor not found" });
  res.json(await buildInstructorDetail(instructor));
}


// PATCH /api/admin/instructors/:id/status  { status, statusNote? }
export async function updateInstructorStatus(req, res) {
  const { status, statusNote } = req.body;
  if (!["active", "on-leave", "inactive"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const instructor = await User.findOneAndUpdate(
    { _id: req.params.id, role: "instructor" },
    { instructorStatus: status, statusNote: statusNote || "" },
    { new: true }
  );

  if (!instructor) return res.status(404).json({ message: "Instructor not found" });
  await notifyAdmins({ type: "instructor", title: status === "on-leave" ? "Instructor on leave" : "Instructor status updated", message: `${instructor.name} is now ${status}.${instructor.statusNote ? " " + instructor.statusNote : ""}`, permission: "instructors", link: `/admin/instructors/${instructor._id}` });
  res.json({ message: "Instructor status updated", instructor });
}


// PATCH /api/admin/enrollments/:studentId/:courseId/mentor
// Assigns one purchased course/student to a mentor without changing the
// course's global instructor. This fixes the old behaviour where assigning
// one student accidentally changed the instructor for every student.
export async function assignEnrollmentMentor(req, res) {
  const { mentorId } = req.body;
  if (!mentorId) return res.status(400).json({ message: "mentorId is required" });

  const mentor = await User.findOne({
    _id: mentorId,
    role: "instructor",
    isActive: true,
    instructorStatus: { $ne: "inactive" },
  }).select("name email employeeId");
  if (!mentor) return res.status(404).json({ message: "Active instructor not found" });

  const enrollment = await Enrollment.findOne({
    user: req.params.studentId,
    course: req.params.courseId,
    status: { $ne: "cancelled" },
  });
  if (!enrollment) return res.status(404).json({ message: "Student enrollment not found" });

  enrollment.mentor = mentor._id;
  await enrollment.save();

  const now = new Date();
  await Promise.all([
    MentorSession.updateMany(
      {
        user: enrollment.user,
        course: enrollment.course,
        status: { $ne: "cancelled" },
        date: { $gte: now },
      },
      { $set: { mentor: mentor._id } }
    ),
    Project.updateMany(
      {
        user: enrollment.user,
        course: enrollment.course,
        status: "submitted",
      },
      { $set: { assignedInstructor: mentor._id } }
    ),
  ]);

  res.json({
    message: "Mentor assigned successfully",
    mentor: { id: mentor._id, name: mentor.name, email: mentor.email, employeeId: mentor.employeeId || "" },
  });
}

// POST /api/admin/instructors/:id/reassign-students
// mode: "auto" | "target". Historical completed sessions/reviews stay
// untouched. Future sessions and pending project reviews follow the student.
export async function reassignInstructorStudents(req, res) {
  const oldInstructor = await User.findOne({ _id: req.params.id, role: "instructor" })
    .select("name email assignedCourses instructorStatus");
  if (!oldInstructor) return res.status(404).json({ message: "Instructor not found" });

  const mode = String(req.body.mode || "auto");
  if (!["auto", "target"].includes(mode)) {
    return res.status(400).json({ message: "mode must be auto or target" });
  }

  const oldCourses = await coursesForInstructor(oldInstructor);
  const enrollments = await effectiveEnrollmentsForInstructor(oldInstructor, oldCourses);
  if (!enrollments.length) {
    return res.json({ message: "No assigned students to move", moved: 0, distribution: [] });
  }

  let candidates = [];
  if (mode === "target") {
    const target = await User.findOne({
      _id: req.body.targetInstructorId,
      role: "instructor",
      isActive: { $ne: false },
      $or: [
        { instructorStatus: "active" },
        { instructorStatus: { $exists: false } },
        { instructorStatus: null },
      ],
    }).select("name email assignedCourses instructorStatus isActive");
    if (!target || String(target._id) === String(oldInstructor._id)) {
      return res.status(400).json({ message: "Select a different active instructor" });
    }
    candidates = [target];
  } else {
    candidates = await User.find({
      _id: { $ne: oldInstructor._id },
      role: "instructor",
      isActive: { $ne: false },
      $or: [
        { instructorStatus: "active" },
        { instructorStatus: { $exists: false } },
        { instructorStatus: null },
      ],
    }).select("name email assignedCourses instructorStatus isActive");
  }

  if (!candidates.length) {
    return res.status(400).json({ message: "No other active instructors are available" });
  }

  const candidateLoads = [];
  for (const candidate of candidates) {
    const candidateCourses = await coursesForInstructor(candidate);
    const assigned = await effectiveEnrollmentsForInstructor(candidate, candidateCourses);
    candidateLoads.push({ instructor: candidate, load: assigned.length, moved: 0 });
  }

  const now = new Date();
  for (const enrollment of enrollments) {
    candidateLoads.sort((a, b) => a.load - b.load || String(a.instructor.name).localeCompare(String(b.instructor.name)));
    const selected = candidateLoads[0];

    enrollment.mentor = selected.instructor._id;
    await enrollment.save();

    await Promise.all([
      MentorSession.updateMany(
        {
          user: enrollment.user?._id || enrollment.user,
          course: enrollment.course?._id || enrollment.course,
          status: { $ne: "cancelled" },
          date: { $gte: now },
          $or: [{ mentor: null }, { mentor: oldInstructor._id }],
        },
        { $set: { mentor: selected.instructor._id } }
      ),
      Project.updateMany(
        {
          user: enrollment.user?._id || enrollment.user,
          course: enrollment.course?._id || enrollment.course,
          status: "submitted",
          $or: [{ assignedInstructor: null }, { assignedInstructor: oldInstructor._id }],
        },
        { $set: { assignedInstructor: selected.instructor._id } }
      ),
    ]);

    selected.load += 1;
    selected.moved += 1;
  }

  res.json({
    message: `${enrollments.length} student assignment${enrollments.length === 1 ? "" : "s"} moved successfully`,
    moved: enrollments.length,
    distribution: candidateLoads
      .filter((item) => item.moved > 0)
      .map((item) => ({ instructorId: item.instructor._id, instructorName: item.instructor.name, moved: item.moved })),
  });
}

/* =========================================================
   ASSIGNMENT STATUS REPORT - GET /api/admin/assignments
   One row per (instructor, course) pairing derived from
   Course.instructor, joined with an Assignment record that
   tracks lifecycle status (assigned -> in-progress -> completed).
   Instructors with zero courses get a "Not Assigned" row.
========================================================= */
export async function getAssignmentReport(req, res) {
  const instructors = await User.find({ role: "instructor" }, "name avatar bio");
  const courses = await Course.find({ instructor: { $ne: null } }, "title instructor");

  // Lazily create an Assignment record the first time we see a
  // (instructor, course) pairing that doesn't have one yet — this avoids
  // needing to touch the Course-creation flow to seed these.
  const rows = [];
  for (const course of courses) {
    let assignment = await Assignment.findOne({ instructor: course.instructor, course: course._id });
    if (!assignment) {
      assignment = await Assignment.create({ instructor: course.instructor, course: course._id });
    }
    rows.push(assignment);
  }

  const populatedRows = await Assignment.find({ _id: { $in: rows.map((r) => r._id) } })
    .populate("instructor", "name avatar bio")
    .populate("course", "title");

  const assignedInstructorIds = new Set(courses.map((c) => String(c.instructor)));
  const unassignedInstructors = instructors.filter((i) => !assignedInstructorIds.has(String(i._id)));

  const statusLabel = { assigned: "Assigned", "in-progress": "In Progress", completed: "Completed" };

  const assignmentRows = populatedRows.map((a) => ({
    id: a._id,
    code: `${String(a.course._id).slice(-4).toUpperCase()}-${String(a.instructor._id).slice(-4).toUpperCase()}`,
    instructorName: a.instructor.name,
    instructorAvatar: a.instructor.avatar,
    expertise: a.instructor.bio,
    courseTitle: a.course.title,
    status: a.status,
    statusLabel: statusLabel[a.status],
    dueDate: a.dueDate,
  }));

  const notAssignedRows = unassignedInstructors.map((i) => ({
    id: `unassigned-${i._id}`,
    code: null,
    instructorName: i.name,
    instructorAvatar: i.avatar,
    expertise: i.bio,
    courseTitle: null,
    status: "not-assigned",
    statusLabel: "Not Assigned",
    dueDate: null,
  }));

  res.json({ assignments: [...assignmentRows, ...notAssignedRows] });
}

// PATCH /api/admin/assignments/:id  { status, dueDate? }
export async function updateAssignmentStatus(req, res) {
  const { status, dueDate } = req.body;
  if (!["assigned", "in-progress", "completed"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const update = { status };
  if (dueDate !== undefined) update.dueDate = dueDate ? new Date(dueDate) : null;

  const assignment = await Assignment.findByIdAndUpdate(req.params.id, update, { new: true })
    .populate("instructor", "name")
    .populate("course", "title");

  if (!assignment) return res.status(404).json({ message: "Assignment not found" });
  res.json({ message: "Assignment status updated", assignment });
}



/* =========================================================
   COURSE INSIGHTS - GET /api/admin/course-insights
   Course-level analytics used by Admin > Revenue > Top Selling
   Courses > View All. Uses live Course/Enrollment/Progress/Payment
   data and returns table-ready student rows plus module analytics.
========================================================= */
export async function courseInsights(req, res) {
  const requestedCourseId = String(req.query.courseId || "").trim();

  // Show published courses first, but fall back to every course so the page
  // remains useful while a course is still being prepared.
  let availableCourses = await Course.find({ isPublished: true })
    .sort({ createdAt: -1 })
    .populate("instructor", "name email");

  if (!availableCourses.length) {
    availableCourses = await Course.find({})
      .sort({ createdAt: -1 })
      .populate("instructor", "name email");
  }

  if (!availableCourses.length) {
    return res.json({
      generatedAt: new Date().toISOString(),
      courseOptions: [],
      selectedCourseId: null,
      course: null,
      completionTracker: [],
      userStatusCounts: {
        "New User": 0,
        "Paid Active User": 0,
        "Free Active User": 0,
        "In-Active User": 0,
      },
      totalRevenue: 0,
      users: [],
    });
  }

  let selectedCourse = requestedCourseId
    ? availableCourses.find((course) => String(course._id) === requestedCourseId)
    : null;

  // If no course was requested, open the best-selling paid course first.
  if (!selectedCourse) {
    const topPaidCourse = await Payment.aggregate([
      { $match: { status: "paid" } },
      { $unwind: "$courses" },
      { $group: { _id: "$courses", orders: { $sum: 1 } } },
      { $sort: { orders: -1 } },
      { $limit: 1 },
    ]);

    if (topPaidCourse[0]?._id) {
      selectedCourse = availableCourses.find(
        (course) => String(course._id) === String(topPaidCourse[0]._id)
      );
    }
  }

  selectedCourse = selectedCourse || availableCourses[0];
  const courseId = selectedCourse._id;

  const [lessons, enrollments, progresses, payments] = await Promise.all([
    Lesson.find({ course: courseId }).sort({ order: 1, createdAt: 1 }),
    Enrollment.find({ course: courseId })
      .sort({ enrolledAt: -1, createdAt: -1 })
      .populate("user", "name email location isActive createdAt"),
    Progress.find({ course: courseId })
      .populate("lastLesson", "title module order"),
    Payment.find({ status: "paid", courses: courseId })
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .populate("courses", "title price"),
  ]);

  const progressByUser = new Map(
    progresses.map((progress) => [String(progress.user), progress])
  );

  const calculateCourseShare = (payment, fieldName) => {
    const purchasedCourses = (payment.courses || []).filter(Boolean);
    const rawValue = Number(payment[fieldName] || 0);
    if (!purchasedCourses.length) return 0;

    const totalListPrice = purchasedCourses.reduce(
      (sum, course) => sum + Number(course.price || 0),
      0
    );
    const selectedPrice = Number(
      purchasedCourses.find((course) => String(course._id) === String(courseId))?.price || 0
    );

    if (totalListPrice > 0 && selectedPrice > 0) {
      return rawValue * (selectedPrice / totalListPrice);
    }
    return rawValue / purchasedCourses.length;
  };

  const paymentByUser = new Map();
  let totalRevenue = 0;

  for (const payment of payments) {
    if (!payment.user) continue;
    const userId = String(payment.user._id);
    const paidShare = calculateCourseShare(payment, "amount");
    const discountShare = calculateCourseShare(payment, "discount");
    totalRevenue += paidShare;

    const current = paymentByUser.get(userId) || {
      paidAmount: 0,
      discountApplied: 0,
      purchaseDate: payment.createdAt,
      promoCode: "",
    };

    current.paidAmount += paidShare;
    current.discountApplied += discountShare;
    // Payments are sorted newest-first, so keep the newest purchase date.
    if (!current.purchaseDate || payment.createdAt > current.purchaseDate) {
      current.purchaseDate = payment.createdAt;
    }
    if (!current.promoCode && payment.promoCode) current.promoCode = payment.promoCode;

    paymentByUser.set(userId, current);
  }

  const orderedModuleNames = [];
  const seenModules = new Set();

  for (const moduleName of selectedCourse.modules || []) {
    const normalized = String(moduleName || "").trim();
    if (normalized && !seenModules.has(normalized)) {
      orderedModuleNames.push(normalized);
      seenModules.add(normalized);
    }
  }

  for (const lesson of lessons) {
    const normalized = String(lesson.module || "").trim();
    if (normalized && !seenModules.has(normalized)) {
      orderedModuleNames.push(normalized);
      seenModules.add(normalized);
    }
  }

  if (!orderedModuleNames.length && lessons.length) {
    orderedModuleNames.push("Course Lessons");
  }

  const getLessonModule = (lesson) => {
    const moduleName = String(lesson.module || "").trim();
    return moduleName || (orderedModuleNames.length === 1 ? orderedModuleNames[0] : "Course Lessons");
  };

  const activeEnrollments = enrollments.filter(
    (enrollment) => enrollment.status !== "cancelled" && enrollment.user
  );

  const moduleAnalytics = orderedModuleNames.map((moduleName, moduleIndex) => {
    const moduleLessons = lessons.filter(
      (lesson) => getLessonModule(lesson) === moduleName
    );
    const lessonIds = new Set(moduleLessons.map((lesson) => String(lesson._id)));

    let totalPercent = 0;
    let participantCount = 0;

    for (const enrollment of activeEnrollments) {
      const progress = progressByUser.get(String(enrollment.user._id));
      if (!progress) {
        participantCount += 1;
        continue;
      }

      if (!moduleLessons.length) {
        totalPercent += Number(progress.percentage || 0);
        participantCount += 1;
        continue;
      }

      const completedSet = new Set(
        (progress.completedLessons || []).map((lessonId) => String(lessonId))
      );
      const completedInModule = [...lessonIds].filter((id) => completedSet.has(id)).length;
      totalPercent += (completedInModule / moduleLessons.length) * 100;
      participantCount += 1;
    }

    return {
      id: `${moduleIndex + 1}`,
      name: moduleName,
      lessonCount: moduleLessons.length,
      completionRate: participantCount
        ? Math.round((totalPercent / participantCount) * 10) / 10
        : 0,
    };
  });

  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  const userRows = enrollments
    .filter((enrollment) => enrollment.user)
    .map((enrollment) => {
      const user = enrollment.user;
      const userId = String(user._id);
      const progress = progressByUser.get(userId);
      const payment = paymentByUser.get(userId);

      const completedSet = new Set(
        (progress?.completedLessons || []).map((lessonId) => String(lessonId))
      );
      const firstIncompleteLesson = lessons.find(
        (lesson) => !completedSet.has(String(lesson._id))
      );

      let ongoingModule = "Not Started";
      if (Number(progress?.percentage || 0) >= 100 || enrollment.status === "completed") {
        ongoingModule = "Completed";
      } else if (progress?.lastLesson?.module) {
        ongoingModule = progress.lastLesson.module;
      } else if (firstIncompleteLesson) {
        ongoingModule = getLessonModule(firstIncompleteLesson);
      } else if (orderedModuleNames[0]) {
        ongoingModule = orderedModuleNames[0];
      }

      const enrolledAt = enrollment.enrolledAt || enrollment.createdAt;
      const isNew = enrolledAt && now - new Date(enrolledAt).getTime() <= thirtyDaysMs;

      let userStatus = "Free Active User";
      if (!user.isActive || enrollment.status === "cancelled") {
        userStatus = "In-Active User";
      } else if (isNew) {
        userStatus = "New User";
      } else if (payment) {
        userStatus = "Paid Active User";
      }

      return {
        id: enrollment._id,
        userId: user._id,
        username: user.name,
        email: user.email,
        city: user.location || "—",
        date: enrolledAt,
        completionRate: Math.round(Number(progress?.percentage || 0) * 10) / 10,
        ongoingModule,
        discountApplied: Math.round(Number(payment?.discountApplied || 0)),
        paidAmount: Math.round(Number(payment?.paidAmount || 0)),
        promoCode: payment?.promoCode || "",
        userStatus,
        enrollmentStatus: enrollment.status,
      };
    });

  const userStatusCounts = {
    "New User": 0,
    "Paid Active User": 0,
    "Free Active User": 0,
    "In-Active User": 0,
  };

  for (const row of userRows) {
    userStatusCounts[row.userStatus] = (userStatusCounts[row.userStatus] || 0) + 1;
  }

  const activeProgressValues = activeEnrollments.map((enrollment) =>
    Number(progressByUser.get(String(enrollment.user._id))?.percentage || 0)
  );
  const totalCompletionRate = activeProgressValues.length
    ? Math.round(
        (activeProgressValues.reduce((sum, value) => sum + value, 0) /
          activeProgressValues.length) *
          10
      ) / 10
    : 0;

  const lessonMinutes = lessons.reduce(
    (sum, lesson) =>
      sum +
      Number(lesson.durationMinutes || 0) +
      Number(lesson.durationSeconds || 0) / 60,
    0
  );
  const durationMinutes =
    Number(selectedCourse.durationMinutes || 0) || Math.round(lessonMinutes);

  res.json({
    generatedAt: new Date().toISOString(),
    courseOptions: availableCourses.map((course) => ({
      id: course._id,
      title: course.title,
      thumbnail: course.thumbnail || "",
      isPublished: course.isPublished,
    })),
    selectedCourseId: courseId,
    course: {
      id: selectedCourse._id,
      title: selectedCourse.title,
      thumbnail: selectedCourse.thumbnail || "",
      price: selectedCourse.price || 0,
      moduleCount: orderedModuleNames.length,
      lessonCount: lessons.length,
      durationMinutes,
      instructorName: selectedCourse.instructor?.name || "Not Assigned",
      totalCompletionRate,
      enrolledUsers: userRows.length,
    },
    completionTracker: moduleAnalytics,
    userStatusCounts,
    totalRevenue: Math.round(totalRevenue),
    users: userRows,
  });
}


/* =========================================================
   STUDENT PURCHASE REPORT - GET /api/admin/purchase-report
   Uses successful payments as the source of truth. A cart payment can
   contain multiple courses, so one report row is returned per course.
========================================================= */
export async function getPurchaseReport(req, res) {
  const paidPayments = await Payment.find({ status: "paid" })
    .sort({ createdAt: -1 })
    .populate("user", "name email")
    .populate({
      path: "courses",
      select: "title instructor",
      populate: { path: "instructor", select: "name email" },
    });

  const validPayments = paidPayments.filter(
    (payment) => payment.user && Array.isArray(payment.courses) && payment.courses.length > 0
  );

  const userIds = [...new Set(validPayments.map((payment) => String(payment.user._id)))];
  const courseIds = [
    ...new Set(
      validPayments.flatMap((payment) =>
        payment.courses.filter(Boolean).map((course) => String(course._id))
      )
    ),
  ];

  const enrollments =
    userIds.length && courseIds.length
      ? await Enrollment.find({
          user: { $in: userIds },
          course: { $in: courseIds },
        })
          .select("user course status enrolledAt mentor")
          .populate("mentor", "name email employeeId")
      : [];

  const enrollmentMap = new Map(
    enrollments.map((enrollment) => [
      `${String(enrollment.user)}:${String(enrollment.course)}`,
      enrollment,
    ])
  );

  const rows = [];
  const mentorIds = new Set();

  for (const payment of validPayments) {
    for (const course of payment.courses.filter(Boolean)) {
      const enrollment = enrollmentMap.get(`${String(payment.user._id)}:${String(course._id)}`);
      const mentor = enrollment?.mentor || course.instructor || null;
      if (mentor?._id) mentorIds.add(String(mentor._id));

      const enrollmentStatus = enrollment?.status || "active";
      const mentorName = mentor?.name || "Not Assigned";

      rows.push({
        id: `${payment._id}-${course._id}`,
        paymentId: payment._id,
        studentId: payment.user._id,
        courseId: course._id,
        enrollmentId: enrollment?._id || null,

        studentName: payment.user.name,
        name: payment.user.name,
        email: payment.user.email,
        studentEmail: payment.user.email,

        purchasedCourse: course.title,
        course: course.title,
        courseTitle: course.title,

        purchaseDate: payment.createdAt,
        date: payment.createdAt,
        enrolledAt: enrollment?.enrolledAt || payment.createdAt,

        status: enrollmentStatus,
        paymentStatus: "paid",

        mentorId: mentor?._id || null,
        mentor: mentorName,
        mentorName,
        assignedMentor: mentorName,
        mentorEmail: mentor?.email || "",

        amount: payment.amount,
        promoCode: payment.promoCode || "",
      });
    }
  }

  const studentsPurchased = new Set(
    validPayments.map((payment) => String(payment.user._id))
  ).size;
  const coursePurchases = rows.length;
  const mentorsAssigned = mentorIds.size;

  const stats = { studentsPurchased, coursePurchases, mentorsAssigned };

  res.json({
    stats,
    studentsPurchased,
    coursePurchases,
    mentorsAssigned,
    totalStudents: studentsPurchased,
    totalPurchases: coursePurchases,
    totalMentors: mentorsAssigned,
    rows,
    students: rows,
    purchases: rows,
    purchaseReports: rows,
  });
}


/* =========================================================
   SALES PROMO DASHBOARD - GET /api/admin/sales
   Shows each sales team member and attributes PAID purchases
   to the promo code saved on the Payment record.
========================================================= */
export async function salesDashboard(req, res) {
  const [salesPeople, performance, recentPurchases, uniquePromoStudents] = await Promise.all([
    SalesPerson.find({ removedAt: null }).sort({ createdAt: 1 }),
    Payment.aggregate([
      { $match: { status: "paid", salesPerson: { $ne: null } } },
      {
        $group: {
          _id: "$salesPerson",
          paidOrders: { $sum: 1 },
          students: { $addToSet: "$user" },
          revenue: { $sum: "$amount" },
          discountGiven: { $sum: { $ifNull: ["$discount", 0] } },
          coursesSold: { $sum: { $size: { $ifNull: ["$courses", []] } } },
          lastSaleAt: { $max: "$createdAt" },
        },
      },
    ]),
    Payment.find({ status: "paid", salesPerson: { $ne: null } })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("user", "name email")
      .populate("courses", "title")
      .populate("salesPerson", "name promoCode"),
    Payment.distinct("user", { status: "paid", salesPerson: { $ne: null } }),
  ]);

  const perfMap = new Map(performance.map((row) => [String(row._id), row]));

  const rows = salesPeople.map((person) => {
    const perf = perfMap.get(String(person._id));
    return {
      id: person._id,
      name: person.name,
      email: person.email,
      phone: person.phone,
      promoCode: person.promoCode,
      discountPercent: person.discountPercent,
      maxDiscount: person.maxDiscount,
      isActive: person.isActive,
      createdAt: person.createdAt,
      studentsPurchased: perf?.students?.length || 0,
      paidOrders: perf?.paidOrders || 0,
      coursesSold: perf?.coursesSold || 0,
      revenue: perf?.revenue || 0,
      discountGiven: perf?.discountGiven || 0,
      lastSaleAt: perf?.lastSaleAt || null,
    };
  });

  // Keep company-level historical sales totals even after a sales person is removed.
  const summary = performance.reduce(
    (acc, row) => {
      acc.totalRevenue += Number(row.revenue || 0);
      acc.totalPaidOrders += Number(row.paidOrders || 0);
      acc.totalCoursesSold += Number(row.coursesSold || 0);
      return acc;
    },
    {
      totalRevenue: 0,
      totalPaidOrders: 0,
      totalStudents: uniquePromoStudents.length,
      totalCoursesSold: 0,
      activeSalesPeople: rows.filter((row) => row.isActive).length,
    }
  );

  res.json({
    summary,
    salesPeople: rows,
    recentPurchases: recentPurchases
      .filter((payment) => payment.user && payment.salesPerson)
      .map((payment) => ({
        id: payment._id,
        studentName: payment.user.name,
        studentEmail: payment.user.email,
        salesPersonName: payment.salesPerson.name,
        promoCode: payment.promoCode || payment.salesPerson.promoCode,
        courses: (payment.courses || []).filter(Boolean).map((course) => course.title),
        subtotal: payment.subtotal ?? payment.amount,
        discount: payment.discount || 0,
        amount: payment.amount,
        date: payment.createdAt,
      })),
  });
}

// POST /api/admin/sales
export async function createSalesPerson(req, res) {
  const name = String(req.body.name || "").trim();
  const promoCode = String(req.body.promoCode || "").trim().toUpperCase();

  if (!name || !promoCode) {
    return res.status(400).json({ message: "Sales person name and promo code are required" });
  }
  if (!/^[A-Z0-9_-]{3,30}$/.test(promoCode)) {
    return res.status(400).json({
      message: "Promo code must be 3-30 characters and use only letters, numbers, - or _",
    });
  }

  try {
    const salesPerson = await SalesPerson.create({
      name,
      email: String(req.body.email || "").trim(),
      phone: String(req.body.phone || "").trim(),
      promoCode,
      discountPercent: req.body.discountPercent ?? 10,
      maxDiscount: req.body.maxDiscount ?? 500,
      isActive: req.body.isActive ?? true,
    });
    res.status(201).json({ message: "Sales person added", salesPerson });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "This promo code already exists" });
    }
    throw error;
  }
}

// PATCH /api/admin/sales/:id
export async function updateSalesPerson(req, res) {
  const allowed = ["name", "email", "phone", "promoCode", "discountPercent", "maxDiscount", "isActive"];
  const update = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }
  if (update.promoCode !== undefined) {
    update.promoCode = String(update.promoCode).trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,30}$/.test(update.promoCode)) {
      return res.status(400).json({ message: "Invalid promo code format" });
    }
  }
  if (update.name !== undefined) update.name = String(update.name).trim();
  if (update.email !== undefined) update.email = String(update.email).trim().toLowerCase();
  if (update.phone !== undefined) update.phone = String(update.phone).trim();

  try {
    const salesPerson = await SalesPerson.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!salesPerson) return res.status(404).json({ message: "Sales person not found" });
    res.json({ message: "Sales person updated", salesPerson });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "This promo code already exists" });
    }
    throw error;
  }
}

// DELETE /api/admin/sales/:id
// Soft-remove a sales person so their promo code stops working while historical
// payment attribution remains intact for reporting/audit purposes.
export async function deleteSalesPerson(req, res) {
  const salesPerson = await SalesPerson.findById(req.params.id);
  if (!salesPerson || salesPerson.removedAt) {
    return res.status(404).json({ message: "Sales person not found" });
  }

  salesPerson.isActive = false;
  salesPerson.removedAt = new Date();
  await salesPerson.save();

  res.json({ message: "Sales person removed" });
}



/* =========================================================
   EMPLOYEE MANAGEMENT
========================================================= */
const ALL_ADMIN_PERMISSIONS = [
  "dashboard", "reports", "courses", "revenue", "instructors",
  "certificates", "employees", "sales", "sales_manage", "instructor_portal",
];

const rolePermissionDefaults = {
  sales: ["sales"],
  instructor: ["instructor_portal"],
  content_reviewer: ["courses"],
  academic_manager: ["dashboard", "reports", "courses", "instructors", "certificates"],
  analyst: ["dashboard", "reports", "revenue"],
  support: ["dashboard", "reports"],
  operations: ["dashboard", "reports", "courses", "revenue"],
  management: ["dashboard", "reports", "revenue", "instructors", "certificates", "employees", "sales_manage"],
  admin: [...ALL_ADMIN_PERMISSIONS],
};

function employeePayload(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    avatar: user.avatar || "",
    employeeId: user.employeeId || "",
    employeeRole: user.employeeRole || "",
    department: user.department || "",
    isActive: user.isActive,
    adminAccess: Boolean(user.adminAccess),
    adminPermissions: user.adminPermissions || [],
    adminAccessNote: user.adminAccessNote || "",
    salesPerson: user.salesPerson || null,
    assignedCourses: user.assignedCourses || [],
    createdAt: user.createdAt,
  };
}

async function nextEmployeeId() {
  const latest = await User.findOne({ employeeId: { $regex: /^EMP-\d+$/ } })
    .sort({ employeeId: -1 })
    .select("employeeId");
  const last = Number(String(latest?.employeeId || "EMP-1000").replace("EMP-", "")) || 1000;
  return `EMP-${String(last + 1).padStart(4, "0")}`;
}

function normalizeEmployeePromoCodes(salesConfig = {}) {
  const supplied = Array.isArray(salesConfig.promoCodes) ? salesConfig.promoCodes : null;
  let rows = supplied
    ? supplied
    : salesConfig.promoCode
      ? [{
          code: salesConfig.promoCode,
          discountPercent: salesConfig.discountPercent,
          maxDiscount: salesConfig.maxDiscount,
          isActive: true,
        }]
      : [];

  rows = rows
    .map((row) => ({
      code: String(row?.code || "").trim().toUpperCase(),
      discountPercent: Math.max(0, Math.min(100, Number(row?.discountPercent ?? 10))),
      maxDiscount: Math.max(0, Number(row?.maxDiscount ?? 500)),
      isActive: row?.isActive !== false,
    }))
    .filter((row) => row.code);

  const seen = new Set();
  for (const row of rows) {
    if (!/^[A-Z0-9_-]{3,30}$/.test(row.code)) {
      throw Object.assign(new Error(`Invalid promo code: ${row.code || "empty"}`), { statusCode: 400 });
    }
    if (seen.has(row.code)) {
      throw Object.assign(new Error(`Duplicate promo code: ${row.code}`), { statusCode: 400 });
    }
    seen.add(row.code);
  }
  return rows;
}

async function assertPromoCodesAvailable(rows, currentSalesPersonId = null) {
  const codes = rows.map((row) => row.code);
  if (!codes.length) return;
  const query = {
    $or: [
      { promoCode: { $in: codes } },
      { "promoCodes.code": { $in: codes } },
    ],
  };
  if (currentSalesPersonId) query._id = { $ne: currentSalesPersonId };
  const existing = await SalesPerson.findOne(query).select("promoCode promoCodes name");
  if (existing) {
    const used = codes.find((code) => existing.promoCode === code || (existing.promoCodes || []).some((p) => p.code === code));
    throw Object.assign(new Error(`Promo code ${used || ""} is already in use`), { statusCode: 409 });
  }
}

async function syncSalesPersonForEmployee(user, salesConfig = {}) {
  if (user.employeeRole !== "sales") return null;

  let salesPerson = null;
  if (user.salesPerson) salesPerson = await SalesPerson.findById(user.salesPerson);
  if (!salesPerson) salesPerson = await SalesPerson.findOne({ $or: [{ user: user._id }, { email: user.email }] });

  let promoCodes = normalizeEmployeePromoCodes(salesConfig);
  if (!promoCodes.length && salesPerson) {
    promoCodes = salesPerson.promoCodes?.length
      ? salesPerson.promoCodes.map((p) => ({
          code: p.code,
          discountPercent: p.discountPercent,
          maxDiscount: p.maxDiscount,
          isActive: p.isActive !== false,
        }))
      : salesPerson.promoCode
        ? [{
            code: salesPerson.promoCode,
            discountPercent: salesPerson.discountPercent,
            maxDiscount: salesPerson.maxDiscount,
            isActive: salesPerson.isActive !== false,
          }]
        : [];
  }

  if (!salesPerson && !promoCodes.length) {
    throw Object.assign(new Error("At least one promo code is required for a new sales employee"), { statusCode: 400 });
  }

  await assertPromoCodesAvailable(promoCodes, salesPerson?._id || null);
  const primary = promoCodes[0];

  if (!salesPerson) {
    salesPerson = new SalesPerson({
      user: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      promoCode: primary.code,
      discountPercent: primary.discountPercent,
      maxDiscount: primary.maxDiscount,
      promoCodes,
      isActive: user.isActive,
      removedAt: null,
    });
  } else {
    salesPerson.user = user._id;
    salesPerson.name = user.name;
    salesPerson.email = user.email;
    salesPerson.phone = user.phone || "";
    salesPerson.isActive = user.isActive;
    salesPerson.removedAt = null;
    if (promoCodes.length) {
      salesPerson.promoCodes = promoCodes;
      salesPerson.promoCode = primary.code;
      salesPerson.discountPercent = primary.discountPercent;
      salesPerson.maxDiscount = primary.maxDiscount;
    }
  }

  await salesPerson.save();
  user.salesPerson = salesPerson._id;
  await user.save();
  return salesPerson;
}

// GET /api/admin/employees?q=&role=&department=&status=
export async function getEmployees(req, res) {
  const q = String(req.query.q || "").trim();
  const filter = { role: { $in: ["employee", "instructor"] } };
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: rx }, { email: rx }, { employeeId: rx }];
  }
  if (req.query.role) filter.employeeRole = req.query.role;
  if (req.query.department) filter.department = req.query.department;
  if (req.query.status === "active") filter.isActive = true;
  if (req.query.status === "inactive") filter.isActive = false;

  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .populate("salesPerson", "promoCode discountPercent maxDiscount promoCodes isActive")
    .populate("assignedCourses", "title");

  const departments = await User.distinct("department", { role: { $in: ["employee", "instructor"] }, department: { $ne: "" } });
  res.json({ employees: users.map(employeePayload), departments });
}

// GET /api/admin/employees/access-candidates?q=
export async function searchEmployeeAccessCandidates(req, res) {
  const q = String(req.query.q || "").trim();
  const filter = { role: { $in: ["employee", "instructor"] }, isActive: true };
  if (q) {
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: rx }, { email: rx }, { employeeId: rx }];
  }
  const users = await User.find(filter).sort({ name: 1 }).limit(20).populate("salesPerson", "promoCode promoCodes");
  res.json({ employees: users.map(employeePayload) });
}

// POST /api/admin/employees
export async function createEmployee(req, res) {
  const {
    name, email, phone, password, employeeRole, department,
    promoCode, promoCodes, discountPercent, maxDiscount, adminAccess,
    adminPermissions, assignedCourses,
  } = req.body;
  if (!name || !email || !employeeRole) return res.status(400).json({ message: "Name, email and employee role are required" });
  const exists = await User.findOne({ email: String(email).toLowerCase() });
  if (exists) return res.status(409).json({ message: "A user with this email already exists" });
  const tempPassword = password || "Rathi@123";
  if (tempPassword.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

  const employeeId = await nextEmployeeId();
  const requestedPermissions = Array.isArray(adminPermissions) ? adminPermissions.filter((p) => ALL_ADMIN_PERMISSIONS.includes(p)) : [];
  const user = await User.create({
    name,
    email: String(email).toLowerCase(),
    phone: phone || undefined,
    password: await bcrypt.hash(tempPassword, 12),
    role: employeeRole === "instructor" ? "instructor" : "employee",
    employeeId,
    employeeRole,
    department: department || "",
    adminAccess: Boolean(adminAccess),
    adminPermissions: Boolean(adminAccess) ? (requestedPermissions.length ? requestedPermissions : (rolePermissionDefaults[employeeRole] || [])) : [],
    assignedCourses: Array.isArray(assignedCourses) ? assignedCourses : [],
  });

  try {
    if (employeeRole === "sales") await syncSalesPersonForEmployee(user, { promoCode, promoCodes, discountPercent, maxDiscount });
  } catch (err) {
    await User.findByIdAndDelete(user._id);
    if (err?.code === 11000) return res.status(409).json({ message: "That promo code is already in use" });
    return res.status(err.statusCode || 400).json({ message: err.message || "Could not create sales employee" });
  }

  const fresh = await User.findById(user._id).populate("salesPerson", "promoCode discountPercent maxDiscount promoCodes isActive").populate("assignedCourses", "title");
  res.status(201).json({ message: "Employee added successfully", employee: employeePayload(fresh), temporaryPassword: password ? undefined : tempPassword });
}

// PATCH /api/admin/employees/:id
export async function updateEmployee(req, res) {
  const user = await User.findById(req.params.id);
  if (!user || !["employee", "instructor"].includes(user.role)) return res.status(404).json({ message: "Employee not found" });

  const allowed = ["name", "email", "phone", "employeeRole", "department", "assignedCourses"];
  for (const key of allowed) if (req.body[key] !== undefined) user[key] = req.body[key];
  if (req.body.employeeRole !== undefined) user.role = req.body.employeeRole === "instructor" ? "instructor" : "employee";
  if (req.body.password) {
    if (String(req.body.password).length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });
    user.password = await bcrypt.hash(String(req.body.password), 12);
  }
  await user.save();

  if (user.employeeRole === "sales") {
    try {
      await syncSalesPersonForEmployee(user, req.body);
    } catch (err) {
      if (err?.code === 11000) return res.status(409).json({ message: "That promo code is already in use" });
      return res.status(err.statusCode || 400).json({ message: err.message });
    }
  }

  const fresh = await User.findById(user._id).populate("salesPerson", "promoCode discountPercent maxDiscount promoCodes isActive").populate("assignedCourses", "title");
  res.json({ message: "Employee updated", employee: employeePayload(fresh) });
}

// PATCH /api/admin/employees/:id/access
export async function setEmployeeAccess(req, res) {
  const user = await User.findById(req.params.id);
  if (!user || !["employee", "instructor"].includes(user.role)) return res.status(404).json({ message: "Employee not found" });
  const enabled = Boolean(req.body.adminAccess);
  let permissions = Array.isArray(req.body.adminPermissions)
    ? req.body.adminPermissions.filter((p) => ALL_ADMIN_PERMISSIONS.includes(p))
    : [];
  if (enabled && !permissions.length) permissions = rolePermissionDefaults[user.employeeRole] || ["dashboard"];
  user.adminAccess = enabled;
  user.adminPermissions = enabled ? permissions : [];
  await user.save();
  res.json({ message: enabled ? "Admin access granted" : "Admin access removed", employee: employeePayload(user) });
}

// PATCH /api/admin/employees/:id/status
export async function setEmployeeStatus(req, res) {
  const user = await User.findById(req.params.id);
  if (!user || !["employee", "instructor"].includes(user.role)) return res.status(404).json({ message: "Employee not found" });
  user.isActive = Boolean(req.body.isActive);
  await user.save();
  if (user.salesPerson) await SalesPerson.findByIdAndUpdate(user.salesPerson, { isActive: user.isActive });
  res.json({ message: user.isActive ? "Employee activated" : "Employee deactivated", employee: employeePayload(user) });
}

// DELETE /api/admin/employees/:id
export async function deleteEmployee(req, res) {
  const user = await User.findById(req.params.id);
  if (!user || !["employee", "instructor"].includes(user.role)) return res.status(404).json({ message: "Employee not found" });
  if (user.salesPerson) {
    await SalesPerson.findByIdAndUpdate(user.salesPerson, { user: null, isActive: false, removedAt: new Date() });
  }
  await User.findByIdAndDelete(user._id);
  res.json({ message: "Employee removed. Existing sales/purchase history was preserved." });
}


// GET /api/admin/access-candidates?q=
// Search employees/instructors by name, email or employee ID and also search
// SalesPerson records by name/email/promo code so a sales rep can be granted
// a restricted login even if they were originally created only in Sales Dashboard.
export async function searchAdminAccessCandidates(req, res) {
  const q = String(req.query.q || "").trim();
  if (!q) return res.json({ candidates: [] });
  const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const [users, salesPeople] = await Promise.all([
    User.find({
      role: { $in: ["employee", "instructor"] },
      $or: [{ name: rx }, { email: rx }, { employeeId: rx }],
    }).limit(20).populate("salesPerson", "promoCode promoCodes"),
    SalesPerson.find({
      removedAt: null,
      $or: [{ name: rx }, { email: rx }, { promoCode: rx }, { "promoCodes.code": rx }],
    }).limit(20),
  ]);

  const results = users.map((u) => ({
    sourceType: "user",
    sourceId: u._id,
    name: u.name,
    email: u.email,
    employeeId: u.employeeId || "",
    employeeRole: u.employeeRole || (u.role === "instructor" ? "instructor" : "employee"),
    type: u.employeeRole === "sales" ? "Sales" : (u.role === "instructor" || u.employeeRole === "instructor") ? "Instructor" : "Employee",
    promoCode: u.salesPerson?.promoCode || "",
    promoCodes: u.salesPerson?.promoCodes || [],
    department: u.department || "",
    hasLogin: true,
    adminAccess: Boolean(u.adminAccess),
    adminPermissions: u.adminPermissions || [],
    adminAccessNote: u.adminAccessNote || "",
  }));

  const userIds = new Set(users.map((u) => String(u._id)));
  const emails = new Set(users.map((u) => u.email).filter(Boolean));
  for (const sp of salesPeople) {
    if (sp.user && userIds.has(String(sp.user))) continue;
    if (sp.email && emails.has(sp.email)) continue;
    let linked = null;
    if (sp.user) linked = await User.findById(sp.user);
    if (!linked && sp.email) linked = await User.findOne({ email: sp.email });
    results.push({
      sourceType: "sales",
      sourceId: sp._id,
      name: sp.name,
      email: sp.email || "",
      employeeId: linked?.employeeId || "",
      employeeRole: "sales",
      type: "Sales",
      promoCode: sp.promoCode,
      promoCodes: sp.promoCodes || [],
      department: linked?.department || "sales",
      hasLogin: Boolean(linked),
      adminAccess: Boolean(linked?.adminAccess),
      adminPermissions: linked?.adminPermissions || [],
      adminAccessNote: linked?.adminAccessNote || "",
    });
  }

  res.json({ candidates: results.slice(0, 30) });
}

// POST /api/admin/grant-access
// accessProfile: sales | instructor | support | operations | management | full | none
export async function grantAdminAccess(req, res) {
  const sourceType = String(req.body.sourceType || "user");
  const sourceId = req.body.sourceId;
  const accessProfile = String(req.body.accessProfile || "none");
  const tempPassword = String(req.body.tempPassword || "");
  const department = String(req.body.department || "").trim().toLowerCase();
  const accessNote = String(req.body.accessNote || "").trim();
  if (!["sales", "instructor", "support", "operations", "management", "full", "none"].includes(accessProfile)) {
    return res.status(400).json({ message: "Invalid access type" });
  }

  let user = null;
  let salesPerson = null;

  if (sourceType === "sales") {
    salesPerson = await SalesPerson.findById(sourceId);
    if (!salesPerson || salesPerson.removedAt) return res.status(404).json({ message: "Sales person not found" });
    if (salesPerson.user) user = await User.findById(salesPerson.user);
    if (!user && salesPerson.email) user = await User.findOne({ email: salesPerson.email });

    if (!user && accessProfile === "none") {
      return res.json({ message: "Admin access is already not enabled for this sales person" });
    }
    if (!user) {
      if (!salesPerson.email) return res.status(400).json({ message: "Add an email to this sales person before granting login access" });
      if (tempPassword.length < 6) return res.status(400).json({ message: "Enter a temporary password of at least 6 characters" });
      user = await User.create({
        name: salesPerson.name,
        email: salesPerson.email,
        ...(salesPerson.phone ? { phone: salesPerson.phone } : {}),
        password: await bcrypt.hash(tempPassword, 12),
        role: "employee",
        employeeRole: "sales",
        department: "sales",
      });
    }

    if (!user.employeeId) user.employeeId = await nextEmployeeId();
    user.role = user.role === "admin" ? "admin" : "employee";
    user.employeeRole = "sales";
    if (!user.department) user.department = "sales";
    user.salesPerson = salesPerson._id;
    salesPerson.user = user._id;
    salesPerson.isActive = true;
    salesPerson.removedAt = null;
    await salesPerson.save();
  } else {
    user = await User.findById(sourceId);
    if (!user) return res.status(404).json({ message: "Employee not found" });
    if (!user.employeeId) user.employeeId = await nextEmployeeId();
  }

  const permissionProfiles = {
    sales: ["sales"],
    instructor: ["instructor_portal"],
    support: ["dashboard", "reports"],
    operations: ["dashboard", "reports", "courses", "revenue"],
    management: ["dashboard", "reports", "revenue", "instructors", "certificates", "employees", "sales_manage"],
    full: [...ALL_ADMIN_PERMISSIONS],
    none: [],
  };
  const permissions = permissionProfiles[accessProfile] || [];

  user.adminAccess = accessProfile !== "none";
  user.adminPermissions = permissions;
  user.adminAccessNote = accessProfile === "none" ? "" : accessNote;
  if (department) user.department = department;
  user.isActive = true;
  if (accessProfile === "instructor") {
    user.employeeRole = "instructor";
    user.role = "instructor";
    if (!user.department) user.department = "instruction";
  }
  await user.save();

  const fresh = await User.findById(user._id)
    .populate("salesPerson", "promoCode discountPercent maxDiscount promoCodes isActive")
    .populate("assignedCourses", "title");
  res.json({ message: accessProfile === "none" ? "Admin access removed" : "Admin access granted", employee: employeePayload(fresh) });
}

/* =========================================================
   PERSONAL SALES DASHBOARD - GET /api/admin/sales/me
========================================================= */
export async function personalSalesDashboard(req, res) {
  let salesPerson = null;
  if (req.user.salesPerson) salesPerson = await SalesPerson.findById(req.user.salesPerson);
  if (!salesPerson) salesPerson = await SalesPerson.findOne({ $or: [{ user: req.user._id }, { email: req.user.email }] });
  if (!salesPerson) return res.status(404).json({ message: "No sales profile is linked to this employee account" });

  if (!salesPerson.user || String(salesPerson.user) !== String(req.user._id)) {
    salesPerson.user = req.user._id;
    await salesPerson.save();
    req.user.salesPerson = salesPerson._id;
    await req.user.save();
  }

  const payments = await Payment.find({ status: "paid", salesPerson: salesPerson._id })
    .sort({ createdAt: -1 })
    .populate("user", "name email")
    .populate("courses", "title price");

  const studentIds = new Set();
  const courseCounts = new Map();
  let revenue = 0;
  let discountGiven = 0;
  let coursesSold = 0;
  const monthly = new Map();

  for (const p of payments) {
    if (p.user) studentIds.add(String(p.user._id));
    revenue += Number(p.amount || 0);
    discountGiven += Number(p.discount || 0);
    coursesSold += (p.courses || []).length;
    for (const course of p.courses || []) {
      const key = course?.title || "Course";
      courseCounts.set(key, (courseCounts.get(key) || 0) + 1);
    }
    const d = new Date(p.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthly.set(key, (monthly.get(key) || 0) + Number(p.amount || 0));
  }

  const topCourses = [...courseCounts.entries()].map(([title, sales]) => ({ title, sales })).sort((a,b) => b.sales-a.sales).slice(0,5);
  const monthlyRevenue = [...monthly.entries()].sort(([a],[b]) => a.localeCompare(b)).slice(-6).map(([month, amount]) => ({ month, amount }));

  res.json({
    salesPerson: {
      id: salesPerson._id,
      name: salesPerson.name,
      email: salesPerson.email,
      promoCode: salesPerson.promoCode,
      promoCodes: salesPerson.promoCodes?.length ? salesPerson.promoCodes : [{
        code: salesPerson.promoCode,
        discountPercent: salesPerson.discountPercent,
        maxDiscount: salesPerson.maxDiscount,
        isActive: salesPerson.isActive,
      }],
      discountPercent: salesPerson.discountPercent,
      maxDiscount: salesPerson.maxDiscount,
      isActive: salesPerson.isActive,
    },
    stats: {
      studentsPurchased: studentIds.size,
      paidOrders: payments.length,
      coursesSold,
      revenue,
      discountGiven,
    },
    topCourses,
    monthlyRevenue,
    recentPurchases: payments.slice(0, 25).map((p) => ({
      id: p._id,
      studentName: p.user?.name || "Unknown student",
      studentEmail: p.user?.email || "",
      courses: (p.courses || []).map((c) => c.title),
      amount: p.amount,
      discount: p.discount || 0,
      promoCode: p.promoCode || salesPerson.promoCode,
      date: p.createdAt,
    })),
  });
}


/* =========================================================
   PERSONAL INSTRUCTOR DASHBOARD - GET /api/admin/instructor/me
========================================================= */
export async function personalInstructorDashboard(req, res) {
  const instructor = await User.findOne({ _id: req.user._id, role: "instructor" })
    .select("name email avatar bio employeeId department instructorStatus statusNote assignedCourses createdAt");
  if (!instructor) return res.status(404).json({ message: "Instructor profile not found" });

  const detail = await buildInstructorDetail(instructor);
  const completed = detail.students.filter((row) => row.enrollmentStatus === "completed").length;

  res.json({
    ...detail,
    summary: {
      ...detail.summary,
      completed,
    },
  });
}
