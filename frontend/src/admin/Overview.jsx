import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Users, BookOpen, IndianRupee, ClipboardList, ArrowRight, RefreshCw, Search, Sprout, Crown, BriefcaseBusiness, Clock, ChartNoAxesCombined, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import "./Overview.css";
import { GrowthChart, RevenueChart } from "./OverviewCharts";
import DashboardDateFilter from "./DashboardDateFilter";
const money = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
const date = value => value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }) : "—";
export default function Overview() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [range, setRange] = useState({ from: "", to: "" });
  const [months, setMonths] = useState(6);
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [all, setAll] = useState(false);
  const [selected, setSelected] = useState(null);
  const [revenue, setRevenue] = useState("totalRevenue");
  const hasReports = user?.role === "admin" || user?.adminPermissions?.includes("reports");
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      api.get("/admin/overview", { signal: controller.signal, params: { ...range, months, search, plan, status, page } })
        .then(({ data: result }) => { setData(result); setError(""); })
        .catch(err => { if (!controller.signal.aborted) setError(err.response?.data?.message || "Dashboard unavailable. Check the backend connection and retry."); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [range, months, search, plan, status, page, refresh]);
  useEffect(() => {
    const reload = () => { if (!document.hidden) setRefresh(v => v + 1); };
    const timer = setInterval(reload, 60000);
    window.addEventListener("focus", reload);
    return () => { clearInterval(timer); window.removeEventListener("focus", reload); };
  }, []);
  const stats = data?.stats;
  const summary = data?.summary;
  const cards = [[Users, "Total Students", stats?.totalStudents, "Registered learners", "blue"], [BookOpen, "Active Courses", stats?.activeCourses, "Published courses", "green"], [IndianRupee, "Total Revenue", stats ? money(stats.totalRevenue) : null, "Verified payments in period", "red"], [ClipboardList, "Total Enrollments", stats?.enrollments, "Course registrations in period", "purple"]];
  const mini = [[Users, "Active Subscribers", summary?.active, "blue"], [Sprout, "Starter Plan", summary?.starter, "green"], [Crown, "Pro Plan", summary?.pro, "orange"], [BriefcaseBusiness, "Business Plan", summary?.business, "purple"], [Clock, "Expiring Soon", summary?.expiring, "red"]];
  const subscriptions = data?.subscriptions || [];
  const rows = all ? subscriptions : subscriptions.slice(0, 5);
  const filter = setter => event => { setter(event.target.value); setPage(1); };
  return <div className="ov-dashboard" aria-busy={loading}>
    <header className="ov-heading"><div><span className="ov-eyebrow">ACADEMY WORKSPACE</span><h1>Dashboard Overview</h1><p>A quick snapshot of your institute’s learning, revenue and subscription performance.</p></div><DashboardDateFilter range={range} onChange={value => { setRange(value); setPage(1); }} /></header>
    {error && <div className="ov-error" role="alert">{error} {data && "Showing the last loaded data."}<button onClick={() => setRefresh(v => v + 1)}>Retry</button></div>}
    <section className="ov-stats">{cards.map(([Icon, label, value, caption, tone]) => <article className="ov-stat" key={label}><span className={`ov-icon ${tone}`}><Icon size={26} /></span><div><h2>{label}</h2><strong>{value == null ? loading ? "…" : "—" : typeof value === "number" ? value.toLocaleString("en-IN") : value}</strong><p>{caption}</p></div></article>)}</section>
    <section className="ov-panel"><div className="ov-section-heading"><div className="ov-title"><span className="ov-icon small green"><ChartNoAxesCombined size={22} /></span><div><h2>Subscription Overview</h2><p>Verified plan purchases and current membership activity.</p></div></div><button onClick={() => { setAll(!all); setPage(1); }}>{all ? "Show recent subscriptions" : "View all subscriptions"}<ArrowRight size={16} /></button></div>
      <div className="ov-sub-top"><div><div className="ov-mini-grid">{mini.map(([Icon, label, value, tone]) => <article className="ov-mini" key={label}><span className={`ov-icon small ${tone}`}><Icon size={23} /></span><div><h3>{label}</h3><strong>{value ?? (loading ? "…" : "—")}</strong>{label === "Expiring Soon" && <small>Within 30 days</small>}</div></article>)}</div><p className="ov-note">Active counts are current, unique customers. Plans expire after their purchased period; billing does not auto-renew.</p></div><div className="ov-growth"><div className="ov-chart-heading"><h3>Subscribers Growth</h3><select aria-label="Chart period" value={months} onChange={e => setMonths(Number(e.target.value))}><option value={3}>Last 3 months</option><option value={6}>Last 6 months</option><option value={12}>Last 12 months</option></select></div><GrowthChart series={data?.series || []} /><p className="ov-note">Unique purchasers per plan, per month</p></div></div>
      <div className="ov-table-title"><h3>{all ? "All Subscriptions" : "Recent Subscriptions"}</h3><div className="ov-filters"><label><Search size={15} /><input aria-label="Search subscriptions" placeholder="Search customer or order…" value={search} onChange={filter(setSearch)} /></label><select aria-label="Filter plan" value={plan} onChange={filter(setPlan)}><option value="all">All plans</option>{["starter", "pro", "business"].map(id => <option key={id} value={id}>{id}</option>)}</select><select aria-label="Filter status" value={status} onChange={filter(setStatus)}><option value="all">All statuses</option><option value="active">Active</option><option value="expired">Expired</option></select></div></div>
      <div className="ov-table-wrap"><table><thead><tr>{["Student / Customer", "Plan", "Billing", "Amount", "Purchased on", "Expiry", "Status", "Action"].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><Person row={row} /></td><td><span className={`ov-badge ${row.planId}`}>{row.planName}</span></td><td className="ov-capitalize">{row.billing}</td><td className="ov-amount">{money(row.amount)}</td><td>{date(row.purchasedAt)}</td><td>{date(row.expiresAt)}</td><td><span className={`ov-status ${row.status}`}>● {row.status}</span></td><td><button onClick={() => setSelected({ type: "subscription", ...row })} aria-label={`View ${row.name} subscription`}>View</button></td></tr>)}{!rows.length && <tr><td colSpan={8} className="ov-empty">{loading ? "Loading subscriptions…" : error ? "Subscription data unavailable." : "No verified plan purchases match these filters."}</td></tr>}</tbody></table></div>
      {all && <div className="ov-pagination"><span>{data?.totalSubscriptions || 0} subscriptions · Page {page} of {Math.max(1, Math.ceil((data?.totalSubscriptions || 0) / 10))}</span><button disabled={page === 1 || loading} onClick={() => setPage(p => p - 1)}>Previous</button><button disabled={page * 10 >= (data?.totalSubscriptions || 0) || loading} onClick={() => setPage(p => p + 1)}>Next</button></div>}
    </section>
    <div className="ov-bottom"><section className="ov-panel"><div className="ov-section-heading"><div className="ov-title"><span className="ov-icon small purple"><Users size={22} /></span><div><h2>Recent Enrollments</h2><p>Your latest course registrations, all in one place.</p></div></div>{hasReports && <Link to="/admin/user-overview">View all students <ArrowRight size={15} /></Link>}</div><div className="ov-table-wrap"><table><thead><tr><th>Student</th><th>Course</th><th>Enrollment date</th><th>Action</th></tr></thead><tbody>{data?.recentStudents?.map(row => <tr key={row.id}><td><Person row={row} compact /></td><td><span className="ov-course"><BookOpen size={15} />{row.course}</span></td><td>{date(row.joinDate)}</td><td><button onClick={() => setSelected({ type: "enrollment", ...row })} aria-label={`View ${row.name} enrollment`}>View</button></td></tr>)}{!data?.recentStudents?.length && <tr><td colSpan={4} className="ov-empty">{loading ? "Loading enrollments…" : error ? "Enrollment data unavailable." : "No enrollments in this period."}</td></tr>}</tbody></table></div></section>
    <section className="ov-panel"><div className="ov-section-heading"><div className="ov-title"><span className="ov-icon small blue"><ChartNoAxesCombined size={22} /></span><div><h2>Revenue Overview</h2><p>Track your verified payment performance.</p></div></div><select aria-label="Revenue type" value={revenue} onChange={e => setRevenue(e.target.value)}><option value="totalRevenue">All Revenue</option><option value="courseRevenue">Course Revenue</option><option value="subscriptionRevenue">Subscription Revenue</option></select></div><RevenueChart series={data?.series || []} metric={revenue} /></section></div>
    <footer className="ov-footer"><span>{data ? `Updated ${new Date(data.updatedAt).toLocaleTimeString()} · Auto-refresh every minute · Dates in UTC` : "Waiting for academy data"}</span><button disabled={loading} onClick={() => setRefresh(v => v + 1)}><RefreshCw size={15} />{loading ? "Refreshing…" : "Refresh data"}</button></footer>
    {selected && <Details row={selected} onClose={() => setSelected(null)} />}
  </div>;
}
function Person({ row, compact }) { return <div className="ov-person"><span>{(row.name || "Customer").split(" ").slice(0, 2).map(word => word[0]).join("")}</span><div><strong>{row.name}</strong>{!compact && <small>{row.email}</small>}</div></div>; }
function Details({ row, onClose }) {
  const ref = useRef(null);
  useEffect(() => { const dialog = ref.current; const previous = document.activeElement; dialog.showModal(); return () => { dialog.close(); previous?.focus(); }; }, []);
  const fields = row.type === "subscription" ? [["Customer", row.name], ["Email", row.email], ["Plan", row.planName], ["Billing", row.billing], ["Amount paid", money(row.amount)], ["Discount", money(row.discount)], ["Purchased", date(row.purchasedAt)], ["Expiry", date(row.expiresAt)], ["Status", row.status], ["Order ID", row.orderId], ["Payment ID", row.paymentId], ["Payment method", row.method]] : [["Student", row.name], ["Email", row.email], ["Course", row.course], ["Enrolled", date(row.joinDate)], ["Status", row.status]];
  return <dialog ref={ref} className="ov-dialog" aria-labelledby="ov-details-title" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}><div><h2 id="ov-details-title">{row.type === "subscription" ? "Subscription" : "Enrollment"} details</h2><button onClick={onClose} aria-label="Close details" autoFocus><X size={20} /></button></div><dl>{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || "—"}</dd></div>)}</dl>{row.type === "subscription" && <p>Prepaid membership. Renewal requires a new purchase.</p>}</dialog>;
}
