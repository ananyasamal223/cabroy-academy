import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  Filter,
  GripVertical,
  IndianRupee,
  Layers3,
  Search,
  Users,
  X,
} from "lucide-react";
import api from "../api/client";

const DEFAULT_COLUMNS = [
  { id: "username", label: "Username" },
  { id: "city", label: "City" },
  { id: "date", label: "Date" },
  { id: "completionRate", label: "Completion Rate" },
  { id: "ongoingModule", label: "Ongoing Module" },
  { id: "discountApplied", label: "Discount Applied" },
  { id: "paidAmount", label: "Paid Amount" },
  { id: "userStatus", label: "User Status" },
];

const STATUS_OPTIONS = ["New User", "Paid Active User", "Free Active User", "In-Active User"];

const EMPTY_FILTERS = {
  completionFrom: "",
  completionTo: "",
  module: "",
  discountRange: "",
  paidRange: "",
  statuses: [],
};

function formatINR(amount) {
  return `₹${Math.round(Number(amount || 0)).toLocaleString("en-IN")}`;
}

function formatDate(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDuration(minutes) {
  const value = Number(minutes || 0);
  if (!value) return "0 Hours";
  const hours = Math.floor(value / 60);
  const mins = Math.round(value % 60);
  if (!hours) return `${mins} Mins`;
  if (!mins) return `${hours} Hours`;
  return `${hours}h ${mins}m`;
}

function inRange(value, key) {
  const number = Number(value || 0);
  if (!key) return true;
  if (key === "none") return number === 0;
  if (key === "1-500") return number >= 1 && number <= 500;
  if (key === "500-1000") return number >= 500 && number <= 1000;
  if (key === "1000-2000") return number >= 1000 && number <= 2000;
  if (key === "0-1000") return number >= 0 && number <= 1000;
  if (key === "2000-5000") return number >= 2000 && number <= 5000;
  if (key === "2000+") return number >= 2000;
  if (key === "5000+") return number >= 5000;
  return true;
}

function statusTone(status) {
  if (status === "Paid Active User") return "bg-[#e9f9f0] text-[#159a67] border-[#cceedd]";
  if (status === "Free Active User") return "bg-[#e8fbff] text-[#0891b2] border-[#c7f1f8]";
  if (status === "New User") return "bg-[#fff4e7] text-[#d97706] border-[#fde2bd]";
  return "bg-[#fff0f1] text-[#dc2626] border-[#ffd7da]";
}

function activeFilterCount(filters) {
  let count = 0;
  if (filters.completionFrom !== "" || filters.completionTo !== "") count += 1;
  if (filters.module) count += 1;
  if (filters.discountRange) count += 1;
  if (filters.paidRange) count += 1;
  if (filters.statuses.length) count += 1;
  return count;
}

export default function CourseInsights() {
  const [searchParams, setSearchParams] = useSearchParams();
  const courseIdFromUrl = searchParams.get("courseId") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const { data: response } = await api.get("/admin/course-insights", {
          params: courseIdFromUrl ? { courseId: courseIdFromUrl } : {},
        });
        if (cancelled) return;
        setData(response);
        if (!courseIdFromUrl && response.selectedCourseId) {
          setSearchParams({ courseId: response.selectedCourseId }, { replace: true });
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.response?.data?.message || "Could not load course insights.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [courseIdFromUrl, setSearchParams]);


  const moduleOptions = useMemo(
    () => (data?.completionTracker || []).map((item) => item.name),
    [data]
  );

  const filteredUsers = useMemo(() => {
    const rows = data?.users || [];
    const query = search.trim().toLowerCase();
    const referenceTime = Date.parse(data?.generatedAt || "1970-01-01T00:00:00.000Z");
    const dateCutoff =
      dateRange === "7" ? referenceTime - 7 * 86400000 :
      dateRange === "30" ? referenceTime - 30 * 86400000 :
      dateRange === "90" ? referenceTime - 90 * 86400000 : null;

    return rows.filter((row) => {
      if (query) {
        const searchable = [row.username, row.email, row.city, row.ongoingModule, row.promoCode]
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(query)) return false;
      }

      if (dateCutoff && new Date(row.date).getTime() < dateCutoff) return false;

      const completion = Number(row.completionRate || 0);
      if (filters.completionFrom !== "" && completion < Number(filters.completionFrom)) return false;
      if (filters.completionTo !== "" && completion > Number(filters.completionTo)) return false;
      if (filters.module && row.ongoingModule !== filters.module) return false;
      if (!inRange(row.discountApplied, filters.discountRange)) return false;
      if (!inRange(row.paidAmount, filters.paidRange)) return false;
      if (filters.statuses.length && !filters.statuses.includes(row.userStatus)) return false;

      return true;
    });
  }, [data, search, dateRange, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredUsers.slice((safePage - 1) * pageSize, safePage * pageSize);
  const visibleColumns = columns.filter((column) => !hiddenColumns.includes(column.id));
  const filterCount = activeFilterCount(filters);

  const openFilters = () => {
    setDraftFilters({ ...filters, statuses: [...filters.statuses] });
    setFilterOpen(true);
  };

  const applyFilters = () => {
    setFilters({ ...draftFilters, statuses: [...draftFilters.statuses] });
    setPage(1);
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
  };

  const toggleStatus = (status) => {
    setDraftFilters((current) => ({
      ...current,
      statuses: current.statuses.includes(status)
        ? current.statuses.filter((item) => item !== status)
        : [...current.statuses, status],
    }));
  };

  const toggleColumn = (columnId) => {
    setHiddenColumns((current) =>
      current.includes(columnId)
        ? current.filter((id) => id !== columnId)
        : [...current, columnId]
    );
  };

  const dropColumn = (targetId) => {
    if (!draggedColumn || draggedColumn === targetId) return;
    setColumns((current) => {
      const fromIndex = current.findIndex((item) => item.id === draggedColumn);
      const toIndex = current.findIndex((item) => item.id === targetId);
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setDraggedColumn(null);
  };

  const downloadCsv = () => {
    const headers = visibleColumns.map((column) => column.label);
    const rows = filteredUsers.map((row) =>
      visibleColumns.map((column) => {
        if (column.id === "date") return formatDate(row.date);
        if (column.id === "completionRate") return `${row.completionRate}%`;
        if (column.id === "discountApplied" || column.id === "paidAmount") return Number(row[column.id] || 0);
        return row[column.id] ?? "";
      })
    );

    const escapeCell = (value) => `"${String(value).replaceAll('"', '""')}"`;
    const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(data?.course?.title || "course").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-insights.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const statusCounts = data?.userStatusCounts || {};
  const graphNewUsers = Number(statusCounts["New User"] || 0);
  const graphPaidUsers = Number(statusCounts["Paid Active User"] || 0);
  const graphInactiveUsers = Number(statusCounts["In-Active User"] || 0);
  const totalStatusUsers = graphNewUsers + graphPaidUsers + graphInactiveUsers;
  const newPct = totalStatusUsers ? (graphNewUsers / totalStatusUsers) * 100 : 0;
  const paidPct = totalStatusUsers ? (graphPaidUsers / totalStatusUsers) * 100 : 0;
  const donutStyle = {
    background: totalStatusUsers
      ? `conic-gradient(#ff9f2f 0 ${newPct}%, #13a86f ${newPct}% ${newPct + paidPct}%, #ef4444 ${newPct + paidPct}% 100%)`
      : "#e8edf5",
  };

  if (!loading && !data?.course && !error) {
    return (
      <div className="rounded-[18px] border border-[#e6eaf1] bg-white p-10 text-center text-sm text-[#667085]">
        No courses are available yet.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] min-w-0">
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-[#8a94a8]">
            <span>Dashboard</span><span>›</span><span>Course Insight</span>
          </div>
          <h1 className="mt-2 text-[28px] font-bold tracking-[-0.4px] text-[#101828]">Course Insight</h1>
          <p className="mt-1 text-[11px] text-[#667085]">View course performance, user engagement and revenue details</p>
        </div>

        {!!data?.courseOptions?.length && (
          <select
            value={data.selectedCourseId || courseIdFromUrl}
            onChange={(event) => {
              setPage(1);
              setSearchParams({ courseId: event.target.value });
            }}
            className="h-10 w-full sm:w-auto min-w-0 rounded-[10px] border border-[#dfe5ee] bg-white px-3 text-[11px] font-semibold text-[#344054] outline-none focus:border-[#2563eb]"
          >
            {data.courseOptions.map((course) => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="mb-5 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[11px] font-medium text-red-600">
          {error}
        </div>
      )}

      <section className="rounded-[20px] border border-[#e6eaf1] bg-white p-5 shadow-[0_5px_22px_rgba(15,23,42,.035)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch">
          <div className="h-[165px] w-full shrink-0 overflow-hidden rounded-[16px] bg-[#eaf5ff] lg:w-[275px]">
            {data?.course?.thumbnail ? (
              <img src={data.course.thumbnail} alt={data.course.title} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-[#1684e5]"><BookOpen size={58} strokeWidth={1.8} /></div>
            )}
          </div>

          <div className="min-w-0 flex-1 px-1 py-1 lg:px-3">
            <h2 className="text-[22px] font-bold text-[#172033]">{loading ? "Loading…" : data?.course?.title}</h2>
            <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-4 text-[11px] text-[#667085] sm:grid-cols-4">
              <Metric icon={Layers3} label={`${data?.course?.moduleCount || 0} Modules`} />
              <Metric icon={BookOpen} label={`${data?.course?.lessonCount || 0} Lessons`} />
              <Metric icon={Users} label={`${data?.course?.enrolledUsers || 0} Users`} />
              <Metric icon={CalendarDays} label={formatDuration(data?.course?.durationMinutes)} />
            </div>
            <div className="mt-6 border-t border-[#edf0f5] pt-4">
              <p className="text-[9px] uppercase tracking-[.08em] text-[#98a2b3]">By Mentor</p>
              <p className="mt-1 text-[11px] font-semibold text-[#344054]">{data?.course?.instructorName || "Not Assigned"}</p>
            </div>
          </div>

          <div className="flex min-w-0 items-end justify-start border-t border-[#edf0f5] pt-5 lg:justify-end lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <div className="text-left lg:text-right">
              <p className="text-[10px] text-[#98a2b3]">Course Price</p>
              <p className="mt-2 text-[27px] font-bold text-[#172033]">{formatINR(data?.course?.price)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.95fr)]">
        <div className="rounded-[20px] border border-[#e6eaf1] bg-white p-5 shadow-[0_5px_22px_rgba(15,23,42,.035)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-[17px] font-bold text-[#182235]">User Graph</h3>
              <p className="mt-1 text-[10px] text-[#98a2b3]">User status distribution for this course</p>
            </div>

            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative h-[140px] w-[140px] shrink-0 rounded-full" style={donutStyle}>
                <div className="absolute inset-[23px] grid place-items-center rounded-full bg-white text-center">
                  <div>
                    <p className="text-[24px] font-bold text-[#182235]">{totalStatusUsers}</p>
                    <p className="text-[9px] text-[#98a2b3]">Users</p>
                  </div>
                </div>
              </div>

              <div className="min-w-0 w-full space-y-4 sm:w-auto sm:flex-1">
                <SimpleLegend dot="bg-[#ff9f2f]" label="New User" value={graphNewUsers} />
                <SimpleLegend dot="bg-[#13a86f]" label="Paid Active User" value={graphPaidUsers} />
                <SimpleLegend dot="bg-[#ef4444]" label="In-Active User" value={graphInactiveUsers} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[20px] border border-[#e6eaf1] bg-white p-6 shadow-[0_5px_22px_rgba(15,23,42,.035)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[17px] font-bold text-[#182235]">Total Revenue</h3>
              <p className="mt-1 text-[10px] text-[#98a2b3]">Revenue attributed to this course from paid orders</p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-[13px] bg-[#e9fbf3] text-[#13a86f]"><BarChart3 size={21} /></div>
          </div>
          <p className="mt-9 text-[30px] font-bold text-[#172033]">{formatINR(data?.totalRevenue)}</p>
          <div className="mt-3 flex items-center gap-2 text-[9px]">
            <span className="rounded-full bg-[#e9f9f0] px-2.5 py-1 font-bold text-[#159a67]">↑ Live</span>
            <span className="text-[#98a2b3]">successful paid orders</span>
          </div>
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-[18px] border border-[#e6eaf1] bg-white shadow-[0_4px_18px_rgba(15,23,42,.035)]">
        <div className="border-b border-[#edf0f5] p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="text-[16px] font-bold text-[#182235]">User Details</h3>
              <p className="mt-1 text-[10px] text-[#98a2b3]">Monitor course users, progress, payment and activity status</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-0 w-full sm:min-w-[230px] flex-1 xl:flex-none">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]" />
                <input
                  value={search}
                  onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                  placeholder="Search User ID / Name"
                  className="h-10 w-full rounded-[9px] border border-[#dfe5ee] bg-white pl-9 pr-3 text-[10px] outline-none focus:border-[#2563eb]"
                />
              </div>

              <button
                type="button"
                onClick={openFilters}
                className="flex h-10 items-center gap-2 rounded-[9px] border border-[#dfe5ee] bg-white px-3 text-[10px] font-semibold text-[#475467] hover:border-[#2563eb] hover:text-[#2563eb]"
              >
                <Filter size={14} /> Filters
                {filterCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#2563eb] px-1 text-[9px] text-white">{filterCount}</span>}
              </button>

              <select
                value={dateRange}
                onChange={(event) => { setDateRange(event.target.value); setPage(1); }}
                className="h-10 rounded-[9px] border border-[#dfe5ee] bg-white px-3 text-[10px] font-semibold text-[#475467] outline-none"
              >
                <option value="all">All Dates</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>

              {(filterCount > 0 || search || dateRange !== "all") && (
                <button
                  type="button"
                  onClick={() => { setFilters(EMPTY_FILTERS); setSearch(""); setDateRange("all"); setPage(1); }}
                  className="h-10 px-2 text-[10px] font-semibold text-[#ef4444]"
                >
                  Reset Filters
                </button>
              )}

              <button
                type="button"
                onClick={downloadCsv}
                className="flex h-10 items-center gap-2 rounded-[9px] bg-[#2563eb] px-4 text-[10px] font-semibold text-white shadow-sm hover:bg-[#1d4ed8]"
              >
                <Download size={14} /> Download Report
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse">
            <thead>
              <tr className="bg-[#fafbfe] text-left text-[9px] font-semibold uppercase tracking-[.03em] text-[#778195]">
                {visibleColumns.map((column) => <th key={column.id} className="whitespace-nowrap px-4 py-4">{column.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {!loading && pageRows.length === 0 && (
                <tr><td colSpan={visibleColumns.length} className="px-4 py-12 text-center text-[11px] text-[#98a2b3]">No users match the selected filters.</td></tr>
              )}
              {pageRows.map((row) => (
                <tr key={row.id} className="border-t border-[#edf0f5] text-[10px] text-[#536078] hover:bg-[#fbfcff]">
                  {visibleColumns.map((column) => (
                    <td key={column.id} className="whitespace-nowrap px-4 py-4">
                      <Cell column={column.id} row={row} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#edf0f5] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[10px] text-[#667085]">
            <span>{filteredUsers.length ? (safePage - 1) * pageSize + 1 : 0}–{Math.min(safePage * pageSize, filteredUsers.length)} of {filteredUsers.length}</span>
            <span>Row/Page:</span>
            <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="h-8 rounded-[7px] border border-[#dfe5ee] bg-white px-2 text-[10px] outline-none">
              <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <PageButton disabled={safePage <= 1} onClick={() => setPage(1)}>«</PageButton>
            <PageButton disabled={safePage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft size={13} /></PageButton>
            {paginationPages(safePage, totalPages).map((number) => (
              <PageButton key={number} active={number === safePage} onClick={() => setPage(number)}>{number}</PageButton>
            ))}
            <PageButton disabled={safePage >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}><ChevronRight size={13} /></PageButton>
            <PageButton disabled={safePage >= totalPages} onClick={() => setPage(totalPages)}>»</PageButton>
          </div>
        </div>
      </section>

      {filterOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[1px]">
          <div className="max-h-[90vh] w-full max-w-[850px] overflow-auto rounded-[18px] border border-[#e4e8ef] bg-white shadow-[0_24px_70px_rgba(15,23,42,.24)]">
            <div className="flex items-center justify-between border-b border-[#edf0f5] px-5 py-4">
              <div className="flex items-center gap-2">
                <h3 className="text-[16px] font-bold text-[#172033]">Filter ({activeFilterCount(draftFilters)})</h3>
              </div>
              <button onClick={() => setFilterOpen(false)} className="grid h-8 w-8 place-items-center rounded-full text-[#475467] hover:bg-slate-100"><X size={19} /></button>
            </div>

            <div className="grid md:grid-cols-2">
              <div className="border-b border-[#edf0f5] p-5 md:border-b-0 md:border-r">
                <div className="mb-4 flex min-h-10 flex-wrap items-center gap-2 rounded-[10px] border border-[#dfe5ee] p-2">
                  {draftFilters.discountRange && <FilterChip label="Discount Applied" onRemove={() => setDraftFilters((f) => ({ ...f, discountRange: "" }))} />}
                  {draftFilters.paidRange && <FilterChip label="Paid Amount" onRemove={() => setDraftFilters((f) => ({ ...f, paidRange: "" }))} />}
                  {!!draftFilters.statuses.length && <FilterChip label="User Status" onRemove={() => setDraftFilters((f) => ({ ...f, statuses: [] }))} />}
                  {draftFilters.module && <FilterChip label="Module" onRemove={() => setDraftFilters((f) => ({ ...f, module: "" }))} />}
                  {(draftFilters.completionFrom !== "" || draftFilters.completionTo !== "") && <FilterChip label="Completion Rate" onRemove={() => setDraftFilters((f) => ({ ...f, completionFrom: "", completionTo: "" }))} />}
                  {activeFilterCount(draftFilters) === 0 && <span className="px-1 text-[10px] text-[#98a2b3]">Select filters below</span>}
                </div>

                <button onClick={clearFilters} className="mb-5 text-[10px] font-semibold text-[#ef4444]">Clear All</button>

                <FilterLabel>Completion Rate</FilterLabel>
                <div className="mb-4 flex items-center gap-3">
                  <NumberInput value={draftFilters.completionFrom} onChange={(value) => setDraftFilters((f) => ({ ...f, completionFrom: value }))} placeholder="00" />
                  <span className="text-[#98a2b3]">—</span>
                  <NumberInput value={draftFilters.completionTo} onChange={(value) => setDraftFilters((f) => ({ ...f, completionTo: value }))} placeholder="100" />
                  <span className="text-[10px] text-[#98a2b3]">%</span>
                </div>

                <FilterLabel>Module</FilterLabel>
                <select value={draftFilters.module} onChange={(event) => setDraftFilters((f) => ({ ...f, module: event.target.value }))} className="mb-4 h-10 w-full rounded-[9px] border border-[#dfe5ee] bg-white px-3 text-[10px] outline-none focus:border-[#2563eb]">
                  <option value="">Select Module</option>
                  {moduleOptions.map((module) => <option key={module} value={module}>{module}</option>)}
                  <option value="Completed">Completed</option>
                  <option value="Not Started">Not Started</option>
                </select>

                <FilterLabel>Discount Applied</FilterLabel>
                <select value={draftFilters.discountRange} onChange={(event) => setDraftFilters((f) => ({ ...f, discountRange: event.target.value }))} className="mb-4 h-10 w-full rounded-[9px] border border-[#dfe5ee] bg-white px-3 text-[10px] outline-none focus:border-[#2563eb]">
                  <option value="">Any Discount</option>
                  <option value="none">No Discount</option>
                  <option value="1-500">₹1–₹500</option>
                  <option value="500-1000">₹500–₹1,000</option>
                  <option value="1000-2000">₹1,000–₹2,000</option>
                  <option value="2000+">₹2,000+</option>
                </select>

                <FilterLabel>Paid Amount</FilterLabel>
                <select value={draftFilters.paidRange} onChange={(event) => setDraftFilters((f) => ({ ...f, paidRange: event.target.value }))} className="mb-4 h-10 w-full rounded-[9px] border border-[#dfe5ee] bg-white px-3 text-[10px] outline-none focus:border-[#2563eb]">
                  <option value="">Any Amount</option>
                  <option value="0-1000">₹0–₹1,000</option>
                  <option value="1000-2000">₹1,000–₹2,000</option>
                  <option value="2000-5000">₹2,000–₹5,000</option>
                  <option value="5000+">₹5,000+</option>
                </select>

                <FilterLabel>User Status</FilterLabel>
                <div className="overflow-hidden rounded-[10px] border border-[#dfe5ee]">
                  {STATUS_OPTIONS.map((status) => (
                    <label key={status} className="flex cursor-pointer items-center justify-between border-b border-[#edf0f5] px-3 py-2.5 last:border-b-0 hover:bg-[#fbfcff]">
                      <span className="flex items-center gap-2 text-[10px] text-[#475467]">
                        <span className={`h-2.5 w-2.5 rounded-full ${status === "New User" ? "bg-[#f59e0b]" : status === "Paid Active User" ? "bg-[#16a34a]" : status === "Free Active User" ? "bg-[#06b6d4]" : "bg-[#ef4444]"}`} />
                        {status}
                      </span>
                      <input type="checkbox" checked={draftFilters.statuses.includes(status)} onChange={() => toggleStatus(status)} className="h-4 w-4 accent-[#2563eb]" />
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-5">
                <div className="mb-4">
                  <h4 className="text-[14px] font-bold text-[#172033]">Reorder Columns</h4>
                  <p className="mt-1 text-[9px] leading-4 text-[#98a2b3]">Drag rows to reorder columns. Click the eye icon to show or hide a column.</p>
                </div>

                <div className="space-y-2">
                  {columns.map((column) => {
                    const hidden = hiddenColumns.includes(column.id);
                    return (
                      <div
                        key={column.id}
                        draggable
                        onDragStart={() => setDraggedColumn(column.id)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => dropColumn(column.id)}
                        className={`flex cursor-grab items-center gap-2 rounded-[9px] border px-3 py-2.5 active:cursor-grabbing ${draggedColumn === column.id ? "border-[#2563eb] bg-[#f4f7ff]" : "border-[#dfe5ee] bg-white"}`}
                      >
                        <GripVertical size={14} className="text-[#c0c7d2]" />
                        <span className={`min-w-0 flex-1 text-[10px] font-medium ${hidden ? "text-[#aab2c0]" : "text-[#475467]"}`}>{column.label}</span>
                        <button type="button" onClick={() => toggleColumn(column.id)} className="grid h-7 w-7 place-items-center rounded-full hover:bg-slate-100" aria-label={`${hidden ? "Show" : "Hide"} ${column.label}`}>
                          {hidden ? <EyeOff size={14} className="text-[#98a2b3]" /> : <Eye size={14} className="text-[#475467]" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#edf0f5] px-5 py-4">
              <button onClick={() => setFilterOpen(false)} className="h-10 rounded-[9px] border border-[#dfe5ee] px-5 text-[10px] font-semibold text-[#475467]">Cancel</button>
              <button onClick={applyFilters} className="h-10 rounded-[9px] bg-[#2563eb] px-6 text-[10px] font-semibold text-white hover:bg-[#1d4ed8]">Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} className="text-[#7b879c]" />
      <span>{label}</span>
    </div>
  );
}

function Legend({ dot, label, value }) {
  return (
    <div className="flex items-center gap-2 rounded-[9px] bg-[#fafbfe] px-3 py-2.5">
      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
      <span className="min-w-0 flex-1 truncate text-[9px] text-[#667085]">{label}</span>
      <span className="text-[10px] font-bold text-[#344054]">{value}</span>
    </div>
  );
}

function SimpleLegend({ dot, label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`h-3 w-3 shrink-0 rounded-full ${dot}`} />
      <span className="min-w-0 flex-1 text-[10px] font-medium text-[#667085]">{label}</span>
      <span className="text-[11px] font-bold text-[#172033]">{value}</span>
    </div>
  );
}

function Cell({ column, row }) {
  if (column === "username") {
    return (
      <div>
        <p className="font-semibold text-[#344054]">{row.username}</p>
        <p className="mt-1 max-w-[180px] truncate text-[9px] text-[#98a2b3]">{row.email}</p>
      </div>
    );
  }
  if (column === "date") return formatDate(row.date);
  if (column === "completionRate") {
    const rate = Number(row.completionRate || 0);
    return <span className={`font-bold ${rate >= 70 ? "text-[#159a67]" : rate >= 40 ? "text-[#d97706]" : "text-[#ef4444]"}`}>{rate}%</span>;
  }
  if (column === "discountApplied") return <span className="text-[#ef4444]">-{formatINR(row.discountApplied)}</span>;
  if (column === "paidAmount") return <span className="font-semibold text-[#159a67]">{formatINR(row.paidAmount)}</span>;
  if (column === "userStatus") return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[8px] font-semibold ${statusTone(row.userStatus)}`}>{row.userStatus}</span>;
  return row[column] || "—";
}

function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#3158b5] px-2.5 py-1.5 text-[8px] font-semibold text-white">
      {label}<button type="button" onClick={onRemove}><X size={10} /></button>
    </span>
  );
}

function FilterLabel({ children }) {
  return <label className="mb-2 block text-[10px] font-semibold text-[#475467]">{children}</label>;
}

function NumberInput({ value, onChange, placeholder }) {
  return (
    <div className="relative flex-1">
      <input
        type="number"
        min="0"
        max="100"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-[9px] border border-[#dfe5ee] bg-white px-3 pr-7 text-[10px] outline-none focus:border-[#2563eb]"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-[#98a2b3]">%</span>
    </div>
  );
}

function PageButton({ children, active, disabled, onClick }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`grid h-8 min-w-8 place-items-center rounded-[7px] border px-2 text-[9px] font-semibold transition ${active ? "border-[#2563eb] bg-[#eef4ff] text-[#2563eb]" : "border-[#dfe5ee] bg-white text-[#667085]"} disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

function paginationPages(current, total) {
  const start = Math.max(1, Math.min(current - 2, Math.max(1, total - 4)));
  return Array.from({ length: Math.min(5, total) }, (_, index) => start + index);
}
