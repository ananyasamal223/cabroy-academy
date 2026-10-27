import { useCallback, useEffect, useMemo, useState } from "react";
import { Users, BookOpen, Clock, X, IndianRupee, Download, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../api/client";
import { plans } from "../data/plans";
import "./SubscriptionManagement.css";
import PlansBenefits from "./PlansBenefits";
const money = v => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v || 0);
const date = v => v ? new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "—";
const initials = name => (name || "?").split(" ").slice(0, 2).map(s => s[0]).join("");
const label = s => ({ expiring: "Expiring Soon", created: "Pending", paid: "Paid" }[s] || s?.[0]?.toUpperCase() + s?.slice(1));

export default function SubscriptionManagement() {
  const [data, setData] = useState({ subscriptions: [], mentors: [], logs: [], settings: { expiringDays: 30, defaultSessions: 5 } });
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [tab, setTab] = useState("Subscribers"), [search, setSearch] = useState(""), [plan, setPlan] = useState(""), [status, setStatus] = useState(""), [billing, setBilling] = useState("");
  const [from, setFrom] = useState(""), [to, setTo] = useState(""), [page, setPage] = useState(1), [selected, setSelected] = useState([]);
  const [modal, setModal] = useState(null), [saving, setSaving] = useState(false), [form, setForm] = useState({}), [modalError, setModalError] = useState("");
  const load = useCallback(async () => {
    try { const { data } = await api.get("/admin/subscriptions"); setData({ ...data, subscriptions: data.subscriptions.filter(row => row.paymentStatus === "paid") }); setError(""); }
    catch (err) { setError(err.response?.data?.message || "Could not load subscriptions."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); const refresh = () => { if (document.visibilityState === "visible") load(); }; window.addEventListener("focus", refresh); const timer = setInterval(refresh, 60000); return () => { clearInterval(timer); window.removeEventListener("focus", refresh); }; }, [load]);
  useEffect(() => { setPage(1); setSelected([]); }, [search, plan, status, billing, from, to]);
  const rows = useMemo(() => data.subscriptions.filter(r =>
    (!search || `${r.name} ${r.email} ${r.id}`.toLowerCase().includes(search.toLowerCase())) && (!plan || r.planId === plan) && (!status || r.status === status) && (!billing || r.billing === billing)
    && (!from || new Date(r.purchasedAt) >= new Date(`${from}T00:00:00+05:30`)) && (!to || new Date(r.purchasedAt) <= new Date(`${to}T23:59:59+05:30`))), [data, search, plan, status, billing, from, to]);
  const pages = Math.max(1, Math.ceil(rows.length / 10)), currentPage = Math.min(page, pages), visible = rows.slice((currentPage - 1) * 10, currentPage * 10);
  const active = data.subscriptions.filter(r => ["active", "expiring"].includes(r.status));
  const stats = [
    ["Total Subscribers", new Set(data.subscriptions.map(r => r.userId)).size, "All registered subscribers", Users, "blue"],
    ["Active Subscriptions", active.length, "Currently active", BookOpen, "green"],
    ["Expiring Soon", data.subscriptions.filter(r => r.status === "expiring").length, `Within next ${data.settings.expiringDays} days`, Clock, "orange"],
    ["Expired", data.subscriptions.filter(r => r.status === "expired").length, "Ended subscriptions", X, "red"],
    ["Monthly Subscription Value", money(active.reduce((sum, r) => sum + r.amount / (r.billing === "yearly" ? 12 : 1), 0)), "Active plans, normalized monthly", IndianRupee, "purple"],
  ];
  function open(kind, row) {
    setModal({ kind, row }); setModalError("");
    setForm(kind === "add" ? { email: "", planId: "starter", billing: "monthly", amount: "", startDate: new Date().toISOString().slice(0, 10), mentorId: "" } : { mentorId: row.mentorId, sessionsAllowed: row.sessionsAllowed ?? 0, expiresAt: new Date(row.expiresAt).toISOString().slice(0, 10) });
  }
  async function save(e) {
    e.preventDefault(); setSaving(true); setModalError("");
    try {
      if (modal.kind === "add") await api.post("/admin/subscriptions", { ...form, amount: Number(form.amount), startDate: `${form.startDate}T00:00:00+05:30` });
      else await api.patch(`/admin/subscriptions/${modal.row.id}`, { ...form, sessionsAllowed: Number(form.sessionsAllowed), expiresAt: `${form.expiresAt}T23:59:59+05:30` });
      await load(); setModal(null); setNotice(modal.kind === "add" ? "Subscriber added with pending payment." : "Subscription updated.");
    } catch (err) { setModalError(err.response?.data?.message || "Could not save subscription."); } finally { setSaving(false); }
  }
  function exportCSV() {
    const exportRows = selected.length ? rows.filter(r => selected.includes(r.id)) : rows;
    const safe = v => { let s = String(v ?? ""); if (/^[=+@\-\t\r]/.test(s)) s = "'" + s; return '"' + s.replaceAll('"', '""') + '"'; };
    const csv = [["Student", "Email", "Plan", "Billing", "Amount", "Start", "Expiry", "Status", "Payment", "Mentor"], ...exportRows.map(r => [r.name, r.email, r.planName, r.billing, r.amount, r.purchasedAt, r.expiresAt, r.status, r.paymentStatus, r.mentorName])].map(row => row.map(safe).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" })); const a = document.createElement("a"); a.href = url; a.download = "subscriptions.csv"; a.click(); URL.revokeObjectURL(url);
  }
  const update = (key, value) => setForm(f => ({ ...f, [key]: value }));
  if (tab === "Plans") return <><button type="button" className="mb-4 text-sm text-blue-600" onClick={() => setTab("Subscribers")}>← Back to Subscribers</button><PlansBenefits /></>;
  return <div className="sm-page">
    <header className="sm-heading"><div><span>SUBSCRIPTION MANAGEMENT</span><h1>Subscription Management</h1><p>Manage all student subscriptions, track renewals and handle subscription settings.</p></div><div className="sm-actions"><button onClick={exportCSV} disabled={loading || !rows.length}><Download size={16}/> Export</button><button className="sm-primary" onClick={() => open("add")}><Plus size={17}/> Add Subscriber</button></div></header>
    {error && <div role="alert" className="sm-error">{error} <button onClick={load}>Retry</button></div>}{notice && <div role="status" className="sm-notice">{notice}<button aria-label="Dismiss" onClick={() => setNotice("")}><X size={16}/></button></div>}
    <div className="sm-stats">{stats.map(([title, value, caption, Icon, tone]) => <article key={title}><span className={`sm-icon ${tone}`}><Icon size={25}/></span><div><h3>{title}</h3><strong>{loading ? "—" : value}</strong><p>{caption}</p></div></article>)}</div>
    <nav className="sm-tabs" aria-label="Subscription sections">{["Subscribers", "Plans"].map(t => <button key={t} aria-current={tab === t ? "page" : undefined} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t}</button>)}</nav>
    {tab === "Subscribers" && <>
      <div className="sm-filters"><label className="sm-search"><Search size={17}/><input aria-label="Search subscribers" placeholder="Search by name, email or ID..." value={search} onChange={e => setSearch(e.target.value)}/></label>
        <select aria-label="Plan filter" value={plan} onChange={e => setPlan(e.target.value)}><option value="">All Plans</option>{plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select aria-label="Status filter" value={status} onChange={e => setStatus(e.target.value)}><option value="">All Statuses</option>{["active", "expiring", "expired"].map(s => <option key={s} value={s}>{label(s)}</option>)}</select>
        <select aria-label="Billing cycle filter" value={billing} onChange={e => setBilling(e.target.value)}><option value="">All Billing Cycles</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select>
        <label>From<input aria-label="Start date from" type="date" value={from} onChange={e => setFrom(e.target.value)}/></label><label>To<input aria-label="Start date to" type="date" min={from} value={to} onChange={e => setTo(e.target.value)}/></label>
      </div>
      <section className="sm-table-panel"><div className="sm-table-heading"><h2>Subscribers <span>({rows.length.toLocaleString("en-IN")})</span></h2><div><small>{rows.length ? `Showing ${(currentPage - 1) * 10 + 1}–${Math.min(currentPage * 10, rows.length)} of ${rows.length}` : "0 subscribers"}</small><button aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={17}/></button><button aria-label="Next page" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}><ChevronRight size={17}/></button></div></div>
        <div className="sm-table-scroll"><table><thead><tr><th><input type="checkbox" aria-label="Select visible subscribers" checked={visible.length > 0 && visible.every(r => selected.includes(r.id))} onChange={e => setSelected(e.target.checked ? [...new Set([...selected, ...visible.map(r => r.id)])] : selected.filter(id => !visible.some(r => r.id === id)))}/></th>{["Student", "Email", "Plan", "Billing Cycle", "Amount", "Start Date", "Renewal/Expiry Date", "Status", "Payment Status", "Assigned Mentor", "Action"].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>
          {visible.map(r => <tr key={r.id}><td><input type="checkbox" aria-label={`Select ${r.name}`} checked={selected.includes(r.id)} onChange={e => setSelected(e.target.checked ? [...selected, r.id] : selected.filter(id => id !== r.id))}/></td><td><div className="sm-person"><span>{initials(r.name)}</span><div><strong>{r.name}</strong><small title={r.id}>#{r.id.slice(-7).toUpperCase()}</small></div></div></td><td>{r.email}</td><td><span className={`sm-badge ${r.planId}`}>{r.planName}</span></td><td>{label(r.billing)}</td><td className="sm-amount">{money(r.amount)}</td><td>{date(r.purchasedAt)}</td><td>{date(r.expiresAt)}</td><td><span className={`sm-badge ${r.status}`}>{label(r.status)}</span></td><td><span className={`sm-badge ${r.paymentStatus}`}>{label(r.paymentStatus)}</span></td><td>{r.mentorId ? <div className="sm-person"><span>{initials(r.mentorName)}</span>{r.mentorName}</div> : "—"}</td><td><div className="sm-row-actions"><button onClick={() => open("view", r)}>View</button><button onClick={() => open("edit", r)}>Edit</button></div></td></tr>)}
          {!visible.length && <tr><td colSpan={12} className="sm-empty">{loading ? "Loading subscriptions..." : error ? "Subscription data unavailable." : "No subscriptions match these filters."}</td></tr>}
        </tbody></table></div>
      </section>
    </>}
    {tab === "Plans" && <div className="sm-plan-grid">{plans.map(p => <article key={p.id}><span className={`sm-badge ${p.id}`}>{p.name}</span><h2>{money(p.price)} <small>/ month</small></h2><p>{p.description}</p><ul>{p.features.map(f => <li key={f[0]}>{f[0]}</li>)}</ul><button onClick={() => { setPlan(p.id); setTab("Subscribers"); }}>View subscribers</button></article>)}</div>}
    {tab === "Subscription Logs" && <section className="sm-table-panel"><h2>Subscription Logs</h2>{data.logs.length ? data.logs.map(log => <div className="sm-log" key={log._id}><strong>{log.action}</strong><p>{log.details}</p><small>{log.actor?.name || "Admin"} · {new Date(log.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</small></div>) : <p className="sm-empty">No management activity recorded yet.</p>}</section>}
    {tab === "Settings" && <form className="sm-settings" onSubmit={async e => { e.preventDefault(); setSaving(true); try { await api.put("/admin/subscription-settings", data.settings); await load(); setNotice("Settings saved."); } catch (err) { setError(err.response?.data?.message || "Could not save settings."); } finally { setSaving(false); } }}><h2>Subscription Settings</h2><label>Expiring soon threshold (days)<input type="number" min="1" max="365" required value={data.settings.expiringDays} onChange={e => setData(d => ({ ...d, settings: { ...d.settings, expiringDays: Number(e.target.value) } }))}/></label><label>Default mentor sessions for new manual subscribers<input type="number" min="0" max="10000" required value={data.settings.defaultSessions} onChange={e => setData(d => ({ ...d, settings: { ...d.settings, defaultSessions: Number(e.target.value) } }))}/></label><p>Billing does not renew automatically. Payment status comes from verified payment records.</p><button className="sm-primary" disabled={saving}>{saving ? "Saving..." : "Save settings"}</button></form>}
    {modal && <div className="sm-backdrop"><section className="sm-modal" role="dialog" aria-modal="true" aria-labelledby="sm-modal-title"><button className="sm-close" aria-label="Close" disabled={saving} onClick={() => setModal(null)}><X size={20}/></button><h2 id="sm-modal-title">{modal.kind === "add" ? "Add Subscriber" : modal.kind === "edit" ? "Edit Subscription" : "Subscription Details"}</h2>
      {modal.kind === "view" ? <><dl>{[["Student", modal.row.name], ["Email", modal.row.email], ["Subscription ID", modal.row.id], ["Plan", modal.row.planName], ["Billing", label(modal.row.billing)], ["Amount", money(modal.row.amount)], ["Start", date(modal.row.purchasedAt)], ["Expiry", date(modal.row.expiresAt)], ["Status", label(modal.row.status)], ["Payment", label(modal.row.paymentStatus)], ["Mentor", modal.row.mentorName], ["Session allowance", modal.row.sessionsAllowed ?? "Not configured"]].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl><button className="sm-primary" onClick={() => open("edit", modal.row)}>Edit subscription</button></> : <form onSubmit={save}>
        {modal.kind === "add" ? <><label>Registered student email<input type="email" required value={form.email} onChange={e => update("email", e.target.value)}/></label><div className="sm-form-grid"><label>Plan<select value={form.planId} onChange={e => update("planId", e.target.value)}>{plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Billing cycle<select value={form.billing} onChange={e => update("billing", e.target.value)}><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></label><label>Amount (INR)<input type="number" min="0" step="0.01" required value={form.amount} onChange={e => update("amount", e.target.value)}/></label><label>Start date<input type="date" required value={form.startDate} onChange={e => update("startDate", e.target.value)}/></label></div><p className="sm-info">Adds a pending subscription record. Course access requires verified payment.</p></> : <><p>{modal.row.name} · {modal.row.planName}</p><label>Expiry date<input type="date" required value={form.expiresAt} onChange={e => update("expiresAt", e.target.value)}/></label><label>Mentor session allowance<input type="number" min="0" max="10000" required value={form.sessionsAllowed} onChange={e => update("sessionsAllowed", e.target.value)}/></label></>}
        <label>Assigned mentor<select value={form.mentorId} onChange={e => update("mentorId", e.target.value)}><option value="">Not assigned</option>{data.mentors.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}</select></label>{modalError && <p role="alert" className="sm-error">{modalError}</p>}<button disabled={saving} className="sm-primary">{saving ? "Saving..." : "Save subscriber"}</button>
      </form>}
    </section></div>}
  </div>;
}
