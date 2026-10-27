import MentorSessionApproval from "../components/MentorSessionApproval";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CalendarCheck2,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  RefreshCw,
  Search,
  Send,
  UserCheck,
  UserRoundCog,
  Users,
  X,
} from "lucide-react";
import api from "../api/client";

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
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  return `${date}, ${time}`;
}

function initials(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
}

function StatCard({ icon: Icon, label, value, tone = "blue", sub }) {
  const tones = {
    blue: ["bg-[#e8f4ff]", "text-[#1487e8]"],
    green: ["bg-[#e6f9ef]", "text-[#0aa56b]"],
    purple: ["bg-[#f0ebff]", "text-[#6f4bea]"],
    orange: ["bg-[#fff2df]", "text-[#ef8a13]"],
  };
  const [wrap, color] = tones[tone] || tones.blue;
  return (
    <article className="rounded-[17px] border border-[#e4eaf3] bg-white p-5 shadow-[0_8px_24px_rgba(31,64,110,.04)]">
      <div className="flex items-start gap-4">
        <div className={`grid h-[48px] w-[48px] shrink-0 place-items-center rounded-[13px] ${wrap}`}>
          <Icon size={22} className={color} />
        </div>
        <div>
          <p className="text-[11px] font-medium text-[#66748a]">{label}</p>
          <p className="mt-1 text-[26px] font-bold leading-none text-[#111b35]">{value}</p>
          {sub && <p className="mt-2 text-[9px] text-[#8a94a8]">{sub}</p>}
        </div>
      </div>
    </article>
  );
}

function Badge({ children, tone = "gray" }) {
  const classes = {
    green: "bg-[#ddf8e9] text-[#16855c]",
    orange: "bg-[#fff1c7] text-[#9f6800]",
    red: "bg-[#fee7e7] text-[#c83d3d]",
    blue: "bg-[#e8f3ff] text-[#1778e6]",
    purple: "bg-[#f0eaff] text-[#6f4bea]",
    gray: "bg-[#eef2f7] text-[#667085]",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-semibold ${classes[tone]}`}>{children}</span>;
}

function ReassignModal({ open, onClose, instructor, instructors, onDone }) {
  const [mode, setMode] = useState("auto");
  const [target, setTarget] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [liveInstructors, setLiveInstructors] = useState(instructors || []);
  const [candidatesLoading, setCandidatesLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setMode("auto");
    setTarget("");
    setError("");
    setLiveInstructors(instructors || []);

    const refreshCandidates = async () => {
      setCandidatesLoading(true);
      try {
        const { data } = await api.get("/admin/instructors", {
          params: { _t: Date.now() },
        });
        if (!cancelled) {
          const next = data?.instructors || [];
          setLiveInstructors(next);
          const available = next.filter(
            (item) =>
              String(item.id) !== String(instructor?.id) &&
              item.status === "active" &&
              item.isActive !== false
          );
          if (!available.length) {
            setError("No other active instructors are available.");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Could not load active instructors.");
        }
      } finally {
        if (!cancelled) setCandidatesLoading(false);
      }
    };

    refreshCandidates();
    return () => {
      cancelled = true;
    };
  }, [open, instructor?.id]);

  if (!open) return null;

  const candidates = liveInstructors.filter(
    (item) =>
      String(item.id) !== String(instructor?.id) &&
      item.status === "active" &&
      item.isActive !== false
  );

  const submit = async () => {
    if (candidatesLoading) return;
    if (!candidates.length) {
      setError("No other active instructors are available.");
      return;
    }
    if (mode === "target" && !target) {
      setError("Select the instructor who should receive these students.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { data } = await api.post(`/admin/instructors/${instructor.id}/reassign-students`, {
        mode,
        targetInstructorId: mode === "target" ? target : undefined,
      });
      if (onDone) await onDone(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Could not reassign students.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#0f172a]/45 p-4 backdrop-blur-[2px]">
      <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto w-full max-w-[590px] rounded-[20px] border border-[#e2e8f0] bg-white p-6 shadow-[0_28px_80px_rgba(15,23,42,.25)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-[12px] bg-[#eef4ff] text-[#2563eb]">
              <UserRoundCog size={21} />
            </div>
            <div>
              <h2 className="text-[20px] font-bold text-[#101828]">Reassign Students</h2>
              <p className="mt-1 text-[10px] text-[#667085]">
                Move students currently assigned to {instructor?.name} without losing their history.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#f2f4f7]"><X size={18} /></button>
        </div>

        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={() => setMode("auto")}
            className={`rounded-[13px] border p-4 text-left transition ${mode === "auto" ? "border-[#2675ff] bg-[#f3f8ff] ring-2 ring-blue-100" : "border-[#e3e8ef] bg-white"}`}
          >
            <p className="text-[12px] font-bold text-[#24324a]">Auto distribute evenly</p>
            <p className="mt-1 text-[9px] leading-5 text-[#667085]">Students are assigned across active instructors starting with the lowest current student load.</p>
          </button>

          <button
            type="button"
            onClick={() => setMode("target")}
            className={`rounded-[13px] border p-4 text-left transition ${mode === "target" ? "border-[#2675ff] bg-[#f3f8ff] ring-2 ring-blue-100" : "border-[#e3e8ef] bg-white"}`}
          >
            <p className="text-[12px] font-bold text-[#24324a]">Move everyone to one instructor</p>
            <p className="mt-1 text-[9px] leading-5 text-[#667085]">Use this when another instructor is taking over the complete student group.</p>
          </button>
        </div>

        {mode === "target" && (
          <div className="relative mt-4">
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="h-[46px] w-full appearance-none rounded-[10px] border border-[#dfe5ee] bg-white px-4 pr-10 text-[11px] font-semibold text-[#344054] outline-none focus:border-[#2675ff]"
            >
              <option value="">Select active instructor</option>
              {candidates.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {item.studentsManaged || 0} students
                </option>
              ))}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#667085]" />
          </div>
        )}

        <div className="mt-4 rounded-[12px] bg-[#fff8e7] px-4 py-3 text-[9px] leading-5 text-[#8a5b00]">
          Existing mentor-session history and completed project reviews stay unchanged. Future sessions and pending projects are moved to the new instructor.
        </div>
        {error && <p className="mt-3 text-[10px] font-medium text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="h-[42px] rounded-[10px] border border-[#dfe5ee] bg-white px-5 text-[11px] font-semibold text-[#344054]">Cancel</button>
          <button disabled={saving || candidatesLoading || (mode === "target" && !target)} onClick={submit} className="h-[42px] rounded-[10px] bg-[#1769f5] px-5 text-[11px] font-semibold text-white disabled:opacity-50">
            {saving ? "Reassigning..." : candidatesLoading ? "Loading..." : "Reassign Students"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectReviewModal({ project, onClose, onDone }) {
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
      setError(err.response?.data?.message || "Could not save project review.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] grid place-items-center bg-[#0f172a]/45 p-4 backdrop-blur-[2px]">
      <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto w-full max-w-[620px] rounded-[20px] border border-[#e2e8f0] bg-white p-6 shadow-[0_28px_80px_rgba(15,23,42,.25)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#2675ff]">Project Review</p>
            <h2 className="mt-1 text-[20px] font-bold text-[#101828]">{project.title}</h2>
            <p className="mt-1 text-[10px] text-[#667085]">{project.studentName} · {project.courseTitle}</p>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-[#f2f4f7]"><X size={18} /></button>
        </div>

        {project.submissionUrl ? (
          <a href={project.submissionUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex h-[40px] items-center gap-2 rounded-[10px] border border-[#cfe0ff] bg-[#f4f8ff] px-4 text-[10px] font-semibold text-[#1769f5]">
            <FileCheck2 size={15} /> View / Download Submitted Project
          </a>
        ) : (
          <div className="mt-5 rounded-[10px] bg-[#f8fafc] px-4 py-3 text-[10px] text-[#7b879b]">No submission link was provided.</div>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-[170px_1fr]">
          <div>
            <label className="mb-1.5 block text-[10px] font-bold text-[#344054]">Project Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-[43px] w-full rounded-[10px] border border-[#dfe5ee] bg-white px-3 text-[10px] font-semibold outline-none focus:border-[#2675ff]">
              <option value="approved">Approved</option>
              <option value="rejected">Needs Changes</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-bold text-[#344054]">Instructor Feedback</label>
            <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} rows={4} placeholder="Write review comments for the student..." className="w-full resize-none rounded-[10px] border border-[#dfe5ee] bg-white px-3 py-2.5 text-[10px] outline-none focus:border-[#2675ff]" />
          </div>
        </div>
        {error && <p className="mt-3 text-[10px] text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="h-[42px] rounded-[10px] border border-[#dfe5ee] px-5 text-[11px] font-semibold text-[#344054]">Cancel</button>
          <button onClick={save} disabled={saving} className="inline-flex h-[42px] items-center gap-2 rounded-[10px] bg-[#1769f5] px-5 text-[11px] font-semibold text-white disabled:opacity-50"><Send size={14} /> {saving ? "Saving..." : "Save Review"}</button>
        </div>
      </div>
    </div>
  );
}

export default function InstructorOverview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [allInstructors, setAllInstructors] = useState([]);
  const [error, setError] = useState("");
  const requestedTab = searchParams.get("tab");
  const tab = ["sessions", "projects", "courses"].includes(requestedTab) ? requestedTab : "students";
  const setTab = value => setSearchParams(current => { const next = new URLSearchParams(current); next.set("tab", value); return next; });
  const [search, setSearch] = useState("");
  const [reassignOpen, setReassignOpen] = useState(searchParams.get("reassign") === "1");
  const [reviewProject, setReviewProject] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const requestStamp = Date.now();
      const [detailRes, listRes] = await Promise.all([
        api.get(`/admin/instructors/${id}`, { params: { _t: requestStamp } }),
        api.get("/admin/instructors", { params: { _t: requestStamp } }),
      ]);
      setData(detailRes.data);
      setAllInstructors(listRes.data?.instructors || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load instructor overview.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const profile = data?.profile || {};
  const summary = data?.summary || {};

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = data?.students || [];
    if (!q) return rows;
    return rows.filter((row) =>
      [row.studentName, row.studentEmail, row.courseTitle]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [data, search]);

  const closeReassign = () => {
    setReassignOpen(false);
    if (searchParams.get("reassign")) {
      searchParams.delete("reassign");
      setSearchParams(searchParams, { replace: true });
    }
  };

  const tabs = [
    ["students", "Students", Users],
    ["sessions", "Mentor Sessions", CalendarCheck2],
    ["projects", "Project Submissions", ClipboardCheck],
    ["courses", "Courses", BookOpen],
  ];

  if (loading) return <div className="p-8 text-[12px] text-[#667085]">Loading instructor overview...</div>;

  return (
    <div className="w-full min-w-0 pb-8">
      <button onClick={() => navigate("/admin/instructors")} className="mb-4 inline-flex items-center gap-2 text-[10px] font-semibold text-[#2563eb] hover:underline">
        <ArrowLeft size={14} /> Back to Instructors
      </button>

      {error ? (
        <div className="rounded-[14px] border border-red-200 bg-red-50 p-5 text-[11px] text-red-700">{error}</div>
      ) : (
        <>
          <section className="rounded-[20px] border border-[#e4eaf3] bg-white p-6 shadow-[0_8px_24px_rgba(31,64,110,.04)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="grid h-[66px] w-[66px] shrink-0 place-items-center overflow-hidden rounded-[18px] bg-[#e8f3ff] text-[18px] font-bold text-[#1769f5]">
                  {profile.avatar ? <img src={profile.avatar} alt="" className="h-full w-full object-cover" /> : initials(profile.name)}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="truncate text-[26px] font-bold text-[#101828]">{profile.name}</h1>
                    <Badge tone={profile.status === "active" ? "green" : profile.status === "on-leave" ? "orange" : "red"}>{profile.statusLabel || "Active"}</Badge>
                  </div>
                  <p className="mt-1 text-[10px] text-[#667085]">{profile.email}</p>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[9px] text-[#667085]">
                    {profile.employeeId && <span><b className="text-[#344054]">Employee ID:</b> {profile.employeeId}</span>}
                    <span><b className="text-[#344054]">Role:</b> Instructor</span>
                    {profile.department && <span><b className="text-[#344054]">Department:</b> {profile.department}</span>}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={load} className="inline-flex h-[42px] items-center gap-2 rounded-[10px] border border-[#dfe5ee] bg-white px-4 text-[10px] font-semibold text-[#344054]"><RefreshCw size={14} /> Refresh</button>
                <button onClick={() => setReassignOpen(true)} className="inline-flex h-[42px] items-center gap-2 rounded-[10px] bg-[#1769f5] px-4 text-[10px] font-semibold text-white"><UserRoundCog size={15} /> Reassign Students</button>
              </div>
            </div>
          </section>

          <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Users} label="Assigned Students" value={summary.students || 0} tone="blue" sub="Unique students under this instructor" />
            <StatCard icon={BookOpen} label="Courses Teaching" value={summary.courses || 0} tone="purple" sub="Current course responsibility" />
            <StatCard icon={CalendarCheck2} label="Mentor Sessions Taken" value={summary.sessions || 0} tone="green" sub="Confirmed sessions" />
            <StatCard icon={ClipboardCheck} label="Pending Project Reviews" value={summary.pendingProjects || 0} tone="orange" sub={`${summary.totalProjects || 0} total project submissions`} />
          </section>

          <section className="mt-5 overflow-hidden rounded-[18px] border border-[#e4eaf3] bg-white shadow-[0_8px_24px_rgba(31,64,110,.04)]">
            <div className="flex flex-wrap items-center gap-1 border-b border-[#edf1f6] px-4 pt-3">
              {tabs.map(([key, label, Icon]) => (
                <button key={key} onClick={() => setTab(key)} className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-[10px] font-semibold transition ${tab === key ? "border-[#1769f5] text-[#1769f5]" : "border-transparent text-[#667085] hover:text-[#344054]"}`}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>

            {tab === "students" && (
              <div>
                <div className="border-b border-[#edf1f6] p-4">
                  <div className="relative max-w-[470px]">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a94a8]" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student, email or course..." className="h-[42px] w-full rounded-[10px] border border-[#dfe5ee] pl-10 pr-4 text-[10px] outline-none focus:border-[#2675ff]" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[950px] border-collapse">
                    <thead><tr className="bg-[#f8fbff] text-left text-[9px] font-bold uppercase text-[#61708a]"><th className="px-5 py-3.5">Student</th><th className="px-4 py-3.5">Course</th><th className="px-4 py-3.5 text-center">Mentor Sessions</th><th className="px-4 py-3.5 text-center">Projects Submitted</th><th className="px-4 py-3.5 text-center">Pending Review</th><th className="px-4 py-3.5">Last Activity</th></tr></thead>
                    <tbody>
                      {filteredStudents.map((row) => (
                        <tr key={row.enrollmentId} className="border-t border-[#edf1f6]">
                          <td className="px-5 py-4"><p className="text-[10px] font-bold text-[#253047]">{row.studentName}</p><p className="mt-0.5 text-[8px] text-[#8a94a8]">{row.studentEmail}</p></td>
                          <td className="px-4 py-4 text-[10px] text-[#455168]">{row.courseTitle}</td>
                          <td className="px-4 py-4 text-center"><Badge tone="blue">{row.sessionCount || 0}</Badge></td>
                          <td className="px-4 py-4 text-center text-[10px] font-semibold text-[#344054]">{row.submittedProjects || 0}</td>
                          <td className="px-4 py-4 text-center"><Badge tone={row.pendingReviews > 0 ? "orange" : "green"}>{row.pendingReviews || 0}</Badge></td>
                          <td className="px-4 py-4 text-[9px] text-[#667085]">{formatDate(row.lastActivity, true)}</td>
                        </tr>
                      ))}
                      {!filteredStudents.length && <tr><td colSpan={6} className="px-5 py-10 text-center text-[10px] text-[#8a94a8]">No assigned students found.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === "sessions" && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] border-collapse">
                  <thead><tr className="bg-[#f8fbff] text-left text-[9px] font-bold uppercase text-[#61708a]"><th className="px-5 py-3.5">Student</th><th className="px-4 py-3.5">Course</th><th className="px-4 py-3.5">Session Date</th><th className="px-4 py-3.5">Type</th><th className="px-4 py-3.5">Status</th></tr></thead>
                  <tbody>
                    {(data?.sessions || []).map((row) => (
                      <tr key={row.id} className="border-t border-[#edf1f6]"><td className="px-5 py-4"><p className="text-[10px] font-bold text-[#253047]">{row.studentName}</p><p className="text-[8px] text-[#8a94a8]">{row.studentEmail}</p></td><td className="px-4 py-4 text-[10px] text-[#455168]">{row.courseTitle}</td><td className="px-4 py-4 text-[9px] text-[#667085]">{formatDate(row.date, true)}</td><td className="px-4 py-4 text-[9px] text-[#667085]">{row.type}</td><td className="px-4 py-4"><Badge tone={row.status === "confirmed" ? "green" : row.status === "pending" ? "orange" : "gray"}>{row.status}</Badge><MentorSessionApproval session={row} onUpdated={load} /></td></tr>
                    ))}
                    {!(data?.sessions || []).length && <tr><td colSpan={5} className="px-5 py-10 text-center text-[10px] text-[#8a94a8]">No mentor sessions found.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "projects" && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] border-collapse">
                  <thead><tr className="bg-[#f8fbff] text-left text-[9px] font-bold uppercase text-[#61708a]"><th className="px-5 py-3.5">Student</th><th className="px-4 py-3.5">Course</th><th className="px-4 py-3.5">Project</th><th className="px-4 py-3.5">Submitted</th><th className="px-4 py-3.5">Status</th><th className="px-5 py-3.5 text-right">Action</th></tr></thead>
                  <tbody>
                    {(data?.projects || []).map((row) => (
                      <tr key={row.id} className="border-t border-[#edf1f6]"><td className="px-5 py-4"><p className="text-[10px] font-bold text-[#253047]">{row.studentName}</p><p className="text-[8px] text-[#8a94a8]">{row.studentEmail}</p></td><td className="px-4 py-4 text-[10px] text-[#455168]">{row.courseTitle}</td><td className="px-4 py-4 text-[10px] font-semibold text-[#344054]">{row.title}</td><td className="px-4 py-4 text-[9px] text-[#667085]">{formatDate(row.submittedAt, true)}</td><td className="px-4 py-4"><Badge tone={row.status === "submitted" ? "orange" : row.status === "approved" ? "green" : "red"}>{row.status === "submitted" ? "Pending Review" : row.status}</Badge></td><td className="px-5 py-4 text-right"><button onClick={() => setReviewProject(row)} className="h-[34px] rounded-[9px] border border-[#d5e3ff] bg-[#f4f8ff] px-3 text-[9px] font-semibold text-[#1769f5]">{row.status === "submitted" ? "Review" : "View / Update"}</button></td></tr>
                    ))}
                    {!(data?.projects || []).length && <tr><td colSpan={6} className="px-5 py-10 text-center text-[10px] text-[#8a94a8]">No project submissions found.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}

            {tab === "courses" && (
              <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
                {(data?.courses || []).map((course) => (
                  <article key={course.id} className="rounded-[14px] border border-[#e6ebf2] bg-[#fbfdff] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold text-[#253047]">{course.title}</p><p className="mt-1 text-[8px] text-[#8a94a8]">{course.category || "Course"} · {course.level || "General"}</p></div><Badge tone={course.isPublished ? "green" : "gray"}>{course.isPublished ? "Published" : "Draft"}</Badge></div><div className="mt-4 flex gap-4 text-[9px] text-[#667085]"><span>{course.students || 0} students</span><span>{course.projects || 0} projects</span></div></article>
                ))}
                {!(data?.courses || []).length && <p className="text-[10px] text-[#8a94a8]">No courses assigned.</p>}
              </div>
            )}
          </section>
        </>
      )}

      <ReassignModal open={reassignOpen} onClose={closeReassign} instructor={{ ...profile, id }} instructors={allInstructors} onDone={load} />
      <ProjectReviewModal project={reviewProject} onClose={() => setReviewProject(null)} onDone={load} />
    </div>
  );
}
