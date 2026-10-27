export function planCheckoutPath(search = "") {
  const params = new URLSearchParams(search);
  const plan = params.get("plan");
  if (!["starter", "pro", "business"].includes(plan)) return null;
  return `/plans/${plan}/checkout?billing=${params.get("billing") === "yearly" ? "yearly" : "monthly"}`;
}

export function postAuthDestination(user, from, search = "") {
  if (user?.role === "admin") return "/admin";
  if (user?.adminAccess) {
    const permissions = user.adminPermissions || [];
    if (permissions.includes("sales") && !permissions.includes("sales_manage")) return "/admin/sales";
    if (permissions.includes("instructor_portal")) return "/admin/instructor-dashboard";
    return "/admin";
  }

  const planPath = planCheckoutPath(search);
  if (planPath) return planPath;

  const pathname = typeof from === "string" ? from : from?.pathname;
  if (pathname?.startsWith("/") && !pathname.startsWith("//") &&
      !pathname.includes("\\") && !/^\/(login|signup)(\/|$)/.test(pathname)) {
    return pathname + (typeof from === "object" ? (from.search || "") + (from.hash || "") : "");
  }
  return "/dashboard";
}