import AdminNotifications from "./AdminNotifications";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  IndianRupee,
  UserRound,
  Award,
  Search,
  Menu,
  X,
  ChevronDown,
  User,
  BarChart3,
  LogOut,
  BriefcaseBusiness,
  MessageSquareText,
} from "lucide-react";
import "./Dashboard.css";
import "./AdminFocus.css";
import { useAuth } from "../context/AuthContext";

const fullMenu = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin", end: true, permission: "dashboard" },
  { label: "User Reports", icon: Users, path: "/admin/user-overview", permission: "reports" },
  { label: "Course Creation", icon: BookOpen, path: "/admin/courses", permission: "courses" },
  { label: "Employee Management", icon: BriefcaseBusiness, path: "/admin/employees", permission: "employees" },
  { label: "Revenue", icon: IndianRupee, path: "/admin/revenue", permission: "revenue" },
  { label: "Instructors", icon: UserRound, path: "/admin/instructors", permission: "instructors" },
  { label: "Subscription Management", icon: BookOpen, path: "/admin/subscriptions", permission: "revenue" },
  { label: "Certificates", icon: Award, path: "/admin/certificates", permission: "certificates" },
  { label: "Student Feedback", icon: MessageSquareText, path: "/admin/feedback", permission: "reports" },
];

const BACKEND_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

function resolveAvatar(avatar) {
  if (!avatar) return "/admin-profile.jpg";
  if (avatar.startsWith("http") || avatar.startsWith("data:")) return avatar;
  return `${BACKEND_ORIGIN}${avatar}`;
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [navSearch, setNavSearch] = useState("");
  const dropdownRef = useRef(null);
  const permissions = user?.adminPermissions || [];
  const isMainAdmin = user?.role === "admin";
  const has = (permission) => isMainAdmin || permissions.includes(permission);

  const menu = !isMainAdmin && has("sales") && !has("sales_manage")
    ? [{ label: "My Sales Dashboard", icon: BarChart3, path: "/admin/sales", end: true }]
    : !isMainAdmin && has("instructor_portal") && permissions.length === 1
      ? [{ label: "My Instructor Dashboard", icon: UserRound, path: "/admin/instructor-dashboard", end: true }]
      : fullMenu.filter((item) => has(item.permission));

  useEffect(() => {
    const closeDropdown = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setProfileOpen(false);
    };
    const escape = (event) => { if (event.key === "Escape") { setProfileOpen(false); setNavOpen(false); } };
    document.addEventListener("keydown", escape);
    document.addEventListener("mousedown", closeDropdown);
    return () => { document.removeEventListener("mousedown", closeDropdown); document.removeEventListener("keydown", escape); };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="admin-shell min-h-screen overflow-x-hidden bg-[#f7f9fd] text-slate-900">
      {navOpen && <button type="button" tabIndex={-1} aria-label="Close admin navigation" onClick={() => setNavOpen(false)} className="fixed inset-0 z-30 bg-slate-950/35 lg:hidden" />}
      <aside id="admin-navigation" className={`${navOpen ? "admin-sidebar-open" : ""} admin-sidebar overflow-y-auto fixed inset-y-0 left-0 z-40 hidden w-[220px] border-r border-[#edf0f6] bg-white lg:flex lg:flex-col`}>
        <div className="flex h-[82px] items-center px-7">
          <button onClick={() => navigate(menu[0]?.path || "/admin")} className="text-[22px] font-black tracking-[-0.8px] text-[#172554]">
            rathi<span className="text-[#2563eb]">academy</span>
          </button>
        </div>

        <nav aria-label="Admin navigation" className="mt-3 space-y-2 px-3">{navSearch && !menu.some(item => item.label.toLowerCase().includes(navSearch.toLowerCase())) && <p className="px-4 py-3 text-sm text-slate-500">No pages found. Try another search.</p>}
          {menu.filter(item => item.label.toLowerCase().includes(navSearch.toLowerCase())).map(({ label, icon: Icon, path, end }) => (
            <NavLink
              key={label} onClick={() => { setNavOpen(false); setNavSearch(""); }}
              to={path}
              end={end}
              className={({ isActive }) => `relative flex h-[50px] items-center gap-3 rounded-xl px-5 text-[14px] font-medium transition ${isActive ? "bg-[#eef3ff] text-[#2563eb]" : "text-[#667085] hover:bg-slate-50"}`}
            >
              {({ isActive }) => <>{isActive && <span className="absolute -left-3 top-0 h-full w-[4px] rounded-r-full bg-[#2563eb]" />}<Icon size={19} />{label}</>}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 lg:pl-[220px]">
        <header className="sticky top-0 z-30 border-b border-[#edf0f6] bg-white/95 backdrop-blur">
          <div className="flex h-[82px] min-w-0 items-center gap-2 px-4 sm:gap-4 xl:px-7"><button className="admin-menu-toggle" type="button" aria-label={navOpen ? "Close navigation" : "Open navigation"} aria-controls="admin-navigation" aria-expanded={navOpen} onClick={() => setNavOpen(!navOpen)}>{navOpen ? <X size={21} /> : <Menu size={21} />}</button>
            <div className="relative hidden min-w-0 max-w-[390px] flex-1 md:block">
              <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input aria-label="Find an admin page" value={navSearch} onChange={event => { setNavSearch(event.target.value); setNavOpen(true); }} placeholder="Find an admin page..." className="h-[46px] w-full rounded-xl border border-[#e4e8f0] bg-white pl-11 pr-4 text-sm outline-none focus:border-blue-400" />
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              {(isMainAdmin || (user?.adminAccess && permissions.some(p => ["reports", "instructors"].includes(p)))) && <AdminNotifications key={user?.id || user?._id} />}
              <div ref={dropdownRef} className="relative">
                <button type="button" onClick={() => setProfileOpen((open) => !open)} className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-[#f8faff]" aria-expanded={profileOpen} aria-haspopup="menu">
                  <img src={resolveAvatar(user?.avatar)} alt={user?.name || "Admin"} className="h-10 w-10 rounded-full border border-[#e6eaf2] object-cover" onError={(event) => { event.currentTarget.src = "/admin-profile.jpg"; }} />
                  <div className="hidden text-left md:block"><div className="max-w-[150px] truncate text-[13px] font-bold text-[#101936]">{user?.name || "Rathi Admin"}</div><div className="mt-[2px] max-w-[170px] truncate text-[10px] text-slate-400">{user?.email || "Administrator"}</div></div>
                  <ChevronDown size={14} className={`hidden text-slate-500 transition-transform md:block ${profileOpen ? "rotate-180" : ""}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-[58px] z-[100] w-[245px] overflow-hidden rounded-[14px] border border-[#e5eaf2] bg-white py-2 shadow-[0_18px_45px_rgba(15,23,42,.14)]" role="menu">
                    <div className="border-b border-[#edf0f5] px-4 py-3"><p className="truncate text-[13px] font-bold text-[#101936]">{user?.name || "Rathi Admin"}</p><p className="mt-1 truncate text-[10px] text-[#8a94a8]">{user?.email || "Administrator"}</p></div>
                    <button type="button" onClick={() => { setProfileOpen(false); navigate("/admin/profile"); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-[12px] font-medium text-[#334155] transition hover:bg-[#f7f9fd]"><User size={17} />My Profile</button>
                    {(has("sales") || has("sales_manage")) && <button type="button" onClick={() => { setProfileOpen(false); navigate("/admin/sales"); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-[12px] font-medium text-[#334155] transition hover:bg-[#f7f9fd]"><BarChart3 size={17} />{!isMainAdmin && has("sales") && !has("sales_manage") ? "My Sales Dashboard" : "Sales Dashboard"}</button>}
                    {!isMainAdmin && has("instructor_portal") && <button type="button" onClick={() => { setProfileOpen(false); navigate("/admin/instructor-dashboard"); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-[12px] font-medium text-[#334155] transition hover:bg-[#f7f9fd]"><UserRound size={17} />My Instructor Dashboard</button>}
                    <div className="my-1 border-t border-[#edf0f5]" />
                    <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-3 text-left text-[12px] font-medium text-[#ef4444] transition hover:bg-red-50"><LogOut size={17} />Logout</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="min-w-0 overflow-x-hidden p-4 md:p-5 xl:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
