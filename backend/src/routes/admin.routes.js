import { notificationAccess, listAdminNotifications, readAdminNotifications } from "../controllers/adminNotification.controller.js";
import { adminCertificates } from "../controllers/certificate.controller.js";
import { Router } from "express";
import { getSubscriptionPlans, updateSubscriptionPlan } from "../controllers/subscriptionPlans.controller.js";
import { listSubscriptions, createSubscriber, editSubscriber, saveSubscriptionSettings } from "../controllers/subscriptionManagement.controller.js";
import { protect, authorizeAdminPermission } from "../middleware/auth.js";
import { dashboardOverview } from "../controllers/dashboard.controller.js";
import { userReports } from "../controllers/userReports.controller.js";
import { revenueOverview } from "../controllers/revenueOverview.controller.js";
import { instructorManagement, updateSubscriptionMentorship } from "../controllers/instructorManagement.controller.js";
import {
  dashboardStats,
  revenueStats,
  instructorOverview,
  getInstructorDetails,
  updateInstructorStatus,
  reassignInstructorStudents,
  assignEnrollmentMentor,
  getAssignmentReport,
  updateAssignmentStatus,
  getPurchaseReport,
  courseInsights,
  salesDashboard,
  createSalesPerson,
  updateSalesPerson,
  deleteSalesPerson,
  getEmployees,
  createEmployee,
  updateEmployee,
  setEmployeeAccess,
  setEmployeeStatus,
  deleteEmployee,
  searchAdminAccessCandidates,
  grantAdminAccess,
  personalSalesDashboard,
  personalInstructorDashboard,
} from "../controllers/admin.controller.js";

const router = Router();
router.get("/notifications", protect, notificationAccess, listAdminNotifications);
router.patch("/notifications/read", protect, notificationAccess, readAdminNotifications);
router.get("/certificates", protect, authorizeAdminPermission("certificates"), adminCertificates);
router.get("/subscription-plans", protect, authorizeAdminPermission("revenue"), getSubscriptionPlans);
router.put("/subscription-plans/:id", protect, authorizeAdminPermission("revenue"), updateSubscriptionPlan);
router.get("/subscriptions", protect, authorizeAdminPermission("revenue"), listSubscriptions);
router.post("/subscriptions", protect, authorizeAdminPermission("revenue"), createSubscriber);
router.patch("/subscriptions/:id", protect, authorizeAdminPermission("revenue"), editSubscriber);
router.put("/subscription-settings", protect, authorizeAdminPermission("revenue"), saveSubscriptionSettings);
router.get("/instructor-management", protect, authorizeAdminPermission("instructors"), instructorManagement);
router.patch("/subscription-mentorship/:id", protect, authorizeAdminPermission("instructors"), updateSubscriptionMentorship);
router.get("/revenue-overview", protect, authorizeAdminPermission("revenue"), revenueOverview);
router.get("/user-reports", protect, authorizeAdminPermission("reports"), userReports);
router.get("/overview", protect, authorizeAdminPermission("dashboard"), dashboardOverview);

router.get("/stats", protect, authorizeAdminPermission("dashboard"), dashboardStats);
router.get("/revenue", protect, authorizeAdminPermission("revenue"), revenueStats);
router.get("/instructors", protect, authorizeAdminPermission("instructors"), instructorOverview);
router.get("/instructors/:id", protect, authorizeAdminPermission("instructors"), getInstructorDetails);
router.patch("/instructors/:id/status", protect, authorizeAdminPermission("instructors"), updateInstructorStatus);
router.post("/instructors/:id/reassign-students", protect, authorizeAdminPermission("instructors"), reassignInstructorStudents);
router.get("/assignments", protect, authorizeAdminPermission("reports"), getAssignmentReport);
router.patch("/assignments/:id", protect, authorizeAdminPermission("reports"), updateAssignmentStatus);
router.get("/purchase-report", protect, authorizeAdminPermission("reports"), getPurchaseReport);
router.patch("/enrollments/:studentId/:courseId/mentor", protect, authorizeAdminPermission("reports"), assignEnrollmentMentor);
router.get("/course-insights", protect, authorizeAdminPermission("reports"), courseInsights);

// Company-wide sales management. Personal sales users do NOT receive this permission.
router.get("/sales", protect, authorizeAdminPermission("sales_manage"), salesDashboard);
router.post("/sales", protect, authorizeAdminPermission("sales_manage"), createSalesPerson);
router.patch("/sales/:id", protect, authorizeAdminPermission("sales_manage"), updateSalesPerson);
router.delete("/sales/:id", protect, authorizeAdminPermission("sales_manage"), deleteSalesPerson);

// Personal scoped dashboards.
router.get("/sales/me", protect, authorizeAdminPermission("sales"), personalSalesDashboard);
router.get("/instructor/me", protect, authorizeAdminPermission("instructor_portal"), personalInstructorDashboard);

// Employee management and delegated admin access.
router.get("/employees", protect, authorizeAdminPermission("employees"), getEmployees);
router.post("/employees", protect, authorizeAdminPermission("employees"), createEmployee);
router.patch("/employees/:id", protect, authorizeAdminPermission("employees"), updateEmployee);
router.patch("/employees/:id/access", protect, authorizeAdminPermission("employees"), setEmployeeAccess);
router.patch("/employees/:id/status", protect, authorizeAdminPermission("employees"), setEmployeeStatus);
router.delete("/employees/:id", protect, authorizeAdminPermission("employees"), deleteEmployee);
router.get("/access-candidates", protect, authorizeAdminPermission("employees"), searchAdminAccessCandidates);
router.post("/grant-access", protect, authorizeAdminPermission("employees"), grantAdminAccess);

export default router;
