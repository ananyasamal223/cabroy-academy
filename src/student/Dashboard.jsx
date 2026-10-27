import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import {
  BookOpen,
  FolderKanban,
  CalendarDays,
  Clock3,
  ChevronRight,
  Layers,
  Video,
  FileText,
  CheckCircle2,
  Headphones,
  MessageCircle,
} from "lucide-react";
import MonthCalendarModal from "../components/MonthCalendarModal";

function isSameDayLocal(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// DEMO MODE — shows the mentor-session booking flow with fake course data
// so it can be demoed without real enrollments. Flip to false once you're
// ready to use real enrollment data from the backend.
const MENTOR_SESSIONS_DEMO_MODE = false;

const DEMO_COURSES = [
  { courseId: "demo-digital-marketing", courseTitle: "Digital Marketing Mastery", limit: 5, used: 2, remaining: 3 },
  { courseId: "demo-data-analytics", courseTitle: "Data Analytics Mastery", limit: 5, used: 4, remaining: 1 },
];

const learningCards = [
  {
    label: "Current Course",
    value: "Digital Marketing Mastery",
    icon: BookOpen,
    bg: "bg-[#eef4ff]",
    color: "text-[#2563eb]",
  },
  {
    label: "Courses in Progress",
    value: "2",
    icon: Layers,
    bg: "bg-[#eafaf4]",
    color: "text-[#16a674]",
  },
  {
    label: "Mentor Sessions Attended",
    value: "6",
    icon: Video,
    bg: "bg-[#fff0f1]",
    color: "text-[#e7606c]",
  },
  {
    label: "Projects",
    value: "1 Active",
    icon: FolderKanban,
    bg: "bg-[#f1efff]",
    color: "text-[#7256d8]",
  },
];

const progressRows = [
  {
    course: "Digital Marketing Mastery",
    module: "Google Ads",
    progress: 70,
    assignment: "Submitted",
    status: "In Progress",
  },
  {
    course: "Data Analytics Mastery",
    module: "SQL",
    progress: 50,
    assignment: "Pending",
    status: "In Progress",
  },
  {
    course: "AI Automation Mastery",
    module: "Completed",
    progress: 100,
    assignment: "Completed",
    status: "Completed",
  },
];

const deadlines = [
  {
    title: "Assignment",
    subtitle: "Google Ads",
    date: "5 Sep",
  },
  {
    title: "Project",
    subtitle: "SEO Campaign",
    date: "10 Sep",
  },
  {
    title: "Mentor Session",
    subtitle: "Digital Marketing",
    date: "12 Sep",
  },
];

const FALLBACK_COURSE_IMAGE = "/digital-marketing-course.jpg";


export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [mentorSessions, setMentorSessions] = useState([]);
  const [courseEnrollments, setCourseEnrollments] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
  const firstName = user?.name?.split(" ")[0] || "there";

  const loadMentorSessions = async () => {
    if (MENTOR_SESSIONS_DEMO_MODE) return; // demo bookings live only in local state
    try {
      const { data } = await api.get("/mentor-sessions/me");
      setMentorSessions((data.sessions || []).filter((session) => new Date(session.date) >= new Date()).sort((a, b) => new Date(a.date) - new Date(b.date)));
    } catch {
      // leave the list empty rather than blocking the whole dashboard
    }
  };

  useEffect(() => {
    loadMentorSessions();
    const refresh = () => { if (document.visibilityState === "visible") loadMentorSessions(); };
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPurchasedCourses() {
      setCoursesLoading(true);
      try {
        const { data } = await api.get("/enrollments/me");
        if (cancelled) return;

        const purchased = (data.enrollments || []).filter(
          (item) => item.course && item.status !== "cancelled"
        );
        setCourseEnrollments(purchased);
      } catch {
        if (!cancelled) setCourseEnrollments([]);
      } finally {
        if (!cancelled) setCoursesLoading(false);
      }
    }

    loadPurchasedCourses();
    return () => {
      cancelled = true;
    };
  }, []);

  const [availability, setAvailability] = useState(
    MENTOR_SESSIONS_DEMO_MODE ? DEMO_COURSES : []
  );
  const [calendarInitialDate, setCalendarInitialDate] = useState(null);

  const loadAvailability = async () => {
    if (MENTOR_SESSIONS_DEMO_MODE) return; // dummy data is already in state
    try {
      const { data } = await api.get("/mentor-sessions/availability");
      setAvailability(data.availability || []);
    } catch {
      // leave empty — modal shows "enroll in a course" state either way
    }
  };

  useEffect(() => {
    loadAvailability();
  }, []);

  const handleBookSession = async (date, courseId) => {
    if (MENTOR_SESSIONS_DEMO_MODE) {
      // Simulate a network delay, then fake-add the booking locally and
      // decrement that course's remaining count - no backend call at all.
      await new Promise((resolve) => setTimeout(resolve, 500));
      const course = DEMO_COURSES.find((c) => c.courseId === courseId);
      setMentorSessions((prev) => [
        ...prev,
        {
          _id: `demo-${Date.now()}`,
          type: "Live Doubt Session",
          date: date.toISOString(),
          status: "pending",
          course: { title: course?.courseTitle },
        },
      ]);
      setAvailability((prev) =>
        prev.map((c) =>
          c.courseId === courseId
            ? { ...c, used: c.used + 1, remaining: Math.max(0, c.remaining - 1) }
            : c
        )
      );
      return;
    }

    try {
      await api.post("/mentor-sessions", { date: date.toISOString(), courseId });
      await Promise.all([loadMentorSessions(), loadAvailability()]); // refresh list + remaining count
    } catch (err) {
      throw err; // let the modal show the error and keep its own dialog open
    }
  };

  const openCalendar = (date = null) => {
    setCalendarInitialDate(date);
    setShowCalendarModal(true);
  };

  const busyDates = mentorSessions.map((s) => new Date(s.date).toISOString().slice(0, 10));

  // Current week (Mon-Sun) for the quick-pick strip.
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const currentWeek = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  const todayForStrip = new Date();
  todayForStrip.setHours(0, 0, 0, 0);

  return (
    <div className="min-h-screen bg-[#f7fbff]">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-4 md:px-5 md:py-5">

        {/* Independent left/right columns prevent the large blank gap above Your Courses */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_395px]">

          {/* =========================================================
              LEFT COLUMN
          ========================================================= */}
          <main className="min-w-0 space-y-4">

            {/* HERO */}
            <section className="relative min-h-[205px] overflow-hidden rounded-[15px] bg-gradient-to-r from-[#0868e8] via-[#0877ee] to-[#20a7f4] px-7 py-7 text-white shadow-[0_8px_24px_rgba(25,115,220,.10)] md:px-8">
              <div className="relative z-10">
                <h1 className="text-[31px] font-bold tracking-[-0.8px] md:text-[36px]">
                  {greeting}, {firstName}
                </h1>

                <p className="mt-2.5 text-[13px] leading-6 text-white/90 md:text-[14px]">
                  You have 3 lessons remaining in your current module. Keep going!
                </p>

                <button className="mt-5 inline-flex h-[46px] items-center gap-2 rounded-[10px] bg-white px-6 text-[13px] font-semibold text-[#0878e8] shadow-[0_4px_12px_rgba(0,0,0,.08)] transition hover:-translate-y-[1px]">
                  Continue Learning
                  <ChevronRight size={17} />
                </button>
              </div>

              <div className="absolute -right-20 -top-28 h-[300px] w-[300px] rounded-full bg-white/[.035]" />
              <div className="absolute -bottom-28 right-[18%] h-[250px] w-[250px] rounded-full bg-white/[.035]" />
            </section>

            {/* MY LEARNING */}
            <section>
              <div className="mb-3 flex items-end justify-between px-1">
                <div>
                  <h2 className="text-[22px] font-bold text-[#111b35]">
                    My Learning
                  </h2>
                  <p className="mt-1 text-[11px] text-[#74819a]">
                    Your current learning activity at a glance.
                  </p>
                </div>

                <button className="text-[11px] font-semibold text-[#0878e8]">
                  View All
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {learningCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <div
                      key={card.label}
                      className="min-h-[152px] rounded-[14px] border border-[#e5ebf4] bg-white p-5 shadow-[0_4px_16px_rgba(35,70,120,.03)]"
                    >
                      <div className={`grid h-10 w-10 place-items-center rounded-[10px] ${card.bg}`}>
                        <Icon size={19} className={card.color} />
                      </div>

                      <p className="mt-4 text-[10px] font-medium text-[#73809a]">
                        {card.label}
                      </p>

                      <p className="mt-2 line-clamp-2 text-[17px] font-bold leading-[1.25] text-[#14203a]">
                        {card.value}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* YOUR COURSES — directly under My Learning, matching reference */}
            <section className="pt-0">
              <div className="mb-2.5 flex items-end justify-between px-1">
                <div>
                  <h2 className="text-[22px] font-bold text-[#111b35]">
                    Your Courses
                  </h2>

                  <p className="mt-1 text-[11px] text-[#74819a]">
                    Access your purchased courses, download resources and track important details.
                  </p>
                </div>

                <button className="inline-flex h-[38px] items-center gap-2 rounded-[9px] border border-[#dce7f4] bg-white px-4 text-[11px] font-semibold text-[#1d67bc] shadow-[0_2px_8px_rgba(35,70,120,.025)]">
                  All Courses
                  <ChevronRight size={14} className="rotate-90" />
                </button>
              </div>

              <div className="space-y-2.5">
                {coursesLoading ? (
                  <div className="rounded-[13px] border border-[#e5ebf4] bg-white p-6 text-center text-[12px] text-[#75839a]">
                    Loading your purchased courses...
                  </div>
                ) : courseEnrollments.length === 0 ? (
                  <div className="rounded-[13px] border border-dashed border-[#d7e2ef] bg-white p-6 text-center">
                    <p className="text-[13px] font-semibold text-[#1b2942]">No purchased courses yet</p>
                    <p className="mt-1 text-[11px] text-[#75839a]">
                      Your purchased courses will appear here automatically.
                    </p>
                  </div>
                ) : (
                  courseEnrollments.map((enrollment) => {
                    const course = enrollment.course;
                    const assignedInstructor = enrollment.mentor;
                    const moduleCount = Array.isArray(course.modules) ? course.modules.length : 0;

                    return (
                      <article
                        key={enrollment._id}
                        className="grid gap-4 rounded-[13px] border border-[#e5ebf4] bg-white p-3.5 shadow-[0_4px_14px_rgba(35,70,120,.025)] md:grid-cols-[175px_minmax(0,1fr)_155px] md:items-center"
                      >
                        <img
                          src={course.thumbnail || FALLBACK_COURSE_IMAGE}
                          alt={course.title}
                          className="h-[96px] w-full rounded-[9px] object-cover md:w-[175px]"
                        />

                        <div className="min-w-0">
                          <h3 className="text-[16px] font-bold text-[#111b35]">
                            {course.title}
                          </h3>

                          <p className="mt-1 max-w-[520px] text-[11px] leading-5 text-[#65738b]">
                            {course.shortDescription || course.description || "Open the course to view details and learning resources."}
                          </p>

                          <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] text-[#52709a]">
                            <span className="inline-flex items-center gap-1.5">
                              <FolderKanban size={15} className="text-[#0878e8]" />
                              {moduleCount ? `${moduleCount} Modules` : "Course Materials"}
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                              <FileText size={15} className="text-[#52709a]" />
                              {assignedInstructor
                                ? `Instructor: ${assignedInstructor.name}`
                                : "Instructor assignment pending"}
                            </span>

                            <span className="inline-flex items-center gap-1.5 font-semibold text-[#15a968]">
                              <CheckCircle2 size={15} />
                              {enrollment.status === "completed" ? "Completed" : "Active"}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => navigate(`/course-journey/${course._id}`)}
                          className="inline-flex h-[42px] items-center justify-center gap-2 rounded-[9px] bg-[#0b7cf0] px-4 text-[11px] font-semibold text-white shadow-[0_4px_10px_rgba(11,124,240,.15)] transition hover:bg-[#066ed4]"
                        >
                          Open Course
                          <ChevronRight size={15} />
                        </button>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          </main>

          {/* =========================================================
              RIGHT COLUMN
          ========================================================= */}
          <aside className="min-w-0 space-y-3.5">

            {/* UPCOMING MENTOR SESSIONS — matched to reference */}
            <section className="overflow-hidden rounded-[16px] border border-[#e3eaf4] bg-white shadow-[0_4px_14px_rgba(35,70,120,.03)]">
              {/* Title */}
              <div className="px-5 pt-5">
                <h3 className="text-[18px] font-bold tracking-[-0.2px] text-[#111b35]">
                  Upcoming Mentor Sessions
                </h3>

                {/* Date strip */}
                <div className="mt-4 grid grid-cols-7 items-center gap-1">
                  {currentWeek.map((day) => {
                    const isPast = day < todayForStrip;
                    const isToday = isSameDayLocal(day, todayForStrip);

                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        disabled={isPast}
                        onClick={() => openCalendar(day)}
                        title={day.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })}
                        className={`grid h-[48px] place-items-center rounded-[10px] text-[13px] font-semibold transition ${isPast
                            ? "cursor-not-allowed text-[#c5ccd8]"
                            : isToday
                              ? "bg-[#0b7cf0] text-white shadow-[0_4px_10px_rgba(11,124,240,.18)]"
                              : "text-[#17223c] hover:bg-[#eef6ff] hover:text-[#0878e8]"
                          }`}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Session row */}
              <div className="mt-3 border-t border-[#e9eef5]">
                {mentorSessions.length > 0 ? (
                  <div>
                    {mentorSessions.map((session) => (
                      <button
                        key={session._id}
                        type="button"
                        onClick={() => openCalendar(new Date(session.date))}
                        className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-[#fbfdff]"
                      >
                        <div className="grid h-[54px] w-[54px] shrink-0 place-items-center rounded-[12px] bg-[#edf6ff] text-[#0878e8]">
                          <Video size={22} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[15px] font-bold text-[#17223c]">
                            {session.type || "Live Doubt Session"}
                          </p>

                          <p className="mt-1 text-[12px] text-[#70809a]">
                            {new Date(session.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              timeZone: "Asia/Kolkata",
                            })}{" "}
                            {new Date(session.date).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })} IST{" "}
                            <span className="text-[#9aa5b5]">•</span>{" "}
                            <span
                              className={
                                session.status === "confirmed"
                                  ? "font-semibold text-[#19a66f]"
                                  : session.status === "cancelled"
                                    ? "font-semibold text-[#e7606c]"
                                    : "font-semibold text-[#d49422]"
                              }
                            >
                              {session.status === "confirmed" ? "Approved" : "Awaiting approval"}
                            </span>
                          </p>
                        </div>

                        <ChevronRight size={21} className="shrink-0 text-[#31598d]" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div className="grid h-[54px] w-[54px] shrink-0 place-items-center rounded-[12px] bg-[#edf6ff] text-[#0878e8]">
                      <Video size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-bold text-[#17223c]">
                        Live Doubt Session
                      </p>
                      <p className="mt-1 text-[12px] text-[#70809a]">
                        No session booked yet
                      </p>
                    </div>
                    <ChevronRight size={21} className="text-[#31598d]" />
                  </div>
                )}
              </div>

              {/* Book button */}
              <div className="px-5 pb-5 pt-1">
                <button
                  type="button"
                  onClick={() => openCalendar()}
                  className="flex h-[50px] w-full items-center justify-center gap-2.5 rounded-[10px] border border-[#cddded] bg-white text-[13px] font-semibold text-[#0878e8] transition hover:bg-[#f7fbff]"
                >
                  <CalendarDays size={18} />
                  Book a New Session
                </button>
              </div>
            </section>

            {/* UPCOMING DEADLINES */}
            <section className="rounded-[15px] border border-[#e5ebf4] bg-white p-4 shadow-[0_4px_14px_rgba(35,70,120,.03)]">
              <div className="flex items-center justify-between">
                <h3 className="text-[16px] font-bold text-[#111b35]">
                  Upcoming Deadlines
                </h3>

                <button className="text-[11px] font-semibold text-[#0878e8]">
                  View All
                </button>
              </div>

              <div className="mt-2">
                {deadlines.map((item) => (
                  <div key={item.title} className="flex items-center gap-3 py-2.5">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#ff4059]">
                      <Clock3 size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-[#27334b]">
                        {item.title}
                      </p>
                      <p className="mt-0.5 truncate text-[9px] text-[#78859c]">
                        {item.subtitle}
                      </p>
                    </div>

                    <span className="text-[9px] font-medium text-[#657087]">
                      {item.date}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* NEED HELP — compact reference-style card */}
            <section className="relative min-h-[185px] overflow-hidden rounded-[15px] border border-[#d2e7fb] bg-gradient-to-br from-[#edf7ff] via-[#e5f3ff] to-[#d8edff] p-4 shadow-[0_4px_14px_rgba(35,70,120,.025)]">
              <div className="relative z-10 max-w-[250px]">
                <div className="flex items-center gap-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center text-[#0c2f73]">
                    <Headphones size={22} />
                  </div>

                  <h3 className="text-[18px] font-bold text-[#111b35]">
                    Need Help?
                  </h3>
                </div>

                <p className="mt-2.5 pl-[48px] text-[11px] leading-5 text-[#58708f]">
                  Have a question? Join our Discord community or reach out to our mentors.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      "https://discord.gg/YOUR_INVITE",
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                  className="ml-[48px] mt-3.5 inline-flex h-[42px] items-center gap-2 rounded-[9px] bg-white px-5 text-[11px] font-semibold text-[#0878e8] shadow-[0_3px_9px_rgba(35,70,120,.06)]"
                >
                  Open Discord
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="pointer-events-none absolute bottom-4 right-4 h-[86px] w-[108px]">
                <div className="absolute right-0 top-0 grid h-[54px] w-[66px] place-items-center rounded-[16px] bg-[#73b2f8] text-[#0a3c83] shadow-sm">
                  <MessageCircle size={24} />
                </div>

                <div className="absolute bottom-0 left-0 grid h-[50px] w-[60px] place-items-center rounded-[15px] bg-[#4a9af0] text-white shadow-sm">
                  <MessageCircle size={21} />
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
      <MonthCalendarModal
        open={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        onBookSession={handleBookSession}
        busyDates={busyDates}
        courses={availability}
        initialDate={calendarInitialDate}
      />
    </div>
  );
}
