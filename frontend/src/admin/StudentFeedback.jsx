import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Ellipsis,
  MessageSquareText,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import api from "../api/client";

const PAGE_SIZE = 8;

const RANGE_OPTIONS = [
  { value: "7", label: "Last 7 days", days: 7 },
  { value: "30", label: "Last 30 days", days: 30 },
  { value: "90", label: "Last 90 days", days: 90 },
  { value: "all", label: "All dates", days: null },
];

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function toApiDate(date) {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateShort(date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "—", time: "" };
  return {
    date: new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date),
  };
}

function initials(name = "Student") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "ST";
}

function escapeCsv(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function StatCard({ icon: Icon, iconBg, iconColor, value, label, growth }) {
  const positive = Number(growth) >= 0;
  return (
    <div className="rounded-[15px] border border-[#e8edf5] bg-white px-5 py-4 shadow-[0_6px_20px_rgba(27,52,89,.035)]">
      <div className="flex items-start gap-4">
        <div className={`grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[12px] ${iconBg} ${iconColor}`}>
          <Icon size={23} strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <div className="text-[24px] font-extrabold leading-none tracking-[-0.6px] text-[#111936]">{value}</div>
          <div className="mt-1 text-[12px] font-medium text-[#526078]">{label}</div>
          <div className={`mt-2 flex items-center gap-1 text-[11px] font-bold ${positive ? "text-[#18a65b]" : "text-[#e5484d]"}`}>
            <span>{positive ? "↑" : "↓"}</span>
            <span>{positive ? "+" : ""}{growth ?? 0}%</span>
          </div>
          <div className="mt-0.5 text-[10px] text-[#8c97a9]">vs previous 30 days</div>
        </div>
      </div>
    </div>
  );
}

function RatingStars({ rating }) {
  return (
    <div className="flex items-center gap-[2px] whitespace-nowrap" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={13}
          strokeWidth={1.5}
          className={star <= rating ? "fill-[#ffb51f] text-[#ffb51f]" : "fill-[#dbe2ed] text-[#dbe2ed]"}
        />
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const published = status !== "pending";
  return (
    <span className={`inline-flex min-w-[72px] items-center justify-center rounded-full px-3 py-1 text-[10px] font-semibold ${published ? "bg-[#dcf8e9] text-[#15935a]" : "bg-[#fff0c9] text-[#b87800]"}`}>
      {published ? "Published" : "Pending"}
    </span>
  );
}

export default function StudentFeedback() {
  const [rows, setRows] = useState([]);
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({ totalFeedbacks: 0, averageRating: "0.0", uniqueStudents: 0, coursesReviewed: 0 });
  const [growth, setGrowth] = useState({ totalFeedbacks: 0, averageRating: 0, uniqueStudents: 0, coursesReviewed: 0 });
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [course, setCourse] = useState("all");
  const [rating, setRating] = useState("all");
  const [status, setStatus] = useState("all");
  const [range, setRange] = useState("30");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [dateOpen, setDateOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const dateRef = useRef(null);
  const actionRef = useRef(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const close = (event) => {
      if (dateRef.current && !dateRef.current.contains(event.target)) setDateOpen(false);
      if (actionRef.current && !actionRef.current.contains(event.target)) setActionOpen(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const selectedRange = RANGE_OPTIONS.find((item) => item.value === range) || RANGE_OPTIONS[1];
  const dateRange = useMemo(() => {
    if (!selectedRange.days) return { start: null, end: null, label: "All dates" };
    const end = startOfDay(new Date());
    const start = new Date(end);
    start.setDate(end.getDate() - selectedRange.days + 1);
    return {
      start,
      end,
      label: `${formatDateShort(start)} - ${formatDateShort(end)}`,
    };
  }, [selectedRange.days]);

  const requestParams = useMemo(() => ({
    page: pagination.page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    course: course !== "all" ? course : undefined,
    rating: rating !== "all" ? rating : undefined,
    status: status !== "all" ? status : undefined,
    startDate: dateRange.start ? toApiDate(dateRange.start) : undefined,
    endDate: dateRange.end ? toApiDate(dateRange.end) : undefined,
  }), [pagination.page, debouncedSearch, course, rating, status, dateRange.start, dateRange.end]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const { data } = await api.get("/feedback/admin", { params: requestParams });
        if (cancelled) return;
        setRows(data.items || []);
        setCourses(data.courses || []);
        setStats(data.stats || {});
        setGrowth(data.growth || {});
        setPagination((current) => ({
          ...current,
          ...(data.pagination || {}),
        }));
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Could not load student feedback.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [requestParams, refreshKey]);

  function resetToFirstPage(setter, value) {
    setter(value);
    setPagination((current) => ({ ...current, page: 1 }));
  }

  async function updateStatus(item, nextStatus) {
    try {
      const { data } = await api.patch(`/feedback/admin/${item._id}/status`, { status: nextStatus });
      setActionOpen(null);
      setSelectedFeedback((current) => current?._id === item._id ? data.feedback : current);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      window.alert(err.response?.data?.message || "Could not update feedback status.");
    }
  }

  async function removeFeedback(item) {
    if (!window.confirm(`Delete feedback from ${item.user?.name || "this student"}?`)) return;
    try {
      await api.delete(`/feedback/admin/${item._id}`);
      setActionOpen(null);
      setSelectedFeedback(null);
      setRefreshKey((key) => key + 1);
    } catch (err) {
      window.alert(err.response?.data?.message || "Could not delete feedback.");
    }
  }

  async function downloadReport() {
    try {
      const { data } = await api.get("/feedback/admin/export", {
        params: {
          search: debouncedSearch || undefined,
          course: course !== "all" ? course : undefined,
          rating: rating !== "all" ? rating : undefined,
          status: status !== "all" ? status : undefined,
          startDate: dateRange.start ? toApiDate(dateRange.start) : undefined,
          endDate: dateRange.end ? toApiDate(dateRange.end) : undefined,
        },
      });

      const lines = [
        ["Student Name", "Email", "Course", "Rating", "Feedback", "Liked", "Date", "Status"],
        ...(data.items || []).map((item) => [
          item.user?.name || "",
          item.user?.email || "",
          item.course?.title || "",
          item.rating || "",
          item.comment || "",
          (item.liked || []).join(" | "),
          formatDateTime(item.createdAt).date,
          item.status || "published",
        ]),
      ];
      const csv = "\uFEFF" + lines.map((line) => line.map(escapeCsv).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `student-feedback-${toApiDate(new Date())}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      window.alert(err.response?.data?.message || "Could not download feedback report.");
    }
  }

  const rowStart = pagination.total ? (pagination.page - 1) * PAGE_SIZE + 1 : 0;
  const rowEnd = Math.min(pagination.page * PAGE_SIZE, pagination.total);

  return (
    <div className="mx-auto w-full max-w-[1500px] text-[#111936]">
      <section className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-[30px] font-extrabold tracking-[-0.8px] text-[#10162f]">Student Feedback</h1>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-[#93a0b4]">
            <span>Dashboard</span><span>›</span><span>Feedback</span><span>›</span><span>Student Feedback</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 xl:justify-end">
          <button
            type="button"
            onClick={downloadReport}
            className="inline-flex h-[44px] items-center gap-2 rounded-[9px] bg-[#0f7bf3] px-5 text-[12px] font-semibold text-white shadow-[0_7px_18px_rgba(15,123,243,.18)] transition hover:bg-[#0872e7]"
          >
            <Download size={16} /> Download Report
          </button>

          <div className="relative" ref={dateRef}>
            <button
              type="button"
              onClick={() => setDateOpen((open) => !open)}
              className="inline-flex h-[44px] min-w-[235px] items-center justify-between gap-3 rounded-[9px] border border-[#dfe5ee] bg-white px-4 text-[11px] font-semibold text-[#2c3950]"
            >
              <span className="flex items-center gap-2"><CalendarDays size={16} />{dateRange.label}</span>
              <ChevronDown size={14} className={`transition ${dateOpen ? "rotate-180" : ""}`} />
            </button>
            {dateOpen && (
              <div className="absolute right-0 top-[49px] z-50 w-[235px] overflow-hidden rounded-[10px] border border-[#e1e7ef] bg-white py-1.5 shadow-[0_16px_38px_rgba(15,23,42,.14)]">
                {RANGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => { setRange(option.value); setPagination((current) => ({ ...current, page: 1 })); setDateOpen(false); }}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[11px] font-medium ${range === option.value ? "bg-[#edf5ff] text-[#1975df]" : "text-[#46536b] hover:bg-[#f8faff]"}`}
                  >
                    {option.label}
                    {range === option.value && <CheckCircle2 size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={MessageSquareText} iconBg="bg-[#e7f3ff]" iconColor="text-[#0d75e8]" value={stats.totalFeedbacks || 0} label="Total Feedbacks" growth={growth.totalFeedbacks} />
        <StatCard icon={Star} iconBg="bg-[#fff3d9]" iconColor="text-[#ffae16]" value={stats.averageRating || "0.0"} label="Average Rating" growth={growth.averageRating} />
        <StatCard icon={UsersRound} iconBg="bg-[#f1e9ff]" iconColor="text-[#7147e8]" value={stats.uniqueStudents || 0} label="Unique Students" growth={growth.uniqueStudents} />
        <StatCard icon={ShieldCheck} iconBg="bg-[#def8eb]" iconColor="text-[#16a865]" value={stats.coursesReviewed || 0} label="Courses Reviewed" growth={growth.coursesReviewed} />
      </section>

      <section className="mt-4 rounded-[15px] border border-[#e8edf5] bg-white p-2.5 shadow-[0_6px_20px_rgba(27,52,89,.025)]">
        <div className="grid gap-2 lg:grid-cols-[minmax(320px,1fr)_180px_170px_170px_116px]">
          <div className="relative">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#53657f]" />
            <input
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPagination((current) => ({ ...current, page: 1 })); }}
              placeholder="Search by student name, email, course or feedback..."
              className="h-[44px] w-full rounded-[9px] border border-[#dfe5ee] bg-white pl-10 pr-3 text-[11px] text-[#2c3950] outline-none placeholder:text-[#8591a4] focus:border-[#8dbdf2] focus:ring-2 focus:ring-[#e7f2ff]"
            />
          </div>

          <select value={course} onChange={(event) => resetToFirstPage(setCourse, event.target.value)} className="h-[44px] rounded-[9px] border border-[#dfe5ee] bg-white px-3 text-[11px] font-semibold text-[#2c3950] outline-none focus:border-[#8dbdf2]">
            <option value="all">All Courses</option>
            {courses.map((item) => <option key={item._id} value={item._id}>{item.title}</option>)}
          </select>

          <select value={rating} onChange={(event) => resetToFirstPage(setRating, event.target.value)} className="h-[44px] rounded-[9px] border border-[#dfe5ee] bg-white px-3 text-[11px] font-semibold text-[#2c3950] outline-none focus:border-[#8dbdf2]">
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          <select value={status} onChange={(event) => resetToFirstPage(setStatus, event.target.value)} className="h-[44px] rounded-[9px] border border-[#dfe5ee] bg-white px-3 text-[11px] font-semibold text-[#2c3950] outline-none focus:border-[#8dbdf2]">
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="pending">Pending</option>
          </select>

          <button type="button" onClick={() => setRefreshKey((key) => key + 1)} className="inline-flex h-[44px] items-center justify-center gap-2 rounded-[9px] border border-[#dfe5ee] bg-white px-4 text-[11px] font-semibold text-[#2c3950] transition hover:bg-[#f8faff]">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </section>

      <section className="mt-3 overflow-visible rounded-[15px] border border-[#e8edf5] bg-white shadow-[0_6px_20px_rgba(27,52,89,.025)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] table-fixed border-collapse">
            <colgroup>
              <col className="w-[48px]" />
              <col className="w-[155px]" />
              <col className="w-[185px]" />
              <col className="w-[185px]" />
              <col className="w-[110px]" />
              <col className="w-[250px]" />
              <col className="w-[120px]" />
              <col className="w-[100px]" />
              <col className="w-[72px]" />
            </colgroup>
            <thead>
              <tr className="h-[47px] border-b border-[#e8edf5] bg-[#f8fbff] text-left text-[10px] font-bold uppercase tracking-[.02em] text-[#526079]">
                <th className="px-4">#</th>
                <th className="px-3">Student Name</th>
                <th className="px-3">Email</th>
                <th className="px-3">Course</th>
                <th className="px-3">Rating</th>
                <th className="px-3">Feedback</th>
                <th className="px-3">Date</th>
                <th className="px-3">Status</th>
                <th className="px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && rows.length === 0 ? (
                <tr><td colSpan="9" className="h-[310px] text-center text-[12px] text-[#8490a3]"><RefreshCw size={20} className="mx-auto mb-2 animate-spin" />Loading feedback...</td></tr>
              ) : error ? (
                <tr><td colSpan="9" className="h-[260px] px-6 text-center text-[12px] font-medium text-red-500">{error}</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan="9" className="h-[260px] text-center"><MessageSquareText size={28} className="mx-auto text-[#b9c5d5]" /><div className="mt-3 text-[13px] font-semibold text-[#536078]">No feedback found</div><div className="mt-1 text-[11px] text-[#95a0b1]">Student feedback will appear here automatically after submission.</div></td></tr>
              ) : rows.map((item, index) => {
                const when = formatDateTime(item.createdAt);
                const name = item.user?.name || "Student";
                const feedbackStatus = item.status || "published";
                return (
                  <tr key={item._id} className="h-[60px] border-b border-[#edf1f6] text-[10.5px] text-[#435169] last:border-b-0 hover:bg-[#fbfdff]">
                    <td className="px-4 font-medium text-[#1c2940]">{(pagination.page - 1) * PAGE_SIZE + index + 1}</td>
                    <td className="px-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e2efff] text-[10px] font-bold text-[#176fdc]">{initials(name)}</div>
                        <span className="truncate font-semibold text-[#18243c]">{name}</span>
                      </div>
                    </td>
                    <td className="truncate px-3 text-[#708098]">{item.user?.email || "—"}</td>
                    <td className="truncate px-3 text-[#435169]">{item.course?.title || "—"}</td>
                    <td className="px-3"><RatingStars rating={item.rating || 0} /></td>
                    <td className="px-3">
                      <button type="button" onClick={() => setSelectedFeedback(item)} className="line-clamp-2 max-w-[230px] text-left leading-4 text-[#55637a] hover:text-[#176fdc]" title={item.comment}>{item.comment}</button>
                    </td>
                    <td className="px-3 leading-4 text-[#56657d]"><div>{when.date}</div><div className="text-[9px] text-[#95a0b1]">{when.time}</div></td>
                    <td className="px-3"><StatusBadge status={feedbackStatus} /></td>
                    <td className="relative px-3 text-center">
                      <button type="button" onClick={() => setActionOpen(actionOpen === item._id ? null : item._id)} className="inline-grid h-8 w-8 place-items-center rounded-[8px] bg-[#f4f7fb] text-[#1f3c67] transition hover:bg-[#eaf2ff]"><Ellipsis size={17} /></button>
                      {actionOpen === item._id && (
                        <div ref={actionRef} className="absolute right-4 top-[48px] z-50 w-[175px] overflow-hidden rounded-[10px] border border-[#e3e8f0] bg-white py-1.5 text-left shadow-[0_16px_36px_rgba(15,23,42,.14)]">
                          <button type="button" onClick={() => { setSelectedFeedback(item); setActionOpen(null); }} className="w-full px-4 py-2.5 text-[11px] font-medium text-[#344257] hover:bg-[#f7f9fd]">View feedback</button>
                          <button type="button" onClick={() => updateStatus(item, feedbackStatus === "pending" ? "published" : "pending")} className="w-full px-4 py-2.5 text-[11px] font-medium text-[#344257] hover:bg-[#f7f9fd]">{feedbackStatus === "pending" ? "Publish feedback" : "Move to pending"}</button>
                          <button type="button" onClick={() => removeFeedback(item)} className="flex w-full items-center gap-2 px-4 py-2.5 text-[11px] font-medium text-red-500 hover:bg-red-50"><Trash2 size={14} />Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex min-h-[68px] flex-col gap-3 border-t border-[#edf1f6] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[10.5px] text-[#77859a]">Showing {rowStart} to {rowEnd} of {pagination.total || 0} entries</div>
          <div className="flex items-center gap-2">
            <button type="button" disabled={pagination.page <= 1} onClick={() => setPagination((current) => ({ ...current, page: current.page - 1 }))} className="grid h-9 w-9 place-items-center rounded-[8px] border border-[#e2e7ef] bg-white text-[#526078] disabled:cursor-not-allowed disabled:opacity-35"><ChevronLeft size={15} /></button>
            {Array.from({ length: Math.min(5, pagination.totalPages || 1) }, (_, i) => {
              const totalPages = pagination.totalPages || 1;
              let start = Math.max(1, pagination.page - 2);
              start = Math.min(start, Math.max(1, totalPages - 4));
              const pageNumber = start + i;
              if (pageNumber > totalPages) return null;
              return (
                <button key={pageNumber} type="button" onClick={() => setPagination((current) => ({ ...current, page: pageNumber }))} className={`grid h-9 min-w-9 place-items-center rounded-[8px] border px-3 text-[11px] font-semibold ${pagination.page === pageNumber ? "border-[#0f7bf3] bg-[#0f7bf3] text-white" : "border-[#e2e7ef] bg-white text-[#526078]"}`}>{pageNumber}</button>
              );
            })}
            <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((current) => ({ ...current, page: current.page + 1 }))} className="grid h-9 w-9 place-items-center rounded-[8px] border border-[#e2e7ef] bg-white text-[#526078] disabled:cursor-not-allowed disabled:opacity-35"><ChevronRight size={15} /></button>
          </div>
        </div>
      </section>

      {selectedFeedback && (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-[#0e1930]/35 p-4 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedFeedback(null); }}>
          <div className="w-full max-w-[650px] rounded-[18px] border border-[#e4eaf2] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,.2)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[20px] font-extrabold text-[#111936]">Student Feedback</h2>
                <p className="mt-1 text-[11px] text-[#8793a6]">{selectedFeedback.course?.title || "Course feedback"}</p>
              </div>
              <button type="button" onClick={() => setSelectedFeedback(null)} className="grid h-9 w-9 place-items-center rounded-full text-[#69768a] hover:bg-[#f5f7fb]"><X size={18} /></button>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-[12px] bg-[#f8fbff] p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#e1efff] text-[11px] font-bold text-[#176fdc]">{initials(selectedFeedback.user?.name)}</div>
                <div><div className="text-[12px] font-bold text-[#1a263e]">{selectedFeedback.user?.name || "Student"}</div><div className="mt-0.5 text-[10px] text-[#8793a6]">{selectedFeedback.user?.email || ""}</div></div>
              </div>
              <div className="flex items-center gap-3"><RatingStars rating={selectedFeedback.rating || 0} /><StatusBadge status={selectedFeedback.status || "published"} /></div>
            </div>

            {(selectedFeedback.liked || []).length > 0 && (
              <div className="mt-5"><div className="text-[11px] font-bold text-[#4d5b70]">What they liked</div><div className="mt-2 flex flex-wrap gap-2">{selectedFeedback.liked.map((tag) => <span key={tag} className="rounded-full border border-[#dbe7f5] bg-[#f6faff] px-3 py-1.5 text-[10px] font-semibold text-[#3975b8]">{tag}</span>)}</div></div>
            )}

            <div className="mt-5"><div className="text-[11px] font-bold text-[#4d5b70]">Feedback</div><div className="mt-2 rounded-[12px] border border-[#e5eaf1] bg-white px-4 py-4 text-[12px] leading-6 text-[#4c5a70]">{selectedFeedback.comment}</div></div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => updateStatus(selectedFeedback, (selectedFeedback.status || "published") === "pending" ? "published" : "pending")} className="h-10 rounded-[9px] border border-[#dce4ef] bg-white px-4 text-[11px] font-semibold text-[#435169] hover:bg-[#f8faff]">{(selectedFeedback.status || "published") === "pending" ? "Publish" : "Move to Pending"}</button>
              <button type="button" onClick={() => removeFeedback(selectedFeedback)} className="inline-flex h-10 items-center gap-2 rounded-[9px] border border-red-100 bg-red-50 px-4 text-[11px] font-semibold text-red-500 hover:bg-red-100"><Trash2 size={14} />Delete</button>
              <button type="button" onClick={() => setSelectedFeedback(null)} className="h-10 rounded-[9px] bg-[#0f7bf3] px-5 text-[11px] font-semibold text-white hover:bg-[#0872e7]">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
