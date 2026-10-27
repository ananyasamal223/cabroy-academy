import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  ChevronDown,
  Download,
  Eye,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  UserCheck,
  UserRoundCog,
  UserX,
  Users,
} from "lucide-react";
import api from "../api/client";
import "./Instructors.css";

const STATUS_LABEL = {
  active: "Active",
  "on-leave": "On Leave",
  inactive: "Inactive",
};

function initials(name = "") {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusPill({ status }) {
  const classes =
    status === "active"
      ? "bg-[#dcf8e9] text-[#11865d]"
      : status === "on-leave"
      ? "bg-[#fff2ca] text-[#a26a00]"
      : "bg-[#fee7e7] text-[#c94343]";

  return (
    <span
      className={`ins-status inline-flex min-w-[62px] items-center justify-center rounded-full px-3 py-1.5 text-[10px] font-semibold ${classes}`}
    >
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function SelectBox({ value, onChange, children, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={onChange}
        className="h-[44px] w-full appearance-none rounded-[10px] border border-[#dfe6f0] bg-white pl-4 pr-10 text-[11px] font-medium text-[#26344d] outline-none transition focus:border-[#1677ff] focus:ring-2 focus:ring-blue-100"
      >
        {children}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#52627c]"
      />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone = "blue" }) {
  const tones = {
    blue: ["bg-[#e7f3ff]", "text-[#147ceb]"],
    green: ["bg-[#e3f9ef]", "text-[#08a663]"],
    amber: ["bg-[#fff2d7]", "text-[#f0a000]"],
    purple: ["bg-[#eee8ff]", "text-[#6b42dc]"],
  };
  const [wrap, color] = tones[tone] || tones.blue;

  return (
    <article className="ins-stat">
      <div className={`ins-stat-icon ${wrap}`}>
        <Icon size={26} className={color} strokeWidth={2} />
      </div>
      <p className="mt-4 text-[11px] font-medium text-[#596a84]">{label}</p>
      <p className="mt-1 text-[27px] font-bold leading-none text-[#111c37]">{value}</p>
    </article>
  );
}

function OverviewCard({ total, active, onLeave, inactive, loading }) {
  const pct = (n) => (total ? Math.round((Number(n || 0) / total) * 100) : 0);
  const activePct = pct(active);
  const leavePct = pct(onLeave);
  const inactivePct = Math.max(0, 100 - activePct - leavePct);

  const ring = total
    ? `conic-gradient(#10b866 0% ${activePct}%, #f6b31a ${activePct}% ${activePct + leavePct}%, #ef4444 ${activePct + leavePct}% 100%)`
    : "#edf1f6";

  return (
    <article className="ins-overview">
      <h2 className="text-[15px] font-bold text-[#17213a]">Instructor Overview</h2>
      <div className="mt-4 flex items-center gap-5">
        <div className="relative h-[116px] w-[116px] shrink-0">
          <div className="h-full w-full rounded-full" style={{ background: ring }} />
          <div className="absolute inset-[23px] flex flex-col items-center justify-center rounded-full bg-white">
            <span className="text-[22px] font-bold leading-none text-[#17213a]">
              {loading ? "…" : total}
            </span>
            <span className="mt-1 text-[9px] text-[#7c889d]">Total</span>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <OverviewLegend dot="bg-[#10b866]" label="Active" value={`${active} (${activePct}%)`} />
          <OverviewLegend dot="bg-[#f6b31a]" label="On Leave" value={`${onLeave} (${leavePct}%)`} />
          <OverviewLegend dot="bg-[#ef4444]" label="Inactive" value={`${inactive} (${inactivePct}%)`} />
        </div>
      </div>
    </article>
  );
}

function OverviewLegend({ dot, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[10px]">
      <div className="flex items-center gap-2.5 text-[#33425d]">
        <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
        <span>{label}</span>
      </div>
      <span className="whitespace-nowrap font-semibold text-[#14213a]">{value}</span>
    </div>
  );
}

function RowMenu({ instructor, onStatusChange }) {
  const navigate = useNavigate();
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const MENU_WIDTH = 226;
  const MENU_HEIGHT = 142;

  const placeMenu = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const left = Math.min(
      Math.max(12, rect.right - MENU_WIDTH),
      Math.max(12, viewportWidth - MENU_WIDTH - 12)
    );
    const roomBelow = viewportHeight - rect.bottom;
    const top =
      roomBelow >= MENU_HEIGHT + 12
        ? rect.bottom + 7
        : Math.max(12, rect.top - MENU_HEIGHT - 7);

    setPos({ top, left });
  };

  const toggle = () => {
    if (!open) placeMenu();
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (
        !buttonRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    const onViewportChange = () => setOpen(false);

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        className={`grid h-8 w-9 place-items-center rounded-[8px] transition ${
          open
            ? "bg-[#eaf3ff] text-[#146fe8]"
            : "bg-[#f6f8fc] text-[#526078] hover:bg-[#edf2f8]"
        }`}
        title="Instructor actions"
      >
        <MoreHorizontal size={17} />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
            className="ins-row-menu fixed z-[99999] overflow-hidden rounded-[12px] border border-[#dfe5ee] bg-white py-1.5 shadow-[0_18px_44px_rgba(15,23,42,.2)]"
          >
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate(`/admin/instructors/${instructor.id}`);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[10.5px] font-semibold text-[#344054] transition hover:bg-[#f4f7ff]"
            >
              <Eye size={15} className="text-[#1677ff]" />
              View Instructor Overview
            </button>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate(`/admin/instructors/${instructor.id}?reassign=1`);
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[10.5px] font-semibold text-[#344054] transition hover:bg-[#f4f7ff]"
            >
              <UserRoundCog size={15} className="text-[#6d4bdd]" />
              Reassign Students
            </button>

            <div className="mx-3 my-1 border-t border-[#edf0f5]" />

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onStatusChange(
                  instructor.id,
                  instructor.status === "inactive" ? "active" : "inactive"
                );
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[10.5px] font-semibold text-[#c33f3f] transition hover:bg-[#fff5f5]"
            >
              <UserX size={15} />
              {instructor.status === "inactive" ? "Mark Active" : "Mark Inactive"}
            </button>
          </div>,
          document.body
        )}
    </>
  );
}

function AssignmentStatus({ assignment, savingId, onChange }) {
  if (assignment.status === "not-assigned") {
    return (
      <span className="inline-flex rounded-full bg-[#f1f3f7] px-3 py-1 text-[9px] font-semibold text-[#6b7280]">
        Not Assigned
      </span>
    );
  }

  const colors =
    assignment.status === "completed"
      ? "bg-[#dcf8e9] text-[#11865d]"
      : assignment.status === "in-progress"
      ? "bg-[#fff1c9] text-[#a26a00]"
      : "bg-[#dcf8e9] text-[#11865d]";

  return (
    <select
      value={assignment.status}
      disabled={savingId === assignment.id}
      onChange={(event) => onChange(assignment.id, event.target.value)}
      className={`ins-assignment-select appearance-none rounded-full border-0 px-3 py-1 text-[9px] font-semibold outline-none ${colors}`}
      title="Change assignment status"
    >
      <option value="assigned">Assigned</option>
      <option value="in-progress">In Progress</option>
      <option value="completed">Completed</option>
    </select>
  );
}

export default function Instructors() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [course, setCourse] = useState("all");
  const [status, setStatus] = useState("all");
  const [savingStatus, setSavingStatus] = useState("");

  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [savingAssignmentId, setSavingAssignmentId] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: res } = await api.get("/admin/instructors");
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load instructors.");
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    setAssignmentsLoading(true);
    try {
      const { data: res } = await api.get("/admin/assignments");
      setAssignments(res.assignments || []);
    } catch {
      setAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  useEffect(() => {
    load();
    loadAssignments();
  }, []);

  const instructors = data?.instructors || [];

  const courses = useMemo(
    () => [
      "all",
      ...Array.from(
        new Set(instructors.flatMap((i) => i.courseTitles || []).filter(Boolean))
      ),
    ],
    [instructors]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return instructors.filter((item) => {
      const matchesSearch =
        !q ||
        [item.name, item.email, item.employeeId, ...(item.courseTitles || [])]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      const matchesCourse =
        course === "all" || (item.courseTitles || []).includes(course);
      const matchesStatus = status === "all" || item.status === status;
      return matchesSearch && matchesCourse && matchesStatus;
    });
  }, [instructors, search, course, status]);

  async function changeStatus(id, nextStatus) {
    setSavingStatus(id);
    try {
      await api.patch(`/admin/instructors/${id}/status`, { status: nextStatus });
      await load();
    } catch (err) {
      alert(err.response?.data?.message || "Could not update instructor status.");
    } finally {
      setSavingStatus("");
    }
  }

  async function changeAssignmentStatus(id, nextStatus) {
    setSavingAssignmentId(id);
    try {
      await api.patch(`/admin/assignments/${id}`, { status: nextStatus });
      await loadAssignments();
    } catch (err) {
      alert(err.response?.data?.message || "Could not update assignment status.");
    } finally {
      setSavingAssignmentId("");
    }
  }

  function resetFilters() {
    setSearch("");
    setCourse("all");
    setStatus("all");
    load();
    loadAssignments();
  }

  function exportAssignments() {
    const headers = ["Instructor", "Assigned Course", "Assignment Status", "Assigned On"];
    const rows = assignments.map((a) => [
      a.instructorName || "",
      a.courseTitle || "",
      a.statusLabel || STATUS_LABEL[a.status] || a.status || "",
      formatDate(a.assignedOn || a.createdAt || a.dueDate),
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "instructor-course-assignment-report.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const total = data?.total || 0;
  const active = data?.active || 0;
  const onLeave = data?.onLeave || 0;
  const inactive = data?.inactive || 0;
  const totalCourses = instructors.reduce(
    (sum, item) => sum + Number(item.totalCourses || 0),
    0
  );
  const totalSessions = instructors.reduce(
    (sum, item) => sum + Number(item.sessionsTaken || 0),
    0
  );

  return (
    <div className="ins-page w-full min-w-0 pb-8">
      <div className="ins-heading mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#1677ff]">
            Instructors
          </p>
          <h1 className="mt-1 text-[30px] font-bold leading-none tracking-[-0.5px] text-[#111a34]">
            Instructors
          </h1>
          <p className="mt-2 text-[11px] text-[#5f6d85]">
            Manage your instructors, assign courses, and track their performance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/admin/employees")}
          className="inline-flex h-[44px] items-center justify-center gap-2 rounded-[9px] bg-[#0878f9] px-5 text-[11px] font-semibold text-white shadow-[0_8px_18px_rgba(8,120,249,.18)] transition hover:bg-[#006fe9]"
          title="Add an instructor from Employee Management"
        >
          <Plus size={17} />
          Add Instructor
        </button>
      </div>

      <section className="ins-summary">
        <StatCard
          icon={Users}
          label="Total Instructors"
          value={loading ? "…" : total}
          tone="blue"
        />
        <StatCard
          icon={UserCheck}
          label="Active Instructors"
          value={loading ? "…" : active}
          tone="green"
        />
        <StatCard
          icon={BookOpen}
          label="Courses Assigned"
          value={loading ? "…" : totalCourses}
          tone="amber"
        />
        <StatCard
          icon={BarChart3}
          label="Sessions Taken"
          value={loading ? "…" : totalSessions}
          tone="purple"
        />
        <OverviewCard
          total={total}
          active={active}
          onLeave={onLeave}
          inactive={inactive}
          loading={loading}
        />
      </section>

      <section className="ins-panel ins-directory">
        <div className="ins-panel-heading ins-directory-heading">
          <div><h2>Instructor directory</h2><p>Manage your teaching team and their activity.</p></div>
          <span className="ins-count">{filtered.length} instructors</span>
        </div>
        <div className="ins-toolbar flex flex-col gap-3 border-b border-[#e9eef5] p-4 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#66758d]"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or employee ID..."
              className="h-[44px] w-full rounded-[10px] border border-[#dfe5ee] bg-white pl-10 pr-4 text-[11px] text-[#344054] outline-none transition placeholder:text-[#7c879a] focus:border-[#1677ff] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <SelectBox
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            className="lg:w-[180px]"
          >
            <option value="all">All Courses</option>
            {courses
              .filter((c) => c !== "all")
              .map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
          </SelectBox>

          <SelectBox
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="lg:w-[170px]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="on-leave">On Leave</option>
            <option value="inactive">Inactive</option>
          </SelectBox>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-[44px] items-center justify-center gap-2 rounded-[10px] border border-[#dfe5ee] bg-white px-4 text-[11px] font-semibold text-[#30405b] transition hover:bg-[#f8fafc] lg:w-[128px]"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-[11px] text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse">
            <thead>
              <tr className="bg-[#f7faff] text-left text-[9px] font-bold uppercase tracking-[.035em] text-[#4f6481]">
                <th className="w-[46px] px-4 py-3.5">#</th>
                <th className="px-3 py-3.5">Instructor</th>
                <th className="px-3 py-3.5">Email</th>
                <th className="px-3 py-3.5 text-center">Courses</th>
                <th className="px-3 py-3.5 text-center">Students</th>
                <th className="px-3 py-3.5 text-center">Sessions Taken</th>
                <th className="px-3 py-3.5">Status</th>
                <th className="w-[95px] px-4 py-3.5 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {!loading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-12 text-center text-[11px] text-[#8a94a8]"
                  >
                    No instructors match these filters.
                  </td>
                </tr>
              )}

              {filtered.map((instructor, index) => (
                <tr
                  key={instructor.id}
                  className="border-t border-[#e9eef5] transition hover:bg-[#fbfdff]"
                >
                  <td className="px-4 py-3.5 text-[10px] font-medium text-[#1f2a44]">
                    {index + 1}
                  </td>

                  <td className="px-3 py-3.5">
                    <div className="flex min-w-[170px] items-center gap-3">
                      <div className="ins-avatar grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#e8f3ff] text-[10px] font-bold text-[#1677ff]">
                        {instructor.avatar ? (
                          <img
                            src={instructor.avatar}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          initials(instructor.name)
                        )}
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/instructors/${instructor.id}`)}
                          className="block max-w-[165px] truncate text-left text-[10.5px] font-bold text-[#1472db] hover:underline"
                        >
                          {instructor.name}
                        </button>
                        <p className="mt-0.5 max-w-[165px] truncate text-[8.5px] text-[#738099]">
                          {instructor.expertise || instructor.department || "Instructor"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-3.5 text-[9.5px] text-[#53627b]">
                    {instructor.email}
                  </td>

                  <td className="px-3 py-3.5 text-center text-[10px] font-medium text-[#38516f]">
                    {instructor.totalCourses || 0}
                  </td>

                  <td className="px-3 py-3.5 text-center text-[10px] font-medium text-[#38516f]">
                    {instructor.studentsManaged || 0}
                  </td>

                  <td className="px-3 py-3.5 text-center text-[10px] font-medium text-[#38516f]">
                    {instructor.sessionsTaken || 0}
                  </td>

                  <td className="px-3 py-3.5">
                    <StatusPill status={instructor.status} />
                  </td>

                  <td className="px-4 py-3.5">
                    <div
                      className={`flex justify-center ${
                        savingStatus === instructor.id
                          ? "pointer-events-none opacity-50"
                          : ""
                      }`}
                    >
                      <RowMenu
                        instructor={instructor}
                        onStatusChange={changeStatus}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ins-pagination flex items-center justify-between border-t border-[#e9eef5] px-5 py-3.5">
          <p className="text-[9.5px] text-[#5f6d85]">
            Showing {filtered.length ? 1 : 0} to {filtered.length} of {filtered.length} instructors
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              className="grid h-9 w-9 place-items-center rounded-[8px] border border-[#dfe5ee] bg-white text-[#8a96aa] disabled:opacity-60"
            >
              ‹
            </button>
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-[8px] bg-[#0878f9] text-[11px] font-semibold text-white shadow-[0_5px_12px_rgba(8,120,249,.18)]"
            >
              1
            </button>
            <button
              type="button"
              disabled
              className="grid h-9 w-9 place-items-center rounded-[8px] border border-[#dfe5ee] bg-white text-[#8a96aa] disabled:opacity-60"
            >
              ›
            </button>
          </div>
        </div>
      </section>

      <section className="ins-panel ins-report">
        <div className="ins-panel-heading flex flex-col gap-3 border-b border-[#e9eef5] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[17px] font-bold text-[#17213a]">
              Instructor Course Assignment Report
            </h2>
            <p className="mt-1 text-[9.5px] text-[#66758d]">
              Detailed overview of instructor course ownership and assignment status.
            </p>
          </div>

          <button
            type="button"
            onClick={exportAssignments}
            className="inline-flex h-[42px] items-center justify-center gap-2 rounded-[9px] border border-[#dfe5ee] bg-white px-4 text-[10px] font-semibold text-[#1677ff] transition hover:bg-[#f7fbff]"
          >
            <Download size={15} />
            Export Report
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="bg-[#f7faff] text-left text-[9px] font-bold uppercase tracking-[.035em] text-[#4f6481]">
                <th className="w-[60px] px-5 py-3.5">#</th>
                <th className="px-4 py-3.5">Instructor</th>
                <th className="px-4 py-3.5">Assigned Course</th>
                <th className="px-4 py-3.5">Assignment Status</th>
                <th className="px-4 py-3.5">Assigned On</th>
              </tr>
            </thead>
            <tbody>
              {!assignmentsLoading && assignments.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-[11px] text-[#8a94a8]"
                  >
                    No instructor-course assignments yet.
                  </td>
                </tr>
              )}

              {assignments.map((assignment, index) => (
                <tr
                  key={assignment.id}
                  className="border-t border-[#e9eef5] transition hover:bg-[#fbfdff]"
                >
                  <td className="px-5 py-3.5 text-[10px] font-medium text-[#1f2a44]">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3.5 text-[10px] font-semibold text-[#17213a]">
                    {assignment.instructorName || "—"}
                  </td>
                  <td className="px-4 py-3.5 text-[10px] text-[#45617e]">
                    {assignment.courseTitle || "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <AssignmentStatus
                      assignment={assignment}
                      savingId={savingAssignmentId}
                      onChange={changeAssignmentStatus}
                    />
                  </td>
                  <td className="px-4 py-3.5 text-[10px] text-[#53627b]">
                    {formatDate(
                      assignment.assignedOn ||
                        assignment.createdAt ||
                        assignment.dueDate
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="ins-pagination flex items-center justify-between border-t border-[#e9eef5] px-5 py-3.5">
          <p className="text-[9.5px] text-[#5f6d85]">
            Showing {assignments.length ? 1 : 0} to {assignments.length} of {assignments.length} assignments
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled
              className="grid h-9 w-9 place-items-center rounded-[8px] border border-[#dfe5ee] bg-white text-[#8a96aa] disabled:opacity-60"
            >
              ‹
            </button>
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-[8px] bg-[#0878f9] text-[11px] font-semibold text-white"
            >
              1
            </button>
            <button
              type="button"
              disabled
              className="grid h-9 w-9 place-items-center rounded-[8px] border border-[#dfe5ee] bg-white text-[#8a96aa] disabled:opacity-60"
            >
              ›
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
