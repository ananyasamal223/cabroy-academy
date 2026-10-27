import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Users, BookOpen, IndianRupee, ClipboardList, ArrowUpRight, RefreshCw, Search, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import "./Dashboard.css";
import "./DashboardReference.css";
import "./DashboardHeader.css";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);
const date = (value) => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Not available";
export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [reload, setReload] = useState(0);
  const [query, setQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const has = (permission) => user?.role === "admin" || user?.adminPermissions?.includes(permission);
  useEffect(() => {
    const controller = new AbortController();

    api.get("/admin/stats", { signal: controller.signal }).then(({ data: result }) => setData(result)).catch(() => {
      if (!controller.signal.aborted) setError("We couldn't load the dashboard. Please try again.");
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [reload]);
  const refresh = () => { setLoading(true); setError(""); setReload(value => value + 1); };
  const stats = data?.stats;
  const enrollments = data?.recentStudents || [];
  const courses = [...new Set(enrollments.map(row => row.course).filter(Boolean))];
  const rows = enrollments.filter(row =>
    [row.name, row.email, row.course].some(value => String(value || "").toLowerCase().includes(query.toLowerCase().trim())) &&
    (courseFilter === "all" || row.course === courseFilter)
  );  const cards = [
    [Users, "Total students", stats?.totalStudents?.toLocaleString("en-IN"), "Registered learners", "blue"],
    [BookOpen, "Active courses", stats?.activeCourses, "Published learning programs", "green"],
    [IndianRupee, "Total revenue", money(stats?.totalRevenue), "Across all recorded payments", "purple"],
    [ClipboardList, "Total enrollments", stats?.enrollments?.toLocaleString("en-IN"), "Course registrations", "amber"],
  ];
  const hour = new Date().getHours();
  return <div className="ad-dashboard">
    <div className="ad-header-scene">
    <div className="ad-page-heading"><div><span className="ad-eyebrow">ACADEMY WORKSPACE</span><h1>Dashboard overview</h1></div></div>
    <section className="ad-welcome-bar" aria-labelledby="dashboard-greeting">
      <div className="ad-banner-art" aria-hidden="true"><i className="ad-book ad-book-one" /><i className="ad-book ad-book-two" /><i className="ad-book ad-book-three" /><i className="ad-leaf ad-leaf-one" /><i className="ad-leaf ad-leaf-two" /></div>
      <span className="ad-welcome-emblem" aria-hidden="true"><BookOpen size={25} /></span>
      <div className="ad-welcome-bar-copy"><h2 id="dashboard-greeting">Good {hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"}, {user?.name?.split(" ")[0] || "Admin"}.</h2><p>Let’s keep your academy moving forward.<span className="ad-welcome-bar-date">{new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span></p></div>
      {(has("reports") || has("courses")) && <nav className="ad-welcome-bar-actions" aria-label="Dashboard quick actions">{has("reports") && <Link to="/admin/user-overview"><Users size={16} /> Student reports <ArrowUpRight size={15} /></Link>}{has("courses") && <Link to="/admin/courses" className="ad-welcome-bar-primary"><BookOpen size={16} /> Manage courses <ArrowUpRight size={15} /></Link>}</nav>}
    </section>
    </div>
    {error && <div className="ad-error" role="alert"><AlertCircle size={20} /><span>{error}</span><button onClick={refresh}>Retry</button></div>}
    <section className="ad-stats" aria-label="Academy statistics" aria-busy={loading}>{cards.map(([Icon, label, value, caption, tone]) => <article className="ad-stat" key={label} data-tone={tone}><div className={`ad-stat-icon ad-${tone}`}><Icon size={21} /></div><span>{label}</span><strong>{loading ? "..." : error || !stats ? "—" : value ?? "—"}</strong><small>{caption}</small><svg className="ad-sparkline" viewBox="0 0 100 60" fill="none" aria-hidden="true"><path d="M3 51 C18 37 25 54 36 37 S57 43 68 30 S81 11 97 5 L97 60 L3 60Z" fill="currentColor" opacity=".07" /><path d="M3 51 C18 37 25 54 36 37 S57 43 68 30 S81 11 97 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg></article>)}</section>
    <section className="ad-students"><div className="ad-table-heading"><div><h2>Recent enrollments</h2><p>Your latest course registrations, all in one place.</p></div>{has("reports") && <Link to="/admin/user-overview">View all students <ArrowUpRight size={17} /></Link>}</div><div className="ad-table-controls"><label><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search name, email or course" aria-label="Search recent enrollments" /></label><select value={courseFilter} onChange={event => setCourseFilter(event.target.value)} aria-label="Filter enrollments by course"><option value="all">All courses</option>{courses.map(course => <option key={course} value={course}>{course}</option>)}</select>{(query || courseFilter !== "all") && <button className="ad-clear-filters" onClick={() => { setQuery(""); setCourseFilter("all"); }}>Clear filters</button>}</div>
    <div className="ad-table-scroll"><table><thead><tr><th scope="col">Student</th><th scope="col">Course</th><th scope="col">Enrollment date</th><th scope="col" className="ad-action-heading">Action</th></tr></thead><tbody>{loading ? <tr><td colSpan={4} className="ad-empty" role="status">Loading enrollments...</td></tr> : error ? <tr><td colSpan={4} className="ad-empty">Enrollment data is unavailable. Use Retry above.</td></tr> : !rows.length ? <tr><td colSpan={4} className="ad-empty">{query || courseFilter !== "all" ? "No enrollments match these filters." : "No enrollments yet."}</td></tr> : rows.map((row, index) => <tr key={`${row.email}-${row.course}-${index}`}><td><div className="ad-person"><span>{(row.name || "L").split(" ").slice(0, 2).map(word => word[0]).join("")}</span><div><strong>{row.name || "Learner"}</strong><small>{row.email}</small></div></div></td><td><span className="ad-course-name"><span className={`ad-course-icon ad-${["blue", "green", "purple", "amber"][index % 4]}`}><BookOpen size={18} aria-hidden="true" /></span>{row.course}</span></td><td>{date(row.joinDate)}</td><td><button className="ad-details" aria-label={`View ${row.name || "learner"} enrollment details`} onClick={() => setSelected(row)}>Details <ArrowUpRight size={15} /></button></td></tr>)}</tbody></table></div><div className="ad-table-footer">{!loading && !error ? `Showing ${rows.length} recent enrollment${rows.length === 1 ? "" : "s"}` : "Academy enrollment activity"}</div></section>
    <div className="ad-refresh-footer"><button className="ad-secondary" onClick={refresh} disabled={loading}><RefreshCw size={16} />{loading ? "Refreshing..." : "Refresh data"}</button></div>
    {selected && <EnrollmentDetails row={selected} onClose={() => setSelected(null)} />}
  </div>;
}
function EnrollmentDetails({ row, onClose }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const previous = document.activeElement;
    dialog.showModal();
    return () => { dialog.close(); previous?.focus(); };
  }, []);
  return <dialog ref={dialogRef} id="ad-enrollment-dialog" className="ad-dialog" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }} aria-labelledby="ad-detail-title"><h2 id="ad-detail-title">Enrollment details</h2><dl><dt>Student</dt><dd>{row.name}</dd><dt>Email</dt><dd>{row.email}</dd><dt>Course</dt><dd>{row.course}</dd><dt>Joined</dt><dd>{date(row.joinDate)}</dd><dt>Status</dt><dd className="ad-detail-status">{row.status || "active"}</dd></dl><button className="ad-secondary" onClick={onClose} autoFocus>Close details</button></dialog>;
}
