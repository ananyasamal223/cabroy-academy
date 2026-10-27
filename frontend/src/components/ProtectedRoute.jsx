import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const adminPathPermission = [
  ["/admin/user-overview", "reports"],
  ["/admin/course-insights", "reports"],
  ["/admin/courses", "courses"],
  ["/admin/employees", "employees"],
  ["/admin/revenue", "revenue"],
  ["/admin/instructors", "instructors"],
  ["/admin/certificates", "certificates"],
  ["/admin/instructor-dashboard", "instructor_portal"],
];

function firstAdminPath(user) {
  if (user?.role === "admin") return "/admin";
  const perms = user?.adminPermissions || [];
  if (perms.includes("sales") && !perms.includes("sales_manage")) return "/admin/sales";
  if (perms.includes("instructor_portal")) return "/admin/instructor-dashboard";
  if (perms.includes("dashboard")) return "/admin";
  if (perms.includes("reports")) return "/admin/user-overview";
  if (perms.includes("courses")) return "/admin/courses";
  if (perms.includes("employees")) return "/admin/employees";
  if (perms.includes("revenue")) return "/admin/revenue";
  if (perms.includes("instructors")) return "/admin/instructors";
  if (perms.includes("certificates")) return "/admin/certificates";
  if (perms.includes("sales_manage")) return "/admin/sales";
  return "/dashboard";
}

function canOpenAdminPath(user, pathname) {
  if (user?.role === "admin") return true;
  if (!user?.adminAccess) return false;
  if (pathname === "/admin/profile") return true;
  const perms = user.adminPermissions || [];
  if (pathname === "/admin/sales") return perms.includes("sales") || perms.includes("sales_manage");
  if (pathname === "/admin" || pathname === "/admin/") return perms.includes("dashboard");
  const hit = adminPathPermission.find(([prefix]) => pathname.startsWith(prefix));
  return hit ? perms.includes(hit[1]) : false;
}

export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Loading...</div>;
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  if (role === "admin") {
    const hasPortal = user.role === "admin" || Boolean(user.adminAccess);
    if (!hasPortal) return <Navigate to="/dashboard" replace />;
    if (!canOpenAdminPath(user, location.pathname)) {
      return <Navigate to={firstAdminPath(user)} replace />;
    }
  } else if (role && user.role !== role) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
