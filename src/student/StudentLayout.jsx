import StudentNotifications from "./StudentNotifications";
import { useEffect, useRef, useState } from "react";
import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import {
  LayoutDashboard,
  BookOpen,
  FolderKanban,
  Users,
  Award,
  Search,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const menu = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "My Courses",
    path: "/my-courses",
    icon: BookOpen,
  },
  {
    name: "Projects",
    path: "/projects",
    icon: FolderKanban,
  },
  {
    name: "Community",
    path: "/community",
    icon: Users,
  },
  {
    name: "Certificates",
    path: "/certificates",
    icon: Award,
  },
];

export default function StudentLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const menuButtonRef = useRef(null);

  const dropdownRef = useRef(null);

  /* Close profile popup when clicking outside */
  useEffect(() => {
    const closeDropdown = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    const escape = event => { if (event.key === "Escape") { setProfileOpen(false); setNavOpen(false); } };
    document.addEventListener("keydown", escape);
    document.addEventListener("mousedown", closeDropdown);

    return () => {
      document.removeEventListener("mousedown", closeDropdown);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  const closeNavigation = () => { setNavOpen(false); menuButtonRef.current?.focus(); };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="student-shell min-h-screen bg-[#f7f9ff] text-[#101936]">
      {navOpen && <button type="button" tabIndex={-1} aria-label="Close student navigation" onClick={closeNavigation} className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" />}

      {/* ==================================================
          LEFT SIDEBAR
      ================================================== */}

      <aside id="student-navigation" aria-label="Student navigation" className={`student-sidebar fixed inset-y-0 left-0 z-50 w-[220px] flex-col overflow-y-auto border-r border-[#e9edf5] bg-white ${navOpen ? "flex" : "hidden lg:flex"}`}>

        {/* LOGO */}
        <div className="flex h-[82px] shrink-0 items-center justify-between px-4">
          <button
            onClick={() => { setNavOpen(false); navigate("/dashboard"); }}
            className="text-[23px] font-black tracking-[-1px] text-[#101936]"
          >
            rathi
            <span className="text-[#2563eb]">
              academy
            </span>
          </button>
        </div>

        <button type="button" onClick={closeNavigation} className="mx-4 mb-2 flex min-h-11 items-center gap-2 text-sm text-slate-500 lg:hidden"><X size={18} />Close menu</button>
        {/* NAVIGATION */}
        <nav className="mt-5 space-y-2 px-3">
          {menu.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.name}
                onClick={() => { setNavOpen(false); setProfileOpen(false); }}
                to={item.path}
                className={({ isActive }) =>
                  `relative flex h-[50px] items-center gap-3 rounded-xl px-5 text-[14px] font-medium transition-all ${isActive
                    ? "bg-[#eef4ff] text-[#2563eb]"
                    : "text-[#667085] hover:bg-[#f7f9fd] hover:text-[#2563eb]"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute -left-3 top-[7px] h-9 w-[4px] rounded-r-full bg-[#2563eb]" />
                    )}

                    <Icon
                      size={19}
                      strokeWidth={2}
                    />

                    <span>
                      {item.name}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* NOTHING ELSE HERE */}
        {/* No Settings */}
        {/* No Profile */}
        {/* No Logout */}
      </aside>

      {/* ==================================================
          RIGHT SIDE
      ================================================== */}

      <div className="min-w-0 lg:pl-[220px]">

        {/* ==================================================
            TOP HEADER
        ================================================== */}

        <header className="sticky top-0 z-30 border-b border-[#edf0f6] bg-white/95 backdrop-blur">

          <div className="flex h-[72px] min-w-0 items-center gap-3 px-4 md:h-[82px] md:px-7">

            <button ref={menuButtonRef} type="button" aria-label="Open student navigation" aria-expanded={navOpen} aria-controls="student-navigation" onClick={() => { setNavOpen(true); setProfileOpen(false); }} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 lg:hidden"><Menu size={21} /></button>
            {/* SEARCH */}
            <div className="relative hidden min-w-0 flex-1 max-w-[470px] md:block">

              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8993aa]"
              />

              <input
                type="text"
                placeholder="Search courses, lessons..."
                className="h-[46px] w-full rounded-xl border border-[#e0e5ee] bg-white pl-11 pr-4 text-[13px] text-[#334155] outline-none transition focus:border-[#2563eb]"
              />
            </div>

            {/* RIGHT AREA */}
            <div className="ml-auto flex shrink-0 items-center gap-3">

              {/* NOTIFICATION */}
              <StudentNotifications />

              <div className="mx-1 hidden h-8 w-px bg-[#e6e9ef] sm:block" />

              {/* ==================================================
                  PROFILE
              ================================================== */}

              <div
                ref={dropdownRef}
                className="relative"
              >
                <button
                  onClick={() =>
                    setProfileOpen(
                      !profileOpen
                    )
                  }
                  className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-[#f8faff]"
                >

                  {/* PROFILE IMAGE */}

                  <img
                    src="/student-profile.jpg"
                    alt="Student"
                    className="h-[42px] w-[42px] rounded-full border border-[#e6eaf2] object-cover"
                    onError={(event) => {
                      event.currentTarget.style.display =
                        "none";
                    }}
                  />

                  {/* NAME */}

                  <div className="hidden min-w-0 max-w-[170px] text-left sm:block">

                    <p className="truncate text-[13px] font-bold text-[#101936]">
                      {user?.name || "Student"}
                    </p>

                    <p className="truncate mt-[2px] text-[10px] text-[#8a94a8]">
                      {user?.email || "Student"}
                    </p>
                  </div>

                  <ChevronDown
                    size={15}
                    className={`hidden text-[#7d879b] transition-transform sm:block ${profileOpen
                      ? "rotate-180"
                      : ""
                      }`}
                  />
                </button>

                {/* ==================================================
                    PROFILE DROPDOWN
                ================================================== */}

                {profileOpen && (
                  <div className="absolute right-0 top-[58px] z-[100] w-[220px] overflow-hidden rounded-[14px] border border-[#e5eaf2] bg-white py-2 shadow-[0_18px_45px_rgba(15,23,42,.14)]">

                    {/* PROFILE HEADER */}

                    <div className="border-b border-[#edf0f5] px-4 py-3">

                      <p className="text-[13px] font-bold text-[#101936]">
                        {user?.name || "Student"}
                      </p>

                      <p className="mt-1 text-[10px] text-[#8a94a8]">
                        {user?.email || "Student Account"}
                      </p>
                    </div>

                    {/* MY PROFILE */}

                    <button
                      onClick={() =>
                        { setProfileOpen(false); navigate("/profile"); }
                      }
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-[12px] font-medium text-[#334155] transition hover:bg-[#f7f9fd]"
                    >
                      <User
                        size={17}
                      />

                      My Profile
                    </button>

                    {/* SETTINGS */}

                    <button
                      onClick={() =>
                        { setProfileOpen(false); navigate("/settings"); }
                      }
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-[12px] font-medium text-[#334155] transition hover:bg-[#f7f9fd]"
                    >
                      <Settings
                        size={17}
                      />

                      Settings
                    </button>

                    <div className="my-1 border-t border-[#edf0f5]" />

                    {/* LOGOUT */}

                    <button
                      onClick={
                        handleLogout
                      }
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-[12px] font-medium text-[#ef4444] transition hover:bg-red-50"
                    >
                      <LogOut
                        size={17}
                      />

                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ==================================================
            EVERY STUDENT PAGE APPEARS HERE
        ================================================== */}

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}