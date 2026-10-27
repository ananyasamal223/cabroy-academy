import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  MoreHorizontal,
  RefreshCw,
  Search,
  UserCheck,
  Users,
} from "lucide-react";
import api from "../api/client";

const PAGE_SIZE = 6;

const safeLower = (value) => String(value || "").toLowerCase();

function initials(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
}

function formatDate(value, withTime = false) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const date = d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  if (!withTime) return date;
  const time = d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { date, time };
}

function dateInputValue(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function percentChange(current, previous) {
  if (!previous) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function StatCard({ icon: Icon, label, value, change, tone = "blue" }) {
  const positive = change >= 0;
  const tones = {
    blue: { wrap: "#e8f4ff", icon: "#1487e8" },
    purple: { wrap: "#f0ebff", icon: "#6f4bea" },
    green: { wrap: "#e5f9ef", icon: "#0aa56b" },
  };
  const c = tones[tone] || tones.blue;

  return (
    <div className="rounded-[16px] border border-[#e6edf6] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(31,64,110,.045)]">
      <div className="flex items-start gap-4">
        <div
          className="grid h-[54px] w-[54px] shrink-0 place-items-center rounded-[14px]"
          style={{ backgroundColor: c.wrap }}
        >
          <Icon size={25} strokeWidth={2} style={{ color: c.icon }} />
        </div>
        <div className="min-w-0 pt-0.5">
          <p className="text-[13px] font-medium text-[#536078]">{label}</p>
          <div className="mt-1 text-[28px] font-bold leading-none text-[#0f172a]">{value}</div>
          <div className={`mt-3 text-[12px] font-bold ${positive ? "text-[#12a35a]" : "text-[#e5484d]"}`}>
            {positive ? "↑" : "↓"} {positive ? "+" : ""}{change}%
          </div>
          <p className="mt-0.5 text-[11px] text-[#77839a]">vs previous 30 days</p>
        </div>
      </div>
    </div>
  );
}

function SelectBox({ value, onChange, children, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={onChange}
        className="h-[44px] w-full appearance-none rounded-[10px] border border-[#dfe5ee] bg-white pl-4 pr-10 text-[11px] font-semibold text-[#23314d] outline-none transition focus:border-[#2b6ff7] focus:ring-2 focus:ring-blue-100"
      >
        {children}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#475467]" />
    </div>
  );
}

function StatusPill({ status }) {
  const normalized = safeLower(status);
  const config =
    normalized === "completed"
      ? ["Completed", "bg-[#dff8eb] text-[#16855c]"]
      : normalized === "active"
      ? ["Active", "bg-[#dff8eb] text-[#16855c]"]
      : normalized === "pending"
      ? ["Pending", "bg-[#fff0bf] text-[#a26700]"]
      : normalized === "cancelled"
      ? ["Cancelled", "bg-[#fee7e7] text-[#c83d3d]"]
      : [status || "Active", "bg-[#eef2f7] text-[#667085]"];
  return (
    <span className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-semibold ${config[1]}`}>
      {config[0]}
    </span>
  );
}

function MentorDropdown({ row, mentors, saving, onAssign }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const currentName = row.assignedMentor || row.mentorName || row.mentor || "Not Assigned";
  const hasMentor = currentName && currentName !== "Not Assigned";

  return (
    <div ref={ref} className="relative min-w-[170px]">
      <button
        type="button"
        disabled={saving}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-[10px] px-2 py-1.5 text-left transition hover:bg-[#f7f9fc] disabled:opacity-60"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[10px] font-bold ${hasMentor ? "bg-[#e9edff] text-[#4154d9]" : "bg-[#eef2f7] text-[#8a94a8]"}`}>
            {hasMentor ? initials(currentName) : "+"}
          </div>
          <div className="min-w-0">
            <p className={`truncate text-[10px] font-semibold ${hasMentor ? "text-[#253047]" : "text-[#536078]"}`}>
              {saving ? "Assigning..." : hasMentor ? currentName : "Assign mentor"}
            </p>
            <p className="mt-0.5 text-[8px] text-[#8a94a8]">{hasMentor ? "Instructor" : "Select instructor"}</p>
          </div>
        </div>
        <ChevronDown size={13} className={`shrink-0 text-[#667085] transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-[44px] z-50 w-[245px] overflow-hidden rounded-[12px] border border-[#dfe5ee] bg-white shadow-[0_14px_35px_rgba(15,23,42,.16)]">
          {hasMentor && (
            <div className="border-b border-[#eef1f5] px-3 py-2 text-[9px] text-[#8a94a8]">
              Current mentor: <span className="font-semibold text-[#475467]">{currentName}</span>
            </div>
          )}
          <div className="max-h-[260px] overflow-y-auto py-1">
            {mentors.length === 0 ? (
              <div className="px-4 py-5 text-center text-[10px] text-[#8a94a8]">No instructors found.</div>
            ) : (
              mentors.map((mentor) => {
                const selected = currentName === mentor.name;
                return (
                  <button
                    key={mentor.id || mentor._id}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onAssign(mentor.id || mentor._id);
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-[#f4f7ff]"
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e9edff] text-[10px] font-bold text-[#4154d9]">
                      {initials(mentor.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-semibold text-[#253047]">{mentor.name}</p>
                      <p className="truncate text-[8px] text-[#8a94a8]">{mentor.email || "Instructor"}</p>
                    </div>
                    {selected && <Check size={14} className="shrink-0 text-[#2563eb]" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserOverview() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState({ rows: [], stats: {} });
  const [mentors, setMentors] = useState([]);
  const [error, setError] = useState("");
  const [savingMentorRow, setSavingMentorRow] = useState("");

  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [mentorFilter, setMentorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateOpen, setDateOpen] = useState(false);
  const [page, setPage] = useState(1);


  const load = async ({ keepDates = true } = {}) => {
    setLoading(true);
    setError("");
    try {
      const [purchaseRes, instructorRes] = await Promise.all([
        api.get("/admin/purchase-report"),
        api.get("/admin/instructors"),
      ]);

      const purchaseData = purchaseRes.data || {};
      const rows = purchaseData.rows || purchaseData.students || purchaseData.purchases || purchaseData.purchaseReports || [];
      setReport({
        rows,
        stats: purchaseData.stats || {
          studentsPurchased: purchaseData.studentsPurchased || purchaseData.totalStudents || 0,
          coursePurchases: purchaseData.coursePurchases || purchaseData.totalPurchases || rows.length,
          mentorsAssigned: purchaseData.mentorsAssigned || purchaseData.totalMentors || 0,
        },
      });
      setMentors(instructorRes.data?.instructors || []);

      if (!keepDates || (!startDate && !endDate)) {
        const dates = rows
          .map((r) => new Date(r.purchaseDate || r.date || r.enrolledAt))
          .filter((d) => !Number.isNaN(d.getTime()))
          .sort((a, b) => a - b);
        if (dates.length) {
          setStartDate(dateInputValue(dates[0]));
          setEndDate(dateInputValue(dates[dates.length - 1]));
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not load student purchase reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ keepDates: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, courseFilter, mentorFilter, statusFilter, startDate, endDate]);

  const rows = report.rows || [];

  const courseOptions = useMemo(
    () => ["all", ...Array.from(new Set(rows.map((r) => r.purchasedCourse || r.courseTitle || r.course).filter(Boolean)))],
    [rows]
  );

  const mentorOptions = useMemo(
    () => ["all", ...Array.from(new Set(rows.map((r) => r.assignedMentor || r.mentorName || r.mentor).filter((m) => m && m !== "Not Assigned")))],
    [rows]
  );

  const filteredRows = useMemo(() => {
    const q = safeLower(search).trim();
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null;

    return rows.filter((row) => {
      const name = row.studentName || row.name || "";
      const email = row.studentEmail || row.email || "";
      const course = row.purchasedCourse || row.courseTitle || row.course || "";
      const mentor = row.assignedMentor || row.mentorName || row.mentor || "Not Assigned";
      const status = row.status || "active";
      const date = new Date(row.purchaseDate || row.date || row.enrolledAt);

      const matchesSearch = !q || [name, email, course, mentor].some((v) => safeLower(v).includes(q));
      const matchesCourse = courseFilter === "all" || course === courseFilter;
      const matchesMentor = mentorFilter === "all" || mentor === mentorFilter;
      const matchesStatus = statusFilter === "all" || safeLower(status) === statusFilter;
      const matchesStart = !start || (!Number.isNaN(date.getTime()) && date >= start);
      const matchesEnd = !end || (!Number.isNaN(date.getTime()) && date <= end);
      return matchesSearch && matchesCourse && matchesMentor && matchesStatus && matchesStart && matchesEnd;
    });
  }, [rows, search, courseFilter, mentorFilter, statusFilter, startDate, endDate]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const stats = useMemo(() => {
    const now = new Date();
    const currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - 29);
    currentStart.setHours(0, 0, 0, 0);
    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 30);
    const previousEnd = new Date(currentStart);
    previousEnd.setMilliseconds(-1);

    const inPeriod = (row, a, b) => {
      const d = new Date(row.purchaseDate || row.date || row.enrolledAt);
      return !Number.isNaN(d.getTime()) && d >= a && d <= b;
    };

    const currentRows = rows.filter((r) => inPeriod(r, currentStart, now));
    const previousRows = rows.filter((r) => inPeriod(r, previousStart, previousEnd));

    const uniqueStudents = (list) => new Set(list.map((r) => String(r.studentId || r.studentEmail || r.email))).size;
    const assigned = (list) => list.filter((r) => {
      const mentor = r.assignedMentor || r.mentorName || r.mentor;
      return mentor && mentor !== "Not Assigned";
    }).length;

    return {
      students: report.stats?.studentsPurchased ?? uniqueStudents(rows),
      courses: report.stats?.coursePurchases ?? rows.length,
      mentors: assigned(rows),
      studentChange: percentChange(uniqueStudents(currentRows), uniqueStudents(previousRows)),
      courseChange: percentChange(currentRows.length, previousRows.length),
      mentorChange: percentChange(assigned(currentRows), assigned(previousRows)),
    };
  }, [rows, report.stats]);

  const resetFilters = () => {
    setSearch("");
    setCourseFilter("all");
    setMentorFilter("all");
    setStatusFilter("all");
    const dates = rows
      .map((r) => new Date(r.purchaseDate || r.date || r.enrolledAt))
      .filter((d) => !Number.isNaN(d.getTime()))
      .sort((a, b) => a - b);
    if (dates.length) {
      setStartDate(dateInputValue(dates[0]));
      setEndDate(dateInputValue(dates[dates.length - 1]));
    } else {
      setStartDate("");
      setEndDate("");
    }
  };

  const assignMentor = async (row, mentorId) => {
    if (!row.studentId || !row.courseId || !mentorId) return;
    setSavingMentorRow(row.id || `${row.studentId}-${row.courseId}`);
    try {
      // Assign only this student's enrollment to the selected mentor.
      // The course's global instructor is NOT changed.
      await api.patch(`/admin/enrollments/${row.studentId}/${row.courseId}/mentor`, { mentorId });
      await load({ keepDates: true });
    } catch (err) {
      alert(err.response?.data?.message || "Could not assign mentor. Please try again.");
    } finally {
      setSavingMentorRow("");
    }
  };

  const downloadCsv = () => {
    const header = ["Student Name", "Email", "Purchased Course", "Purchase Date", "Status", "Assigned Mentor"];
    const csvRows = filteredRows.map((row) => [
      row.studentName || row.name || "",
      row.studentEmail || row.email || "",
      row.purchasedCourse || row.courseTitle || row.course || "",
      formatDate(row.purchaseDate || row.date || row.enrolledAt),
      row.status || "active",
      row.assignedMentor || row.mentorName || row.mentor || "Not Assigned",
    ]);
    const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [header, ...csvRows].map((r) => r.map(escape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `student-purchase-report-${dateInputValue(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const rangeLabel = startDate && endDate
    ? `${formatDate(startDate)} - ${formatDate(endDate)}`
    : "Select date range";

  return (
    <div className="w-full min-w-0 rounded-[18px] bg-[linear-gradient(180deg,#f7fbff_0%,#ffffff_42%)] px-1 pb-8">
      {/* PAGE HEADER */}
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-[31px] font-bold tracking-[-0.6px] text-[#0b1739]">Student Purchase Reports</h1>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-[#8a94a8]">
            <span>Dashboard</span><span>›</span><span>User Reports</span><span>›</span>
            <span className="font-medium text-[#667085]">Student Purchase Reports</span>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center justify-end gap-3 xl:ml-auto xl:w-auto">
          <button
            type="button"
            onClick={downloadCsv}
            className="flex h-[44px] items-center gap-2 rounded-[10px] bg-[#0f6ff5] px-5 text-[11px] font-semibold text-white shadow-[0_8px_20px_rgba(15,111,245,.22)] hover:bg-[#0b62dd]"
          >
            <Download size={16} /> Download Report
          </button>

          <div className="relative ml-auto xl:ml-0">
            <button
              type="button"
              onClick={() => setDateOpen((v) => !v)}
              className="flex h-[44px] min-w-[245px] items-center justify-between gap-3 rounded-[10px] border border-[#dfe5ee] bg-white px-4 text-[11px] font-semibold text-[#23314d] shadow-sm"
            >
              <span className="flex items-center gap-2"><CalendarDays size={16} />{rangeLabel}</span>
              <ChevronDown size={14} />
            </button>
            {dateOpen && (
              <div className="absolute right-0 top-[50px] z-40 w-[310px] rounded-[14px] border border-[#dfe5ee] bg-white p-4 shadow-[0_14px_35px_rgba(15,23,42,.15)]">
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-[9px] font-semibold text-[#667085]">From
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#dfe5ee] px-2 text-[10px] outline-none focus:border-blue-500" />
                  </label>
                  <label className="text-[9px] font-semibold text-[#667085]">To
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-[#dfe5ee] px-2 text-[10px] outline-none focus:border-blue-500" />
                  </label>
                </div>
                <button onClick={() => setDateOpen(false)} className="mt-3 h-9 w-full rounded-lg bg-[#1769f5] text-[10px] font-semibold text-white">Apply Date Range</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard icon={Users} label="Students Purchased" value={loading ? "…" : stats.students} change={stats.studentChange} tone="blue" />
        <StatCard icon={BookOpen} label="Course Purchases" value={loading ? "…" : stats.courses} change={stats.courseChange} tone="purple" />
        <StatCard icon={UserCheck} label="Mentors Assigned" value={loading ? "…" : stats.mentors} change={stats.mentorChange} tone="green" />
      </div>

      {/* REPORT CARD */}
      <section className="overflow-visible rounded-[18px] border border-[#e6edf6] bg-white shadow-[0_8px_24px_rgba(31,64,110,.045)]">
        <div className="flex flex-wrap items-center gap-3 border-b border-[#edf0f5] bg-[#fbfdff] p-4">
          <div className="relative min-w-[300px] flex-1">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#476487]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, email, course or mentor..."
              className="h-[44px] w-full rounded-[10px] border border-[#dfe5ee] bg-white pl-11 pr-4 text-[11px] text-[#344054] outline-none focus:border-[#2b6ff7] focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <SelectBox value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="w-[145px]">
            <option value="all">All Courses</option>
            {courseOptions.filter((c) => c !== "all").map((c) => <option key={c} value={c}>{c}</option>)}
          </SelectBox>

          <SelectBox value={mentorFilter} onChange={(e) => setMentorFilter(e.target.value)} className="w-[155px]">
            <option value="all">All Mentors</option>
            {mentorOptions.filter((m) => m !== "all").map((m) => <option key={m} value={m}>{m}</option>)}
          </SelectBox>

          <SelectBox value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-[145px]">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </SelectBox>

          <button
            type="button"
            onClick={() => { resetFilters(); load({ keepDates: true }); }}
            className="flex h-[44px] items-center gap-2 rounded-[10px] border border-[#dfe5ee] bg-white px-4 text-[11px] font-semibold text-[#23314d]"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {error && <div className="mx-4 mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[11px] text-red-700">{error}</div>}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse">
            <thead>
              <tr className="bg-[#fafbfe] text-left text-[9px] font-bold uppercase tracking-[.02em] text-[#3d5275]">
                <th className="w-[44px] px-4 py-4">#</th>
                <th className="px-3 py-4">Student Name</th>
                <th className="px-3 py-4">Email</th>
                <th className="px-3 py-4">Purchased Course</th>
                <th className="px-3 py-4">Purchase Date</th>
                <th className="px-3 py-4">Status</th>
                <th className="px-3 py-4">Assigned Mentor</th>
                <th className="w-[70px] px-3 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {!loading && pageRows.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-[11px] text-[#8a94a8]">No purchase records match these filters.</td></tr>
              )}

              {pageRows.map((row, index) => {
                const name = row.studentName || row.name || "Student";
                const email = row.studentEmail || row.email || "—";
                const course = row.purchasedCourse || row.courseTitle || row.course || "—";
                const date = formatDate(row.purchaseDate || row.date || row.enrolledAt, true);
                const savingKey = row.id || `${row.studentId}-${row.courseId}`;
                return (
                  <tr key={savingKey} className="border-t border-[#edf0f5] text-[10px] text-[#475467] transition hover:bg-[#fbfcff]">
                    <td className="px-4 py-3.5 text-[#667085]">{(safePage - 1) * PAGE_SIZE + index + 1}</td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e7ecff] text-[10px] font-bold text-[#4154d9]">{initials(name)}</div>
                        <p className="max-w-[155px] truncate font-semibold text-[#253047]">{name}</p>
                      </div>
                    </td>
                    <td className="max-w-[200px] truncate px-3 py-3.5 text-[#667085]">{email}</td>
                    <td className="max-w-[220px] truncate px-3 py-3.5 font-medium text-[#344054]">{course}</td>
                    <td className="px-3 py-3.5">
                      {typeof date === "object" ? <><p className="font-medium text-[#344054]">{date.date}</p><p className="mt-0.5 text-[8px] text-[#8a94a8]">{date.time}</p></> : date}
                    </td>
                    <td className="px-3 py-3.5"><StatusPill status={row.status} /></td>
                    <td className="px-3 py-2.5">
                      <MentorDropdown
                        row={row}
                        mentors={mentors}
                        saving={savingMentorRow === savingKey}
                        onAssign={(mentorId) => assignMentor(row, mentorId)}
                      />
                    </td>
                    <td className="px-3 py-3.5 text-center">
                      <button type="button" className="grid h-8 w-10 place-items-center rounded-[9px] bg-[#f6f8fc] text-[#536078] hover:bg-[#eef2f8]" title="More actions">
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#edf0f5] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] text-[#667085]">
            {filteredRows.length === 0
              ? "Showing 0 entries"
              : `Showing ${(safePage - 1) * PAGE_SIZE + 1} to ${Math.min(safePage * PAGE_SIZE, filteredRows.length)} of ${filteredRows.length} entries`}
          </p>
          <div className="flex items-center gap-2">
            <button disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="grid h-9 w-9 place-items-center rounded-[9px] border border-[#dfe5ee] text-[#667085] disabled:opacity-35"><ChevronLeft size={15} /></button>
            <button className="grid h-9 min-w-9 place-items-center rounded-[9px] bg-[#1769f5] px-3 text-[11px] font-semibold text-white">{safePage}</button>
            <button disabled={safePage >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} className="grid h-9 w-9 place-items-center rounded-[9px] border border-[#dfe5ee] text-[#667085] disabled:opacity-35"><ChevronRight size={15} /></button>
          </div>
        </div>
      </section>
    </div>
  );
}
