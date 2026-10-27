import { useMemo, useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Award, CheckCircle2, Hourglass, Download, Search, Eye, ChevronLeft, ChevronRight, BookOpen, ArrowUpRight, X } from "lucide-react";
import "./Certificates.css";
import api from "../api/client";

function exportRecords(records) {
  const escape = value => `"${String(value).replaceAll('"', '""')}"`;
  const rows = [["Certificate ID", "Student", "Email", "Course", "Issued on", "Certificate number", "Status"], ...records.map(item => [item.id, item.student, item.email, item.course, item.issuedOn, item.certificateNo, item.status])];
  const url = URL.createObjectURL(new Blob(["\uFEFF" + rows.map(row => row.map(escape).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a"); link.href = url; link.download = "certificate-records.csv"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Certificates() {
  const [certificates, setCertificates] = useState([]);
  const [catalogCourses, setCatalogCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    Promise.all([
      api.get("/admin/certificates", { signal: controller.signal }),
      api.get("/courses?published=all", { signal: controller.signal }),
    ]).then(([{ data }, catalog]) => {
      if (!Array.isArray(data?.certificates)) throw new Error("Invalid certificate response");
      if (!Array.isArray(catalog.data?.courses)) throw new Error("Invalid course response");
      if (controller.signal.aborted) return;
      setCatalogCourses(catalog.data.courses);
      setCertificates(data.certificates.map(item => ({
        id: item._id,
        student: item.user?.name || "Student unavailable",
        email: item.user?.email || "Not available",
        course: item.course?.title || "Course unavailable",
        issuedOn: item.issuedAt && !Number.isNaN(new Date(item.issuedAt).getTime())
          ? new Date(item.issuedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Not available",
        certificateNo: item.certificateId || "Not available",
        status: "Issued",
      })));
    }).catch(err => {
      if (!controller.signal.aborted) { setCertificates([]); setError(err.response?.data?.message || "Could not load certificates. Please try again."); }
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);
  const [search, setSearch] = useState("");
  const [course, setCourse] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [selected, setSelected] = useState(null);
  const representedCourses = [...new Set(certificates.map(item => item.course))];
  const courseNames = [...new Set([...catalogCourses.map(item => item.title).filter(Boolean), ...representedCourses])];
  const issued = certificates.filter(item => item.status === "Issued").length;

  const filtered = useMemo(() => certificates.filter(item => (!course || item.course === course) && (!status || item.status === status) && [item.id, item.student, item.email, item.course, item.certificateNo].some(value => value.toLowerCase().includes(search.trim().toLowerCase()))), [certificates, search, course, status]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);
  const start = (currentPage - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);
  const reset = () => { setSearch(""); setCourse(""); setStatus(""); setPage(1); };
  const metrics = [
    { title: "Total certificates", value: certificates.length, caption: "Across all listed courses", icon: Award, tone: "blue" },
    { title: "Issued certificates", value: issued, caption: "Successfully issued to learners", icon: CheckCircle2, tone: "green" },
    { title: "Courses represented", value: representedCourses.length, caption: "Courses with certificate records", icon: BookOpen, tone: "purple" },
  ];
  const topCourses = courseNames.map(name => ({ name, count: certificates.filter(item => item.course === name).length })).sort((a, b) => b.count - a.count);
  return <div className="cert-page">
    <header className="cert-heading"><div><div className="cert-eyebrow"><Award size={15} /> LEARNER ACHIEVEMENTS</div><h1>Certificates</h1><p>Keep every learning milestone organized, verified, and easy to find.</p></div><button className="cert-primary" onClick={() => exportRecords(filtered)} disabled={loading || !!error || !filtered.length}><Download size={17} /> Export records</button></header>
    <div className="cert-context"><nav aria-label="Breadcrumb"><Link to="/admin">Dashboard</Link><ChevronRight size={13} /><span>Certificates</span></nav><button className="cert-secondary" disabled={loading} onClick={() => setRefresh(value => value + 1)}>{loading ? "Loading..." : "Refresh"}</button></div>
    {loading && <p role="status" className="cert-panel">Loading certificates from the backend...</p>}
    {error && <div role="alert" className="cert-panel">{error} <button className="cert-secondary" onClick={() => setRefresh(value => value + 1)}>Retry</button></div>}
    {!loading && !error && <>
    <section className="cert-metrics" aria-label="Certificate overview">{metrics.map(({ title, value, caption, icon: Icon, tone }) => <article key={title} className="cert-metric"><div className="cert-metric-top"><span>{title}</span><span className={`cert-icon ${tone}`}><Icon size={20} /></span></div><strong>{value.toLocaleString()}</strong><p>{caption}</p></article>)}</section>
    <section className="cert-insights" aria-label="Certificate insights"><article className="cert-panel cert-status-panel"><div className="cert-panel-heading"><div><h2>Certificate status</h2><p>An overview of the listed records</p></div><span className="cert-soft-icon"><Award size={20} /></span></div><div className="cert-status-content"><div className="cert-donut" role="img" aria-label={`${issued} issued certificates`} style={{ background: issued ? "#31ad8b" : "#e5e7eb" }}><div><strong>{certificates.length}</strong><span>Total records</span></div></div><div className="cert-legend"><button onClick={() => { setStatus("Issued"); setPage(1); }}><span className="cert-dot issued" /><span>Issued<strong>{issued} certificates</strong></span><b>{Math.round(issued / Math.max(certificates.length, 1) * 100)}%</b></button></div></div></article>
    <article className="cert-panel"><div className="cert-panel-heading"><div><h2>Certificates by course</h2><p>Distribution across your learning programs</p></div><BookOpen size={20} /></div><div className="cert-course-list">{topCourses.map((item, index) => <button key={item.name} onClick={() => { setCourse(item.name); setPage(1); }} className="cert-course"><span className="cert-rank">{String(index + 1).padStart(2, "0")}</span><div><div className="cert-course-title"><strong>{item.name}</strong><span>{item.count} certificates</span></div><span className="cert-track"><span style={{ width: `${item.count / Math.max(certificates.length, 1) * 100}%` }} /></span></div><ArrowUpRight size={16} /></button>)}</div></article></section>
    <section className="cert-panel cert-records"><div className="cert-record-heading"><div><h2>Certificate directory <span>{certificates.length}</span></h2><p>Find a learner, check a status, or view certificate details.</p></div></div>
      <div id="certificate-filters" className="cert-filters"><label className="cert-search"><Search size={18} /><input aria-label="Search certificates" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Search student, course, or certificate ID…" />{search && <button aria-label="Clear search" onClick={() => { setSearch(""); setPage(1); }}><X size={15} /></button>}</label><label><span>Course</span><select value={course} onChange={event => { setCourse(event.target.value); setPage(1); }}><option value="">All courses</option>{courseNames.map(name => <option key={name}>{name}</option>)}</select></label><label><span>Status</span><select value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option><option>Issued</option></select></label>{(search || course || status) && <button className="cert-reset" onClick={reset}>Reset filters</button>}</div>
      <div className="cert-table-scroll" tabIndex={0} role="region" aria-label="Certificate records"><table><thead><tr><th scope="col">Student</th><th scope="col">Course</th><th scope="col">Certificate</th><th scope="col">Issued on</th><th scope="col">Status</th><th scope="col"><span className="cert-sr-only">Actions</span></th></tr></thead><tbody>{rows.map((item, index) => <tr key={item.id}><td><div className="cert-student"><span className={`cert-avatar tone-${index % 4}`} aria-hidden="true">{item.student.split(" ").map(part => part[0]).slice(0, 2).join("")}</span><div><strong>{item.student}</strong><span>{item.email}</span></div></div></td><td><span className="cert-course-name">{item.course}</span></td><td><span className="cert-id">{item.id}</span><span className="cert-number">{item.certificateNo}</span></td><td className="cert-date">{item.issuedOn}</td><td><StatusPill status={item.status} /></td><td><button className="cert-view" onClick={() => setSelected(item)} aria-label={`View certificate details for ${item.student}`}><Eye size={16} /><span>View</span></button></td></tr>)}</tbody></table>{!rows.length && <div className="cert-no-results"><Search size={28} /><h3>No certificates found</h3><p>{certificates.length ? "Try a different name, certificate ID, or filter." : "No certificates have been issued yet."}</p><button className="cert-secondary" onClick={reset}>Clear filters</button></div>}</div>
      <footer className="cert-pagination"><p role="status">Showing <strong>{filtered.length ? start + 1 : 0}–{Math.min(start + pageSize, filtered.length)}</strong> of <strong>{filtered.length}</strong> records</p><div><label>Rows per page<select value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }}><option value={5}>5</option><option value={10}>10</option><option value={25}>25</option></select></label><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button><span className="cert-page-number">{currentPage} / {pages}</span><button disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)} aria-label="Next page"><ChevronRight size={16} /></button></div></footer>
    </section>
    </>}
    {selected && <CertificateDetails item={selected} onClose={() => setSelected(null)} />}
  </div>;
}
function StatusPill({ status }) { return <span className={`cert-pill ${status.toLowerCase()}`}>{status === "Issued" ? <CheckCircle2 size={13} /> : <Hourglass size={13} />}{status}</span>; }
function CertificateDetails({ item, onClose }) {
  const dialog = useRef(null);
  useEffect(() => { const node = dialog.current; node.showModal(); return () => node.close(); }, []);
  return <dialog ref={dialog} aria-label="Certificate details" className="cert-dialog" onCancel={onClose} onClose={onClose}><div className="cert-dialog-heading"><span className="cert-icon blue"><Award size={23} /></span><button onClick={onClose} aria-label="Close certificate details"><X size={20} /></button></div><h2>Certificate details</h2><p className="cert-dialog-subtitle">{item.id}</p><StatusPill status={item.status} /><dl>{[["Student", item.student], ["Email", item.email], ["Course", item.course], ["Issued on", item.issuedOn], ["Certificate number", item.certificateNo]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl><button className="cert-secondary" onClick={() => exportRecords([item])}><Download size={16} /> Export record as CSV</button></dialog>;
}
