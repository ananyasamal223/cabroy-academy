import React, { useCallback, useEffect, useState } from "react";
import api from "../api/client";
import {
  Users,
  CalendarDays,
  Video,
  ExternalLink,
  HelpCircle,
  Trophy,
  Clock3,
  ArrowRight,
  CheckCircle2,
  Megaphone,
} from "lucide-react";

/* =========================================================
   DATA
========================================================= */

const sessionDateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata",
});
const sessionTimeFormat = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata",
});

const communityFeatures = [
  {
    icon: HelpCircle,
    title: "Ask Questions",
    description:
      "Get help with modules, assignments, tools and course concepts.",
  },
  {
    icon: Users,
    title: "Connect with Learners",
    description:
      "Interact with students learning Digital Marketing, Analytics and AI.",
  },
  {
    icon: Video,
    title: "Live Sessions",
    description:
      "Attend mentor discussions, project reviews and community sessions.",
  },
  {
    icon: Trophy,
    title: "Share Your Work",
    description:
      "Share projects, achievements and get feedback from the community.",
  },
];

function DiscordIcon({ size = 20, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M19.54 5.34A16.3 16.3 0 0 0 15.45 4l-.5 1.02a15.2 15.2 0 0 0-5.9 0L8.55 4a16.5 16.5 0 0 0-4.1 1.34C1.86 9.2 1.16 12.96 1.5 16.66a16.8 16.8 0 0 0 5.03 2.57l1.22-1.67a10.5 10.5 0 0 1-1.93-.93l.47-.36c3.73 1.73 7.77 1.73 11.46 0l.47.36c-.62.36-1.27.67-1.94.93l1.22 1.67a16.8 16.8 0 0 0 5.03-2.57c.4-4.3-.69-8.02-2.95-11.32ZM8.52 14.42c-1.12 0-2.03-1.04-2.03-2.32 0-1.28.9-2.32 2.03-2.32s2.05 1.05 2.03 2.32c0 1.28-.9 2.32-2.03 2.32Zm6.96 0c-1.12 0-2.03-1.04-2.03-2.32 0-1.28.9-2.32 2.03-2.32s2.05 1.05 2.03 2.32c0 1.28-.9 2.32-2.03 2.32Z" />
    </svg>
  );
}

export default function Community() {
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState("");
  const [showAllSessions, setShowAllSessions] = useState(false);

  const loadSessions = useCallback(async (signal) => {
    setSessionsLoading(true);
    setSessionsError("");
    try {
      const { data } = await api.get("/mentor-sessions/me", { signal });
      if (signal?.aborted) return;
      const now = Date.now();
      setSessions((Array.isArray(data.sessions) ? data.sessions : [])
        .filter((session) => ["pending", "confirmed"].includes(session.status)
          && new Date(session.date).getTime() >= now)
        .sort((a, b) => new Date(a.date) - new Date(b.date)));
    } catch (error) {
      if (signal?.aborted) return;
      setSessions([]);
      setSessionsError(error.response?.data?.message || "We could not load your upcoming sessions. Please try again.");
    } finally {
      if (!signal?.aborted) setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadSessions(controller.signal);
    const refresh = () => {
      if (document.visibilityState === "visible") loadSessions(controller.signal);
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      controller.abort();
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [loadSessions]);

  const upcomingSessions = showAllSessions ? sessions : sessions.slice(0, 3);
  const discordInvite = "https://discord.gg/YOUR_INVITE";

  const openDiscord = () => {
    window.open(discordInvite, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-[#f7fbff]">
      <main className="w-full px-5 pb-10 pt-5 md:px-7 md:pt-6">

        {/* PAGE HEADING */}
        <section className="mb-4">
          <h1 className="text-[31px] font-bold tracking-[-0.6px] text-[#101936]">
            Community
          </h1>
          <p className="mt-1 text-[13px] text-[#718099]">
            Connect with fellow learners, mentors and the Rathi Academy community.
          </p>
        </section>

        {/* =====================================================
            HERO
            Uses the exact reference image so the background,
            waves, labels, icon scale and spacing match exactly.
        ===================================================== */}
        <section className="relative w-full overflow-hidden rounded-[18px]">
          <img
            src="/community-hero-full.png"
            alt="Join the Rathi Academy Discord Community"
            className="block h-auto w-full select-none"
            draggable="false"
          />

          {/* Clickable overlay exactly over the CTA shown in the hero image.
              Keeps the hero visually exact while preserving button functionality. */}
          <button
            type="button"
            onClick={openDiscord}
            aria-label="Join Discord Community"
            title="Join Discord Community"
            className="
              absolute
              left-[4.9%]
              top-[64.1%]
              h-[13.7%]
              w-[28.1%]
              cursor-pointer
              rounded-[12px]
              bg-transparent
              outline-none
              focus-visible:ring-2
              focus-visible:ring-[#0878e8]
              focus-visible:ring-offset-2
            "
          />
        </section>

        {/* WHAT YOU CAN DO */}
        <section className="mt-5">
          <div className="mb-4">
            <h2 className="text-[22px] font-bold text-[#111b35]">
              What you can do in the community
            </h2>
            <p className="mt-1 text-[12px] text-[#75839a]">
              Learn together and get support throughout your course journey.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {communityFeatures.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="min-h-[168px] rounded-[15px] border border-[#e3eaf4] bg-white p-5 shadow-[0_4px_14px_rgba(35,70,120,.03)]"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-[11px] bg-[#eef6ff] text-[#0878e8]">
                    <Icon size={20} />
                  </div>

                  <h3 className="mt-4 text-[15px] font-bold text-[#111b35]">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-[11px] leading-5 text-[#6f7e96]">
                    {item.description}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        {/* LOWER AREA */}
        <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_350px]">

          {/* UPCOMING COMMUNITY SESSIONS */}
          <div className="rounded-[15px] border border-[#e3eaf4] bg-white p-5 shadow-[0_4px_16px_rgba(35,70,120,.03)]">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-[20px] font-bold text-[#111b35]">
                  Upcoming Community Sessions
                </h2>

                <p className="mt-1 text-[11px] text-[#75839a]">
                  Your upcoming mentor sessions. All times are in IST.
                </p>
              </div>

              {sessions.length > 3 && <button type="button" onClick={() => setShowAllSessions((value) => !value)} aria-expanded={showAllSessions} className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0878e8]">
                {showAllSessions ? "Show Less" : "View All"}
                <ArrowRight size={14} />
              </button>}
            </div>

            <div className="space-y-3" aria-live="polite" aria-busy={sessionsLoading}>
              {sessionsLoading ? <p className="py-6 text-sm text-[#65738a]">Loading your upcoming sessions...</p>
                : sessionsError ? <div role="alert" className="py-6 text-sm text-red-700">
                    <p>{sessionsError}</p>
                    <button type="button" onClick={() => loadSessions()} className="mt-3 font-semibold text-[#0878e8]">Try Again</button>
                  </div>
                : sessions.length === 0 ? <p className="py-6 text-sm text-[#65738a]">You have no upcoming sessions scheduled.</p>
                : upcomingSessions.map((session, index) => (
                <div
                  key={session._id}
                  className="grid gap-3 rounded-[12px] border border-[#e9eef5] px-4 py-3.5 md:grid-cols-[minmax(0,1fr)_120px_100px_38px] md:items-center"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-[10px] ${
                        index === 0
                          ? "bg-[#eef6ff] text-[#0878e8]"
                          : index === 1
                          ? "bg-[#eafaf4] text-[#18a36f]"
                          : "bg-[#f2edff] text-[#7c3aed]"
                      }`}
                    >
                      {index === 1 ? (
                        <CheckCircle2 size={18} />
                      ) : index === 2 ? (
                        <Users size={18} />
                      ) : (
                        <Video size={18} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-[12px] font-bold text-[#111b35]">
                        {session.course?.title || "Subscription Mentor Session"}
                      </h3>

                      <p className="mt-1 text-[10px] text-[#7a879a]">
                        {session.type} · {session.status === "confirmed" ? "Confirmed" : "Awaiting confirmation"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <CalendarDays size={16} className="shrink-0 text-[#0878e8]" />
                    <div>
                      <p className="text-[8px] text-[#98a2b3]">Date</p>
                      <p className="mt-0.5 text-[10px] font-semibold text-[#445169]">
                        {sessionDateFormat.format(new Date(session.date))}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock3 size={16} className="shrink-0 text-[#0878e8]" />
                    <div>
                      <p className="text-[8px] text-[#98a2b3]">Time</p>
                      <p className="mt-0.5 text-[10px] font-semibold text-[#445169]">
                        {sessionTimeFormat.format(new Date(session.date))}
                      </p>
                    </div>
                  </div>

                  <span title={session.status === "confirmed" ? "Session confirmed" : "Awaiting mentor confirmation"} className="grid h-9 w-9 place-items-center rounded-full bg-[#eef6ff] text-[#0878e8]">
                    {session.status === "confirmed" ? <CheckCircle2 size={18} /> : <Clock3 size={18} />}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <aside className="space-y-4">

            {/* COMMUNITY GUIDELINES */}
            <section className="rounded-[15px] border border-[#e3eaf4] bg-white p-5 shadow-[0_4px_16px_rgba(35,70,120,.03)]">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-[9px] bg-[#eef6ff] text-[#0878e8]">
                  <Megaphone size={18} />
                </div>

                <h3 className="text-[16px] font-bold text-[#111b35]">
                  Community Guidelines
                </h3>
              </div>

              <div className="mt-3 space-y-2">
                <Guideline text="Be respectful to other learners" />
                <Guideline text="Ask course-related questions freely" />
                <Guideline text="Share useful resources and ideas" />
                <Guideline text="Do not share paid course content" />
                <Guideline text="Keep discussions relevant and constructive" />
              </div>
            </section>

            {/* NEED HELP */}
            <section className="relative min-h-[155px] overflow-hidden rounded-[15px] bg-gradient-to-br from-[#1f3d8f] via-[#21449d] to-[#365bc0] p-4 text-white shadow-[0_6px_18px_rgba(31,61,143,.16)]">
              <div className="relative z-10 max-w-[230px]">
                <Users size={21} />

                <h3 className="mt-3 text-[16px] font-bold">
                  Need help?
                </h3>

                <p className="mt-1.5 text-[9px] leading-4 text-blue-100">
                  Join Discord and post your question in your course channel.
                  Mentors and other learners can help you.
                </p>

                <button
                  onClick={openDiscord}
                  className="mt-3 inline-flex h-8 items-center gap-2 rounded-[8px] bg-white px-3.5 text-[9px] font-semibold text-[#2451b8]"
                >
                  <DiscordIcon size={14} />
                  Open Discord
                  <ExternalLink size={12} />
                </button>
              </div>

              <div className="pointer-events-none absolute -bottom-9 -right-7 h-[120px] w-[120px] rounded-full bg-white/8" />

              <DiscordIcon
                size={62}
                className="pointer-events-none absolute bottom-4 right-5 text-white/15"
              />
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
}

function Guideline({ text }) {
  return (
    <div className="flex items-start gap-2.5">
      <CheckCircle2
        size={14}
        className="mt-[1px] shrink-0 text-emerald-500"
      />

      <p className="text-[10px] leading-4 text-[#65738a]">
        {text}
      </p>
    </div>
  );
}
