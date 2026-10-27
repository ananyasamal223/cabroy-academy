import { useEffect, useRef, useState } from "react";
import { Users, Crown, BookOpen, UserRound, Search, Download, FileText, MoreHorizontal, ChevronLeft, ChevronRight, RefreshCw, X } from "lucide-react";
import api from "../api/client";
import DashboardDateFilter from "./DashboardDateFilter";
import "./Overview.css";
import "./UserReports.css";

const dates = value => value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }) : "—";
const money = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
const initials = name => name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
const statuses = { active: "Active", expiring: "Expiring Soon", expired: "Expired", none: "No Subscription" };
const subscriptionStatus = sub => sub.status === "expired" ? "expired" : Math.ceil((new Date(sub.expiresAt) - new Date()) / 86400000) <= 14 ? "expiring" : "active";
function PlanBadges({ row, onView }) {
  if (!row.subscriptions.length) return <span className="ur-plan none">None</span>;
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{row.subscriptions.map(sub => <button key={sub.id} className={`ur-plan ${sub.planId}`} onClick={onView} title={`${sub.planName}: ${statuses[subscriptionStatus(sub)]}, expires ${dates(sub.expiresAt)}`}>{sub.planName}</button>)}</div>;
}
function exportRows(rows) {
  const cells = value => {
    let text = String(value ?? "");
    if (/^[\s]*[=+@-]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const content = [["Student Name", "Email", "Purchased Courses", "Subscription Plan", "Subscription Status", "Purchase Date", "Expiry", "Assigned Mentors", "Total Paid (INR)"], ...rows.map(row => [row.name, row.email, row.courses.map(c => c.title).join("; "), row.subscriptions.map(s => s.planName).join("; ") || "None", row.subscriptions.map(s => statuses[subscriptionStatus(s)]).join("; ") || statuses.none, dates(row.purchaseDate), dates(row.subscription?.expiresAt), row.mentors.map(m => m.name).join("; ") || "Not Assigned", row.totalPaid])].map(row => row.map(cells).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = `user-reports-${new Date().toISOString().slice(0, 10)}.csv`; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Avatar({ name, muted = false }) { return <span className={`ur-avatar ${muted ? "muted" : ""}`}>{muted ? <UserRound size={17} /> : initials(name || "Student")}</span>; }
function Status({ value }) { return <span className={`ur-status ${value}`}><i />{statuses[value]}</span>; }

export default function UserReports() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("all");
  const [status, setStatus] = useState("all");
  const [mentor, setMentor] = useState("all");
  const [range, setRange] = useState({ from: "", to: "" });
  const [page, setPage] = useState(1);
  const [selection, setSelection] = useState(new Set());
  const [detail, setDetail] = useState(null);
  const [menu, setMenu] = useState(null);
  const checkAll = useRef(null);
  useEffect(() => {
    const refresh = () => { if (!document.hidden) setReload(n => n + 1); };
    window.addEventListener("focus", refresh);
    const timer = setInterval(refresh, 60000);
    return () => { window.removeEventListener("focus", refresh); clearInterval(timer); };
  }, []);
  useEffect(() => {
    const close = event => { if (event.key === "Escape" || (event.type === "pointerdown" && !event.target.closest(".ur-menu-wrap"))) setMenu(null); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", close); };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    api.get("/admin/user-reports", { signal: controller.signal }).then(res => { setData(res.data); setError(""); }).catch(err => { if (!controller.signal.aborted) setError(err.response?.data?.message || "Could not load user reports. Please retry."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [reload]);
  const refresh = () => { setLoading(true); setReload(n => n + 1); };
  const resetPage = () => { setPage(1); setSelection(new Set()); setMenu(null); };
  const change = setter => event => { setter(event.target.value); resetPage(); };
  const rows = data?.rows || [];
  const filtered = rows.filter(row => {
    const query = search.trim().toLowerCase();
    const matchesSearch = !query || [row.name, row.email, ...row.courses.map(c => c.title)].some(text => text.toLowerCase().includes(query));
    const activityDates = row.purchaseDates.length ? row.purchaseDates : [row.joinedAt];
    const matchesDate = (!range.from && !range.to) || activityDates.some(value => { const day = value?.slice(0, 10); return day && (!range.from || day >= range.from) && (!range.to || day <= range.to); });
    const matchesSubscription = row.subscriptions.length ? row.subscriptions.some(sub => (plan === "all" || sub.planId === plan) && (status === "all" || subscriptionStatus(sub) === status)) : (plan === "all" || plan === "none") && (status === "all" || status === "none");
    return matchesSearch && matchesDate && matchesSubscription && (mentor === "all" || (mentor === "none" ? !row.mentors.length : row.mentors.some(m => m.id === mentor)));
  });
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * 10, currentPage * 10);
  const selectedRows = filtered.filter(row => selection.has(row.id));
  const allChecked = visible.length > 0 && visible.every(row => selection.has(row.id));
  const someChecked = visible.some(row => selection.has(row.id));
  useEffect(() => { if (checkAll.current) checkAll.current.indeterminate = someChecked && !allChecked; }, [someChecked, allChecked]);
  const toggle = id => setSelection(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const stats = data?.stats;
  const cards = [[Users, "Total Students", stats?.students, "Registered learners", "blue"], [Crown, "Subscribers", stats?.subscribers, "Active subscription users", "green"], [BookOpen, "Purchased Courses", stats?.courses, "Total verified course purchases", "purple"], [UserRound, "Assigned Mentors", stats?.mentors, "Students with mentors", "orange"]];
  const selected = rows.find(row => row.id === detail?.id);
  const pageNumbers = [...new Set([1, ...Array.from({ length: 5 }, (_, i) => currentPage - 2 + i).filter(n => n > 1 && n < pages), pages])].sort((a, b) => a - b);
  const mentorOptions = [...new Map([...(data?.mentors || []), ...rows.flatMap(row => row.mentors)].map(m => [m.id, m])).values()];
  return <div className="ov-dashboard ur-page">
    <header className="ov-heading"><div><span className="ov-eyebrow">ADMIN PORTAL</span><h1>User Reports</h1><p>View and manage all students, their subscriptions, purchased courses and mentor assignments.</p></div><DashboardDateFilter range={range} onChange={value => { setRange(value); resetPage(); }} /></header>
    <section className="ur-stats">{cards.map(([Icon, label, count, caption, tone]) => <article key={label}><span className={`ov-icon ${tone}`}><Icon size={29} /></span><div><h2>{label}</h2><strong>{count == null ? loading ? "…" : "—" : count.toLocaleString("en-IN")}</strong><p>{caption}</p></div></article>)}</section>
    {error && <div className="ov-error" role="alert">{error}<button onClick={refresh}>Retry</button></div>}
    <section className="ur-report" aria-busy={loading}>
      <div className="ur-toolbar"><label className="ur-search"><Search size={18} /><input aria-label="Search students" placeholder="Search by student name, email or course..." value={search} onChange={change(setSearch)} /></label><select aria-label="Subscription plan" value={plan} onChange={change(setPlan)}><option value="all">All Subscription Plans</option><option value="starter">Starter</option><option value="pro">Pro</option><option value="business">Business</option><option value="none">No Subscription</option></select><select aria-label="Subscription status" value={status} onChange={change(setStatus)}><option value="all">All Statuses</option>{Object.entries(statuses).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select><select aria-label="Assigned mentor" value={mentor} onChange={change(setMentor)}><option value="all">All Mentors</option><option value="none">Not Assigned</option>{mentorOptions.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select><button onClick={() => { setSearch(""); setPlan("all"); setStatus("all"); setMentor("all"); setRange({ from: "", to: "" }); resetPage(); }}>Reset</button><button className="ur-export" disabled={loading || !filtered.length} onClick={() => exportRows(selectedRows.length ? selectedRows : filtered)}><Download size={16} />{selectedRows.length ? `Export Selected (${selectedRows.length})` : "Export Report"}</button></div>
      <div className="ur-table-scroll"><table className="ur-table"><thead><tr><th><input ref={checkAll} type="checkbox" aria-label="Select all students on this page" checked={allChecked} disabled={!visible.length} onChange={() => setSelection(previous => { const next = new Set(previous); visible.forEach(row => allChecked ? next.delete(row.id) : next.add(row.id)); return next; })} /></th>{["Student Name", "Email", "Purchased Courses", "Subscription Plan", "Subscription Status", "Purchase Date", "Renewal / Expiry", "Assigned Mentor", "Action"].map(label => <th key={label}>{label}</th>)}<th aria-label="More actions" /></tr></thead><tbody>
        {visible.map(row => <tr key={row.id} className={selection.has(row.id) ? "is-selected" : ""}><td><input type="checkbox" checked={selection.has(row.id)} onChange={() => toggle(row.id)} aria-label={`Select ${row.name}`} /></td><td><div className="ur-person"><Avatar name={row.name} /><div><strong>{row.name}</strong><small>{row.email}</small></div></div></td><td>{row.email}</td><td><div className="ur-courses">{row.courses.slice(0, 2).map(c => <span key={c.id}>{c.title}</span>)}{!row.courses.length && <small>No course purchases</small>}{row.courses.length > 2 && <button onClick={() => setDetail({ id: row.id })} aria-label={`View all courses for ${row.name}`}>+{row.courses.length - 2}</button>}</div></td><td><PlanBadges row={row} onView={() => setDetail({ id: row.id })} /></td><td><Status value={row.status} /></td><td>{dates(row.purchaseDate)}</td><td>{dates(row.subscription?.expiresAt)}{row.subscription && <small className={`ur-expiry ${row.status}`}>{row.status === "expired" ? "(Expired)" : `(${row.daysLeft} days left)`}</small>}</td><td><button className="ur-mentor" onClick={() => setDetail({ id: row.id, mentors: true })} aria-label={`Manage mentors for ${row.name}`}><Avatar name={row.mentors[0]?.name} muted={!row.mentors.length} /><span>{row.mentors[0]?.name || "Not Assigned"}{row.mentors.length > 1 && ` +${row.mentors.length - 1}`}</span></button></td><td><button className="ur-view" onClick={() => setDetail({ id: row.id })}><FileText size={15} />{row.status === "none" ? "View Student" : row.status === "expired" ? "View Subscription" : "View Report"}</button></td><td><div className="ur-menu-wrap"><button className="ur-more" aria-label={`More actions for ${row.name}`} aria-expanded={menu === row.id} onClick={() => setMenu(menu === row.id ? null : row.id)}><MoreHorizontal size={17} /></button>{menu === row.id && <div className="ur-menu" onKeyDown={event => { if (event.key === "Escape") setMenu(null); }}><button onClick={() => { setDetail({ id: row.id, mentors: true }); setMenu(null); }}>Manage mentors</button><button onClick={() => { exportRows([row]); setMenu(null); }}>Export student report</button></div>}</div></td></tr>)}
        {!visible.length && <tr><td colSpan={11} className="ur-empty">{loading ? "Loading student reports…" : error ? "Reports unavailable. Please retry." : "No students match these filters."}</td></tr>}
      </tbody></table></div>
      <footer className="ur-pagination"><span>Showing {filtered.length ? (currentPage - 1) * 10 + 1 : 0} to {Math.min(currentPage * 10, filtered.length)} of {filtered.length.toLocaleString("en-IN")} students</span><nav aria-label="Report pages"><button aria-label="Previous page" disabled={currentPage <= 1} onClick={() => { setPage(currentPage - 1); setMenu(null); }}><ChevronLeft size={16} /></button>{pageNumbers.map((n, i) => <span key={n}>{i > 0 && n > pageNumbers[i - 1] + 1 && <span className="ur-page-gap">…</span>}<button aria-label={`Page ${n}`} aria-current={n === currentPage ? "page" : undefined} className={n === currentPage ? "current" : ""} onClick={() => { setPage(n); setMenu(null); }}>{n}</button></span>)}<button aria-label="Next page" disabled={currentPage >= pages} onClick={() => { setPage(currentPage + 1); setMenu(null); }}><ChevronRight size={16} /></button></nav></footer>
    </section>
    <div className="ov-footer"><span>Summary cards show academy totals. Date filters match purchases, or registration for students without purchases. Dates in UTC.</span><button onClick={refresh} disabled={loading}><RefreshCw size={14} />Refresh</button></div>
    {selected && <StudentReport key={selected.id} row={selected} mentors={data?.mentors || []} focusMentors={detail.mentors} onClose={() => setDetail(null)} onSaved={refresh} />}
  </div>;
}

function StudentReport({ row, mentors, focusMentors, onClose, onSaved }) {
  const ref = useRef(null);
  const mentorSection = useRef(null);
  const [saving, setSaving] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { const dialog = ref.current; const previous = document.activeElement; dialog.showModal(); if (focusMentors) mentorSection.current?.scrollIntoView({ block: "nearest" }); return () => { dialog.close(); previous?.focus(); }; }, [focusMentors]);
  const assign = async (course, mentorId) => {
    if (!mentorId || mentorId === course.mentorId) return;
    setSaving(course.id); setError(""); setMessage("");
    try { await api.patch(`/admin/enrollments/${row.id}/${course.courseId}/mentor`, { mentorId }); setMessage(`Mentor updated for ${course.course}.`); onSaved(); }
    catch (err) { setError(err.response?.data?.message || "Could not assign mentor. Please retry."); }
    finally { setSaving(null); }
  };
  return <dialog ref={ref} className="ur-dialog" aria-labelledby="ur-report-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}><header><div><span>STUDENT REPORT</span><h2 id="ur-report-title">{row.name}</h2><p>{row.email}</p></div><button onClick={onClose} aria-label="Close student report" autoFocus><X size={21} /></button></header><div className="ur-detail-summary"><div><small>Registered</small><strong>{dates(row.joinedAt)}</strong></div><div><small>Verified payments</small><strong>{money(row.totalPaid)}</strong></div><div><small>Subscription</small><Status value={row.status} /></div></div>
    <section><h3>Subscription history</h3>{row.subscriptions.length ? <div className="ur-detail-scroll"><table><thead><tr><th>Plan</th><th>Billing</th><th>Paid</th><th>Purchased</th><th>Expiry</th><th>Status</th></tr></thead><tbody>{row.subscriptions.map(s => <tr key={s.id}><td>{s.planName}</td><td>{s.billing}</td><td>{money(s.amount)}</td><td>{dates(s.purchasedAt)}</td><td>{dates(s.expiresAt)}</td><td>{s.status}</td></tr>)}</tbody></table></div> : <p>No subscription purchases.</p>}<p className="ur-detail-note">Memberships are prepaid. Expiry is not an automatic renewal charge.</p></section>
    <section ref={mentorSection}><h3>Courses & mentor assignments</h3>{message && <p className="ur-success" role="status">{message}</p>}{error && <p className="ur-failure" role="alert">{error}</p>}{!row.enrollments.length && <p>No course enrollments available for mentor assignment.</p>}{row.enrollments.map(course => <div className="ur-enrollment" key={course.id}><div><strong>{course.course}</strong><small>{course.status} · Enrolled {dates(course.enrolledAt)}</small></div><label>Assigned mentor<select value={course.mentorId || ""} disabled={saving !== null || !course.courseId || course.status === "cancelled"} onChange={event => assign(course, event.target.value)} aria-label={`Assign mentor for ${course.course}`}><option value="" disabled>Choose mentor</option>{course.mentorId && !mentors.some(m => m.id === course.mentorId) && <option value={course.mentorId}>{course.mentor} (unavailable)</option>}{mentors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select>{saving === course.id && <small>Saving…</small>}</label></div>)}</section>
    <section><h3>Payment history</h3>{row.payments.length ? <div className="ur-detail-scroll"><table><thead><tr><th>Purchased</th><th>Item</th><th>Amount paid</th><th>Order ID</th></tr></thead><tbody>{row.payments.map(p => <tr key={p.id}><td>{dates(p.date)}</td><td>{p.plan || p.courses.join(", ") || "Deleted course"}</td><td>{money(p.amount)}</td><td>{p.orderId}</td></tr>)}</tbody></table></div> : <p>No verified payments.</p>}</section><footer><button onClick={() => exportRows([row])}><Download size={15} />Export student report</button><button onClick={onClose}>Close</button></footer></dialog>;
}
