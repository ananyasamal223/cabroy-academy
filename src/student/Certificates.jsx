import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { courseThumbnail } from "../utils/courseThumbnail";
import {
  Award,
  Download,
  Eye,
  Clock3,
  ArrowRight,
  Sparkles,
  Trophy,
} from "lucide-react";

export default function Certificates() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [data, setData] = useState({ certificates: [], inProgress: [], summary: { earned: 0, completed: 0, progress: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [selected, setSelected] = useState(null);
  const [downloading, setDownloading] = useState("");
  const [downloadError, setDownloadError] = useState("");
  useEffect(() => {
    let controller;
    const loadCertificates = async () => {
      controller?.abort();
      controller = new AbortController();
      const signal = controller.signal;
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/certificates/me", { signal });
        const records = response.data;
        if (!Array.isArray(records?.certificates) || !Array.isArray(records?.inProgress) || !records?.summary) {
          throw new Error("Invalid certificate response");
        }
        if (!signal.aborted) setData(records);
      } catch (err) {
        if (!signal.aborted) setError(err.response?.data?.message || "Could not load your certificates. Please try again.");
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") loadCertificates();
    };
    loadCertificates();
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      controller?.abort();
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refresh]);
  const date = value => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Not available";
  const earnedCertificates = data.certificates.map(item => ({ id: item._id, course: item.course?.title || "Course unavailable", subtitle: item.user?.name || "", issued: date(item.issuedAt), certificateNo: item.certificateId, status: "Issued", image: courseThumbnail(item.course?.thumbnail, api.defaults.baseURL), raw: item }));
  const progressCertificates = (data.inProgress || []).filter(item => item.course?._id).map(item => ({ id: item.course._id, course: item.course.title, image: courseThumbnail(item.course.thumbnail, api.defaults.baseURL), message: "Your certificate has not been issued yet. Access your course resources below." }));
  const totals = data.summary || { earned: earnedCertificates.length, completed: earnedCertificates.length, progress: progressCertificates.length };
  const showEarned = !loading && !error && (filter === "all" || filter === "earned");
  const showProgress = !loading && !error && (filter === "all" || filter === "progress");
  const downloadCertificate = async certificate => {
    setDownloading(certificate.id);
    setDownloadError("");
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "landscape" });
      pdf.setDrawColor(8, 120, 232); pdf.rect(12, 12, 273, 186);
      pdf.setFontSize(28); pdf.text("Certificate of Completion", 148, 45, { align: "center" });
      pdf.setFontSize(16); pdf.text("Rathi Academy", 148, 65, { align: "center" });
      pdf.setFontSize(14); pdf.text("Awarded to", 148, 90, { align: "center" });
      pdf.setFontSize(22); pdf.text(pdf.splitTextToSize(certificate.subtitle || "Learner", 240), 148, 108, { align: "center" });
      pdf.setFontSize(16); pdf.text(pdf.splitTextToSize(certificate.course, 240), 148, 134, { align: "center" });
      pdf.setFontSize(11); pdf.text("Issued: " + certificate.issued, 148, 165, { align: "center" });
      pdf.text("Certificate ID: " + certificate.certificateNo, 148, 179, { align: "center" });
      pdf.save(String(certificate.certificateNo || "certificate").replace(/[^a-zA-Z0-9_-]/g, "_") + ".pdf");
    } catch { setDownloadError("Could not download the certificate. Please try again."); }
    finally { setDownloading(""); }
  };

  return (
    <div className="min-h-screen bg-[#f7fbff]">
      <main className="w-full px-5 pb-10 pt-5 md:px-7 md:pt-6">

        {/* =====================================================
            PAGE HEADING
        ===================================================== */}
        <section className="mb-4">
          <button type="button" disabled={loading} onClick={() => setRefresh(value => value + 1)} className="float-right rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-600 disabled:opacity-50">{loading ? "Refreshing..." : "Refresh"}</button>
          <h1 className="text-[31px] font-bold tracking-[-0.6px] text-[#101936]">
            Certificates
          </h1>

          <p className="mt-1 text-[13px] text-[#718099]">
            View your issued certificates and courses awaiting certificates.
          </p>
        </section>

        {/* =====================================================
            HERO / ACHIEVEMENT SUMMARY
        ===================================================== */}
        <section className="relative overflow-hidden rounded-[18px] border border-[#d8e8f8] bg-gradient-to-r from-[#eaf5ff] via-[#e1f0ff] to-[#d4eaff] px-7 py-6 shadow-[0_5px_18px_rgba(35,70,120,.035)] md:px-8">
          {/* Background effects */}
          <div className="pointer-events-none absolute -right-16 -top-28 h-[300px] w-[300px] rounded-full bg-white/[.16]" />
          <div className="pointer-events-none absolute bottom-[-120px] left-[36%] h-[280px] w-[330px] rounded-[50%] bg-white/[.12]" />
          <div className="pointer-events-none absolute right-[28%] top-[24px] h-[180px] w-[220px] rounded-[45%] bg-[#c9e5ff]/[.22]" />

          <div className="relative z-10 grid min-h-[150px] grid-cols-1 items-center gap-6 xl:grid-cols-[minmax(0,1fr)_470px]">

            {/* LEFT */}
            <div className="flex items-center gap-8">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <h2 className="text-[30px] font-bold leading-[1.05] tracking-[-0.5px] text-[#101936]">
                    Keep Learning,
                    <br />
                    Keep Achieving
                  </h2>

                  <Trophy
                    size={28}
                    className="mt-1 shrink-0 text-[#f7b500]"
                    fill="#f7b500"
                  />
                </div>

                <p className="mt-3 max-w-[390px] text-[13px] leading-5 text-[#4f6380]">
                  Complete your courses, earn certificates and showcase your skills.
                </p>
              </div>

              {/* simple certificate illustration */}
              <div className="relative hidden h-[120px] w-[190px] shrink-0 md:block">
                <div className="absolute left-6 top-4 h-[88px] w-[125px] rotate-[-3deg] rounded-[13px] bg-white/70 shadow-sm" />
                <div className="absolute left-12 top-2 h-[92px] w-[132px] rotate-[3deg] rounded-[13px] bg-white shadow-[0_8px_20px_rgba(42,106,180,.10)]">
                  <div className="absolute left-5 right-5 top-6 h-[7px] rounded-full bg-[#d7e9ff]" />
                  <div className="absolute left-5 right-10 top-11 h-[6px] rounded-full bg-[#e4effb]" />
                  <div className="absolute left-5 right-14 top-16 h-[6px] rounded-full bg-[#e4effb]" />
                </div>
                <div className="absolute bottom-[10px] right-[8px] grid h-[52px] w-[52px] place-items-center rounded-full bg-[#0878e8] text-white shadow-[0_6px_14px_rgba(8,120,232,.22)]">
                  <Award size={26} />
                </div>
                <Sparkles className="absolute right-0 top-0 text-[#4f9df3]" size={22} />
              </div>
            </div>

            {/* RIGHT SUMMARY CARDS */}
            <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">
              <HeroStat
                icon={Award}
                value={loading || error ? "?" : totals.earned}
                label="Certificates Earned"
                iconBg="bg-[#eef6ff]"
                iconColor="text-[#0878e8]"
              />


              <HeroStat
                icon={Clock3}
                value={loading || error ? "?" : totals.progress}
                label="Awaiting Certificates"
                iconBg="bg-[#eef6ff]"
                iconColor="text-[#0878e8]"
              />
            </div>
          </div>
        </section>

        {/* =====================================================
            FILTER TABS
        ===================================================== */}
        <section className="mt-4">
          <div className="flex flex-wrap gap-3">
            <TabButton
              active={filter === "all"}
              onClick={() => setFilter("all")}
            >
              All Certificates
            </TabButton>

            <TabButton
              active={filter === "earned"}
              onClick={() => setFilter("earned")}
            >
              Earned
            </TabButton>

            <TabButton
              active={filter === "progress"}
              onClick={() => setFilter("progress")}
            >
              Awaiting Certificate
            </TabButton>
          </div>
        </section>

        {/* =====================================================
            EARNED CERTIFICATES
        ===================================================== */}
        {loading && <p role="status" className="mt-5 rounded-xl bg-white p-6 text-sm text-slate-600">Loading your certificates...</p>}
        {error && <div role="alert" className="mt-5 rounded-xl bg-red-50 p-5 text-sm text-red-700">{error}<button className="ml-4 font-semibold underline" onClick={() => { setLoading(true); setError(""); setRefresh(v => v + 1); }}>Retry</button></div>}
        {downloadError && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-5 text-sm text-red-700">{downloadError}</p>}
        {showEarned && (
          <section className="mt-4">
            <div className="mb-3">
              <h2 className="text-[20px] font-bold text-[#111b35]">
                Earned Certificates ({earnedCertificates.length})
              </h2>

              <p className="mt-1 text-[11px] text-[#75839a]">
                Your successfully completed course certificates.
              </p>
            </div>

            <div className="space-y-3">
              {!earnedCertificates.length && <p className="rounded-xl bg-white p-6 text-sm text-slate-600">You have no issued certificates yet.</p>}
              {earnedCertificates.map((certificate) => (
                <article
                  key={certificate.id}
                  className="relative grid gap-4 rounded-[15px] border border-[#e3eaf4] bg-white p-4 shadow-[0_4px_16px_rgba(35,70,120,.03)] md:grid-cols-[220px_minmax(0,1fr)_360px] md:items-center"
                >
                  {/* IMAGE */}
                  {certificate.image ? <img
                    src={certificate.image}
                    alt={certificate.course}
                    className="h-[122px] w-full rounded-[10px] object-cover md:w-[220px]"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/course-thumbnail-unavailable.svg";
                    }}
                  /> : <div className="grid h-[122px] place-items-center rounded-xl bg-blue-50 text-blue-600"><Award size={48}/></div>}

                  {/* DETAILS */}
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[.8px] text-[#0878e8]">
                      Rathi Academy
                    </p>

                    <h3 className="mt-1.5 text-[18px] font-bold text-[#111b35]">
                      {certificate.course}
                    </h3>

                    <p className="mt-1 text-[11px] text-[#64748b]">
                      {certificate.subtitle}
                    </p>

                    <div className="mt-4 grid max-w-[390px] grid-cols-1 min-[400px]:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <p className="text-[9px] text-[#97a2b3]">
                          Issued On
                        </p>
                        <p className="mt-1 text-[11px] font-semibold text-[#34445e]">
                          {certificate.issued}
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] text-[#97a2b3]">
                          Certificate ID
                        </p>
                        <p className="mt-1 text-[11px] font-semibold text-[#34445e]">
                          {certificate.certificateNo}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-2">
                    <button
                      onClick={() =>
                        setSelected(certificate)
                      }
                      className="flex h-[48px] items-center justify-center gap-2 rounded-[9px] border border-[#68aef2] bg-white px-4 text-[11px] font-semibold text-[#0878e8] transition hover:bg-[#f5faff]"
                    >
                      <Eye size={16} />
                      View Certificate
                    </button>

                    <button disabled={downloading === certificate.id} onClick={() => downloadCertificate(certificate)} className="flex h-[48px] items-center justify-center gap-2 rounded-[9px] bg-[#0878e8] px-4 text-[11px] font-semibold text-white transition hover:bg-[#066ed4]">
                      <Download size={16} />
                      {downloading === certificate.id ? "Downloading..." : "Download"}
                    </button>
                  </div>

                  {/* STATUS */}
                  <span className="absolute right-4 top-3 rounded-full bg-[#e9f8ef] px-3 py-1 text-[9px] font-semibold text-[#18a568]">
                    {certificate.status}
                  </span>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* =====================================================
            CERTIFICATES IN PROGRESS
        ===================================================== */}
        {showProgress && (
          <section className="mt-4">
            <div className="mb-3">
              <h2 className="text-[20px] font-bold text-[#111b35]">
                Awaiting Certificates ({progressCertificates.length})
              </h2>

              <p className="mt-1 text-[11px] text-[#75839a]">
                Enrolled courses whose certificates have not been issued yet.
              </p>
            </div>

            <div className="space-y-3">
              {!progressCertificates.length && <p className="rounded-xl bg-white p-6 text-sm text-slate-600">No courses are awaiting a certificate.</p>}
              {progressCertificates.map((item) => (
                <article
                  key={item.id}
                  className="grid gap-4 rounded-[15px] border border-[#e3eaf4] bg-white p-4 shadow-[0_4px_16px_rgba(35,70,120,.03)] md:grid-cols-[170px_minmax(0,1fr)] md:items-center"
                >
                  {/* IMAGE */}
                  {item.image ? <img
                    src={item.image}
                    alt={item.course}
                    className="h-[96px] w-full rounded-[10px] object-cover md:w-[170px]"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/course-thumbnail-unavailable.svg";
                    }}
                  /> : <div className="grid h-[96px] place-items-center rounded-xl bg-blue-50 text-blue-600"><Award size={36}/></div>}

                  {/* DETAILS */}
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-[16px] font-bold text-[#111b35]">
                          {item.course}
                        </h3>

                        <p className="mt-1.5 max-w-[650px] text-[10px] leading-5 text-[#718099]">
                          {item.message}
                        </p>
                      </div>

                    </div>

                    <button
                      onClick={() => navigate(`/course-journey/${item.id}`)}
                      className="mt-3 flex items-center gap-2 text-[10px] font-semibold text-[#0878e8]"
                    >
                      Open Course Resources
                      <ArrowRight size={14} />
                    </button>
                  </div>

                </article>
              ))}
            </div>
          </section>
        )}
        {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5"><section role="dialog" aria-modal="true" aria-labelledby="certificate-title" className="w-full max-w-lg rounded-2xl bg-white p-7"><h2 id="certificate-title" className="text-2xl font-bold">Certificate of Completion</h2><p className="mt-4 text-lg font-semibold">{selected.subtitle}</p><p className="mt-2">{selected.course}</p><p className="mt-4 text-sm text-slate-600">Issued: {selected.issued}</p><p className="mt-2 break-all text-sm text-slate-600">Certificate ID: {selected.certificateNo}</p><div className="mt-6 flex gap-4"><button autoFocus onClick={() => setSelected(null)} className="rounded-lg border px-4 py-2">Close</button><button disabled={downloading === selected.id} onClick={() => downloadCertificate(selected)} className="rounded-lg bg-blue-600 px-4 py-2 text-white">Download PDF</button></div></section></div>}
      </main>
    </div>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function HeroStat({
  icon: Icon,
  value,
  label,
  iconBg,
  iconColor,
}) {
  return (
    <div className="flex min-h-[125px] flex-col items-center justify-center rounded-[14px] border border-white/60 bg-white/85 p-4 text-center shadow-[0_4px_14px_rgba(35,70,120,.04)] backdrop-blur-[2px]">
      <div className={`grid h-10 w-10 place-items-center rounded-[10px] ${iconBg}`}>
        <Icon size={20} className={iconColor} />
      </div>

      <p className="mt-2 text-[22px] font-bold text-[#101936]">
        {value}
      </p>

      <p className="mt-1 text-[9px] text-[#718099]">
        {label}
      </p>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-[42px] min-w-[140px] rounded-full px-6 text-[11px] font-semibold transition ${
        active
          ? "bg-[#0878e8] text-white shadow-[0_5px_14px_rgba(8,120,232,.16)]"
          : "border border-[#dfe7f1] bg-white text-[#41516a] hover:bg-[#f8fbff]"
      }`}
    >
      {children}
    </button>
  );
}
