import MentorSessionApproval from "../components/MentorSessionApproval";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarCheck2,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Search,
  Send,
  Users,
  X,
} from "lucide-react";
import api from "../api/client";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}, ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
}

function Badge({ children, tone = "gray" }) {
  const classes = {
    green: "bg-[#ddf8e9] text-[#16855c]",
    orange: "bg-[#fff1c7] text-[#9f6800]",
    red: "bg-[#fee7e7] text-[#c83d3d]",
    blue: "bg-[#e8f3ff] text-[#1778e6]",
    gray: "bg-[#eef2f7] text-[#667085]",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-semibold ${classes[tone]}`}>{children}</span>;
}

function ReviewModal({ project, onClose, onDone }) {
  const [status, setStatus] = useState(project?.status === "rejected" ? "rejected" : "approved");
  const [feedback, setFeedback] = useState(project?.feedback || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  if (!project) return null;

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await api.patch(`/projects/${project.id}/review`, { status, feedback });
      await onDone();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save review.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-[620px] rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.14em] text-blue-600">Project Review</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">{project.title}</h2>
            <p className="mt-1 text-xs text-slate-500">{project.studentName} · {project.courseTitle}</p>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-slate-100"><X size={18} /></button>
        </div>

        {project.submissionUrl ? (
          <a href={project.submissionUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 text-xs font-semibold text-blue-700">
            <FileCheck2 size={15} /> View Submitted Project
          </a>
        ) : (
          <div className="mt-5 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500">No project link was submitted.</div>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-[170px_1fr]">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Decision</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-500">
              <option value="approved">Approved</option>
              <option value="rejected">Needs Changes</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700">Feedback</label>
            <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={4} className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-blue-500" placeholder="Write feedback for the student..." />
          </div>
        </div>
        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="h-10 rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-700">Cancel</button>
          <button onClick={save} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white disabled:opacity-50"><Send size={14} /> {saving ? "Saving..." : "Save Review"}</button>
        </div>
      </div>
    </div>
  );
}

export default function PersonalInstructorDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("students");
  const [search, setSearch] = useState("");
  const [reviewProject, setReviewProject] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data: result } = await api.get("/admin/instructor/me");
      setData(result);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load instructor dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = data?.students || [];
    if (!q) return rows;
    return rows.filter((row) => [row.studentName, row.studentEmail, row.courseTitle].filter(Boolean).some((value) => String(value).toLowerCase().includes(q)));
  }, [data, search]);

  if (loading) return <div className="p-8 text-sm text-slate-500">Loading instructor dashboard...</div>;
  if (error) return <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div>;

  const s = data?.summary || {};
  const cards = [
    ["Assigned Courses", s.courses || 0, BookOpen, "bg-blue-50 text-blue-600"],
    ["Students", s.students || 0, Users, "bg-violet-50 text-violet-600"],
    ["Confirmed Sessions", s.sessions || 0, CalendarCheck2, "bg-emerald-50 text-emerald-600"],
    ["Pending Reviews", s.pendingProjects || 0, ClipboardCheck, "bg-amber-50 text-amber-600"],
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 pb-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-blue-600">Personal Instructor Dashboard</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Welcome, {data?.profile?.name}</h1>
        <p className="mt-1 text-sm text-slate-500">Only your assigned students, sessions, courses and project reviews are shown here.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, Icon, tone]) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}><Icon size={20} /></div>
            <p className="mt-4 text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap gap-1 border-b border-slate-100 px-4 pt-3">
          {[
            ["students", "My Students", Users],
            ["projects", "Project Submissions", ClipboardCheck],
            ["sessions", "Mentor Sessions", CalendarCheck2],
            ["courses", "My Courses", BookOpen],
          ].map(([key, label, Icon]) => (
            <button key={key} onClick={() => setTab(key)} className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold ${tab === key ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500"}`}><Icon size={14} />{label}</button>
          ))}
        </div>

        {tab === "students" && (
          <>
            <div className="border-b border-slate-100 p-4">
              <div className="relative max-w-md"><Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student or course..." className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-xs outline-none focus:border-blue-500" /></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead><tr className="bg-slate-50 text-left text-[10px] uppercase text-slate-500"><th className="px-5 py-3">Student</th><th className="px-4 py-3">Course</th><th className="px-4 py-3 text-center">Sessions</th><th className="px-4 py-3 text-center">Projects</th><th className="px-4 py-3 text-center">Pending Review</th><th className="px-4 py-3">Last Activity</th></tr></thead>
                <tbody>{filteredStudents.map((row) => <tr key={row.enrollmentId} className="border-t border-slate-100"><td className="px-5 py-4"><p className="text-xs font-semibold text-slate-800">{row.studentName}</p><p className="mt-0.5 text-[10px] text-slate-400">{row.studentEmail}</p></td><td className="px-4 py-4 text-xs text-slate-600">{row.courseTitle}</td><td className="px-4 py-4 text-center"><Badge tone="blue">{row.sessionCount}</Badge></td><td className="px-4 py-4 text-center text-xs font-semibold text-slate-700">{row.submittedProjects}</td><td className="px-4 py-4 text-center"><Badge tone={row.pendingReviews ? "orange" : "green"}>{row.pendingReviews}</Badge></td><td className="px-4 py-4 text-[10px] text-slate-500">{formatDate(row.lastActivity)}</td></tr>)}</tbody>
              </table>
              {!filteredStudents.length && <div className="p-10 text-center text-xs text-slate-400">No assigned students yet.</div>}
            </div>
          </>
        )}

        {tab === "projects" && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]"><thead><tr className="bg-slate-50 text-left text-[10px] uppercase text-slate-500"><th className="px-5 py-3">Student</th><th className="px-4 py-3">Course</th><th className="px-4 py-3">Project</th><th className="px-4 py-3">Submitted</th><th className="px-4 py-3">Status</th><th className="px-5 py-3 text-right">Action</th></tr></thead><tbody>{(data?.projects || []).map((row) => <tr key={row.id} className="border-t border-slate-100"><td className="px-5 py-4"><p className="text-xs font-semibold text-slate-800">{row.studentName}</p><p className="text-[10px] text-slate-400">{row.studentEmail}</p></td><td className="px-4 py-4 text-xs text-slate-600">{row.courseTitle}</td><td className="px-4 py-4 text-xs font-semibold text-slate-700">{row.title}</td><td className="px-4 py-4 text-[10px] text-slate-500">{formatDate(row.submittedAt)}</td><td className="px-4 py-4"><Badge tone={row.status === "submitted" ? "orange" : row.status === "approved" ? "green" : "red"}>{row.status === "submitted" ? "Pending Review" : row.status}</Badge></td><td className="px-5 py-4 text-right"><button onClick={() => setReviewProject(row)} className="h-8 rounded-lg border border-blue-200 bg-blue-50 px-3 text-[10px] font-semibold text-blue-700">{row.status === "submitted" ? "Review" : "View / Update"}</button></td></tr>)}</tbody></table>
            {!(data?.projects || []).length && <div className="p-10 text-center text-xs text-slate-400">No project submissions yet.</div>}
          </div>
        )}

        {tab === "sessions" && (
          <div className="overflow-x-auto"><table className="w-full min-w-[820px]"><thead><tr className="bg-slate-50 text-left text-[10px] uppercase text-slate-500"><th className="px-5 py-3">Student</th><th className="px-4 py-3">Course</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Status</th></tr></thead><tbody>{(data?.sessions || []).map((row) => <tr key={row.id} className="border-t border-slate-100"><td className="px-5 py-4"><p className="text-xs font-semibold text-slate-800">{row.studentName}</p><p className="text-[10px] text-slate-400">{row.studentEmail}</p></td><td className="px-4 py-4 text-xs text-slate-600">{row.courseTitle}</td><td className="px-4 py-4 text-[10px] text-slate-500">{formatDate(row.date)}</td><td className="px-4 py-4 text-xs text-slate-600">{row.type}</td><td className="px-4 py-4"><Badge tone={row.status === "confirmed" ? "green" : row.status === "pending" ? "orange" : "gray"}>{row.status}</Badge><MentorSessionApproval session={row} onUpdated={load} /></td></tr>)}</tbody></table>{!(data?.sessions || []).length && <div className="p-10 text-center text-xs text-slate-400">No mentor sessions yet.</div>}</div>
        )}

        {tab === "courses" && (
          <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">{(data?.courses || []).map((c) => <div key={c.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4"><p className="font-semibold text-slate-800">{c.title}</p><p className="mt-1 text-xs text-slate-500">{c.isPublished ? "Published" : "Draft"}</p><div className="mt-3 flex gap-4 text-[10px] text-slate-500"><span>{c.students || 0} students</span><span>{c.projects || 0} projects</span></div></div>)}{!(data?.courses || []).length && <p className="text-sm text-slate-400">No courses assigned yet.</p>}</div>
        )}
      </section>

      <ReviewModal project={reviewProject} onClose={() => setReviewProject(null)} onDone={load} />
    </div>
  );
}
