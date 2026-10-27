import LiveCourseDetails from "./LiveCourseDetails";
﻿import { useState } from "react";
import { lessonTopics } from "../data/courseCurriculum";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Layers3,
  LockKeyhole,
  Megaphone,
  MessageCircle,
  Search,
  SlidersHorizontal,
  Star,
  Users,
  X,
} from "lucide-react";

import { courses } from "../data/courses";


/* ======================================================
   COMBINED PROGRAM DATA
====================================================== */

const combinedTracks = [
  {
    id: "digital-marketing",
    title: "Digital Marketing",
    description:
      "Build strong foundations in SEO, paid marketing, social media, content and performance marketing.",
    icon: Megaphone,
    color: "blue",

    modules: [
      "Digital Marketing Foundations",
      "Understanding Customers & Funnels",
      "SEO Fundamentals",
      "Content & Social Media Marketing",
      "Meta Advertising",
      "Google Ads",
      "Email Marketing",
      "Analytics & Tracking",
      "Performance Marketing",
      "Digital Marketing Capstone",
    ],
  },

  {
    id: "data-analytics",
    title: "Data Analysis",
    description:
      "Learn Excel, SQL, Power BI, Python and business analytics through real datasets and dashboards.",
    icon: BarChart3,
    color: "cyan",

    modules: [
      "Introduction to Data Analytics",
      "Excel for Data Analysis",
      "Data Cleaning",
      "SQL Fundamentals",
      "Advanced SQL",
      "Power BI Fundamentals",
      "Dashboard Building",
      "Python for Analytics",
      "Business Case Studies",
      "Data Analytics Capstone",
    ],
  },

  {
    id: "ai-automation",
    title: "AI Automation",
    description:
      "Build modern AI workflows using APIs, automation tools, LLMs, RAG and AI agents.",
    icon: Bot,
    color: "indigo",

    modules: [
      "AI Automation Foundations",
      "APIs & Webhooks",
      "n8n Fundamentals",
      "Building Automation Workflows",
      "LLM Integration",
      "Prompt Engineering",
      "RAG & Knowledge Workflows",
      "AI Agents",
      "Business Process Automation",
      "AI Automation Capstone",
    ],
  },
];


const acceleratorCourse = {
  id: "career-accelerator",
  category: "Combined Program",
  title: "Digital Career Accelerator",

  description:
    "Build your own learning path by combining Digital Marketing, Data Analysis and AI Automation in one flexible program.",

  rating: 4.9,
  students: 2400,
  duration: "Up to 30 Modules",
  level: "Beginner to Advanced",
  price: 12999,
  originalPrice: 25997,
};


/* ======================================================
   INDIVIDUAL COURSE VIDEO PREVIEWS
====================================================== */

const coursePreviewData = {
  "digital-marketing": {
    thumbnail: "/digital-marketing-thumbnail.jpg",
    currentTime: "18:42",
    totalTime: "42:50",
    progress: "43%",
  },

  "data-analytics": {
    thumbnail: "/data-analytics-thumbnail.jpg",
    currentTime: "14:18",
    totalTime: "38:45",
    progress: "37%",
  },

  "ai-automation": {
    thumbnail: "/ai-automation-thumbnail.jpg",
    currentTime: "21:15",
    totalTime: "45:30",
    progress: "47%",
  },
};


/* ======================================================
   COURSE DETAILS
====================================================== */

export default function CourseDetails() {
  const { courseId } = useParams();

  const isCombined = courseId === "career-accelerator";

  if (!isCombined) return <LiveCourseDetails key={courseId} courseId={courseId} />;
  const course = acceleratorCourse;


  if (!course) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Course not found.
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#f7f9fc]">

      {/* SIMPLE HEADER */}

      <header className="border-b border-slate-200 bg-white">

        <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between px-6">

          <Link
            to="/"
            className="text-[25px] font-extrabold"
          >
            rathi
            <span className="text-blue-600">
              academy
            </span>
          </Link>


          <Link
            to="/courses"
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-blue-600"
          >
            <ArrowLeft size={18} />
            All Courses
          </Link>

        </div>

      </header>


      {/* ==================================================
          HERO
      ================================================== */}

      <section className="bg-gradient-to-r from-[#06152f] via-[#07347a] to-[#0767d6] text-white">

        <div
          className={`mx-auto grid max-w-7xl items-center gap-10 px-6 py-14 ${isCombined
              ? "lg:grid-cols-[1fr_360px]"
              : "lg:grid-cols-[0.92fr_1.08fr]"
            }`}
        >

          <div>

            <p className="text-sm font-bold text-cyan-300">
              {course.category}
            </p>

            <h1 className="mt-3 max-w-4xl text-4xl font-extrabold leading-tight md:text-5xl">
              {course.title}
            </h1>

            <p className="mt-5 max-w-3xl text-[16px] leading-7 text-blue-100">
              {course.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-5 text-sm text-blue-100">

              {course.rating > 0 && <span className="flex items-center gap-2">
                <Star size={17} />
                {course.rating}
              </span>}

              {course.students > 0 && <span className="flex items-center gap-2">
                <Users size={17} />
                {course.students} learners
              </span>}

              <span className="flex items-center gap-2">
                <BookOpen size={17} />
                {course.duration || `${course.modules.length} Modules`}
              </span>

              <span className="flex items-center gap-2">
                <GraduationCap size={17} />
                {course.level}
              </span>

            </div>

          </div>

          {isCombined ? (

            <aside className="rounded-[22px] bg-white p-7 text-slate-950 shadow-2xl">

              <p className="text-sm text-slate-500">
                Full course access
              </p>

              <div className="mt-2 flex items-end gap-3">

                <span className="text-3xl font-extrabold">
                  â‚¹{course.price}
                </span>

                <span className="mb-1 text-sm text-slate-400 line-through">
                  â‚¹{course.originalPrice}
                </span>

              </div>

              <div className="mt-7 space-y-3 text-sm text-slate-600">

                <PurchaseFeature text="Choose your own learning tracks" />
                <PurchaseFeature text="Up to 30 modules" />
                <PurchaseFeature text="Track-wise mentor sessions" />
                <PurchaseFeature text="Real-world assignments" />
                <PurchaseFeature text="Multiple capstone projects" />
                <PurchaseFeature text="Certificate after completion" />

              </div>

              <Link
                to={`/checkout/${course.id}`}
                className="mt-7 block rounded-xl bg-blue-600 py-4 text-center font-bold text-white transition hover:bg-blue-700"
              >
                Buy Now
              </Link>

            </aside>

          ) : coursePreviewData[course.id] ? (

            <CourseVideoPreview
              course={course}
              preview={coursePreviewData[course.id]}
            />

          ) : (
            <CoursePurchaseCard key={course.id} course={course} />
          )}

        </div>

      </section>


      {/* ==================================================
          COMBINED COURSE
      ================================================== */}

      {isCombined ? (
        <CombinedCourseContent />
      ) : (
        <NormalCourseContent course={course} />
      )}

    </div>
  );
}


/* ======================================================
   COMBINED COURSE CONTENT
====================================================== */

function CombinedCourseContent() {
  const [trackSearch, setTrackSearch] = useState("");
  const [selectedTracks, setSelectedTracks] = useState([
    "digital-marketing",
    "data-analytics",
    "ai-automation",
  ]);

  const [savedTracks, setSavedTracks] = useState([
    "digital-marketing",
    "data-analytics",
    "ai-automation",
  ]);

  const [openTracks, setOpenTracks] = useState([
    "digital-marketing",
  ]);

  const [saved, setSaved] = useState(false);


  /* ======================================================
     SELECTED COURSES
  ====================================================== */

  const selectedObjects = combinedTracks.filter((track) =>
    selectedTracks.includes(track.id)
  );

  const savedObjects = combinedTracks.filter((track) =>
    savedTracks.includes(track.id)
  );

  const totalModules = savedObjects.reduce(
    (total, track) => total + track.modules.length,
    0
  );


  /* ======================================================
     SELECT / DESELECT
  ====================================================== */

  const toggleTrack = (id) => {
    setSaved(false);

    setSelectedTracks((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      return [...current, id];
    });
  };


  /* ======================================================
     REMOVE FROM RIGHT SIDE
  ====================================================== */

  const removeTrack = (id) => {
    setSaved(false);

    setSelectedTracks((current) =>
      current.filter((item) => item !== id)
    );
  };


  /* ======================================================
     RESET
  ====================================================== */

  const resetTracks = () => {
    setSelectedTracks([
      "digital-marketing",
      "data-analytics",
      "ai-automation",
    ]);

    setSaved(false);
  };


  /* ======================================================
     SAVE
  ====================================================== */

  const saveTracks = () => {
    if (selectedTracks.length === 0) {
      alert("Please select at least one course.");
      return;
    }

    setSavedTracks(selectedTracks);

    setOpenTracks([selectedTracks[0]]);

    setSaved(true);

    setTimeout(() => {
      document
        .getElementById("selected-curriculum")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 250);
  };


  /* ======================================================
     OPEN CURRICULUM
  ====================================================== */

  const toggleOpenTrack = (id) => {
    setOpenTracks((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };


  return (
    <main className="mx-auto max-w-[1240px] px-6 py-14">

      {/* ==================================================
          HEADING
      ================================================== */}

      <div className="mb-7">

        <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
          Build Your Program
        </p>

        <h2 className="mt-2 text-3xl font-extrabold text-slate-950">
          Choose Your Learning Tracks
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Select the courses you want to include in your Digital Career
          Accelerator program.
        </p>

      </div>


      {/* ==================================================
          MAIN SELECTOR
      ================================================== */}

      <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.08)]">

        <div className="grid lg:grid-cols-[1.08fr_0.92fr]">

          {/* ==================================================
              LEFT SIDE
          ================================================== */}

          <div className="border-b border-slate-200 p-7 lg:border-b-0 lg:border-r">

            {/* SEARCH / FILTER STYLE HEADER */}

            <div className="flex flex-col gap-3 sm:flex-row">

              <div className="flex h-12 flex-1 items-center rounded-xl border border-slate-200 bg-white px-4">

                <Search
                  size={18}
                  className="text-slate-400"
                />

                <input
                  type="text"
                  placeholder="Search courses"
                  value={trackSearch} onChange={(event) => setTrackSearch(event.target.value)}
                  className="h-full flex-1 bg-transparent px-3 text-sm outline-none"
                />

              </div>


              <div className="flex h-12 min-w-[145px] items-center justify-between rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600">

                <span className="flex items-center gap-2">
                  <SlidersHorizontal size={16} />
                  All Courses
                </span>

                <ChevronDown size={16} />

              </div>

            </div>


            {/* MOST POPULAR */}

            <div className="mt-7 rounded-2xl border border-slate-200 bg-[#fbfcff] p-5">

              <div className="flex items-center justify-between">

                <h3 className="font-bold text-slate-900">
                  Available Courses
                </h3>

                <ChevronUp
                  size={18}
                  className="text-slate-400"
                />

              </div>


              <div className="mt-5 space-y-3">

                {combinedTracks.filter(track => `${track.title} ${track.description}`.toLowerCase().includes(trackSearch.toLowerCase())).map((track) => {
                  const Icon = track.icon;

                  const active =
                    selectedTracks.includes(track.id);

                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => toggleTrack(track.id)}
                      className={`flex w-full items-center gap-4 rounded-xl border px-4 py-4 text-left transition ${active
                          ? "border-blue-200 bg-blue-50"
                          : "border-slate-200 bg-white hover:border-blue-200"
                        }`}
                    >

                      {/* CHECKBOX */}

                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] border ${active
                            ? "border-blue-600 bg-blue-600 text-white"
                            : "border-slate-300 bg-white"
                          }`}
                      >
                        {active && (
                          <Check
                            size={13}
                            strokeWidth={3}
                          />
                        )}
                      </span>


                      {/* ICON */}

                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${active
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600"
                          }`}
                      >
                        <Icon size={19} />
                      </span>


                      {/* TEXT */}

                      <div className="min-w-0 flex-1">

                        <p
                          className={`font-bold ${active
                              ? "text-blue-700"
                              : "text-slate-800"
                            }`}
                        >
                          {track.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          10 Modules â€¢ 5 Mentor Sessions
                        </p>

                      </div>

                    </button>
                  );
                })}

              </div>

            </div>


            {/* COURSE GROUP INFO */}

            <div className="mt-5 rounded-2xl border border-slate-200">

              <div className="flex items-center justify-between px-5 py-4">

                <span className="font-semibold text-slate-700">
                  Marketing & Growth
                </span>

                <ChevronDown
                  size={18}
                  className="text-slate-400"
                />

              </div>

            </div>


            <div className="mt-4 rounded-2xl border border-slate-200">

              <div className="flex items-center justify-between px-5 py-4">

                <span className="font-semibold text-slate-700">
                  Data & Analytics
                </span>

                <ChevronDown
                  size={18}
                  className="text-slate-400"
                />

              </div>

            </div>


            <div className="mt-4 rounded-2xl border border-slate-200">

              <div className="flex items-center justify-between px-5 py-4">

                <span className="font-semibold text-slate-700">
                  AI & Automation
                </span>

                <ChevronDown
                  size={18}
                  className="text-slate-400"
                />

              </div>

            </div>

          </div>


          {/* ==================================================
              RIGHT SIDE
          ================================================== */}

          <div className="bg-[#fcfcfe] p-7">

            <div className="flex items-center gap-3">

              <h3 className="text-xl font-extrabold text-slate-950">
                Your Selected Courses
              </h3>

              <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-blue-600 px-2 text-xs font-bold text-white">
                {selectedTracks.length}
              </span>

            </div>


            <p className="mt-2 text-sm text-slate-500">
              Select or remove courses to customize your program.
            </p>


            {/* SELECTED ROWS */}

            <div className="mt-6 space-y-3">

              {selectedObjects.length === 0 ? (

                <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center">

                  <Layers3
                    size={30}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-3 text-sm font-semibold text-slate-500">
                    No courses selected
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Choose courses from the left.
                  </p>

                </div>

              ) : (

                selectedObjects.map((track, index) => {
                  const Icon = track.icon;

                  return (
                    <div
                      key={track.id}
                      className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
                    >

                      {/* DRAG DOTS VISUAL */}

                      <div className="grid shrink-0 grid-cols-2 gap-[3px]">

                        {[1, 2, 3, 4, 5, 6].map((dot) => (
                          <span
                            key={dot}
                            className="h-[3px] w-[3px] rounded-full bg-slate-300"
                          />
                        ))}

                      </div>


                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">

                        <Icon size={17} />

                      </div>


                      <div className="min-w-0 flex-1">

                        <p className="font-semibold text-slate-800">
                          {track.title}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          Track {index + 1} â€¢ 10 modules
                        </p>

                      </div>


                      <button
                        type="button"
                        onClick={() =>
                          removeTrack(track.id)
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <X size={17} />
                      </button>

                    </div>
                  );
                })

              )}

            </div>


            {/* SUMMARY */}

            <div className="mt-7 rounded-2xl bg-blue-50 p-5">

              <p className="text-xs font-bold uppercase tracking-wider text-blue-500">
                Program Summary
              </p>


              <div className="mt-4 grid grid-cols-2 gap-4">

                <div>

                  <p className="text-2xl font-extrabold text-blue-700">
                    {selectedTracks.length}
                  </p>

                  <p className="text-xs text-slate-500">
                    Selected Tracks
                  </p>

                </div>


                <div>

                  <p className="text-2xl font-extrabold text-blue-700">
                    {selectedTracks.length * 10}
                  </p>

                  <p className="text-xs text-slate-500">
                    Total Modules
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>


        {/* ==================================================
            BOTTOM BUTTONS
        ================================================== */}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-7 py-5 sm:flex-row sm:items-center sm:justify-between">

          <button
            type="button"
            onClick={resetTracks}
            className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold uppercase tracking-[0.08em] text-slate-600 transition hover:bg-slate-50"
          >
            Reset to Default
          </button>


          <button
            type="button"
            onClick={saveTracks}
            className="rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-bold uppercase tracking-[0.08em] text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
          >
            Save Selection
          </button>

        </div>

      </section>


      {/* SUCCESS */}

      {saved && (

        <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">

          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">

            <Check size={17} />

          </div>


          <div>

            <p className="text-sm font-bold text-emerald-800">
              Learning path saved
            </p>

            <p className="text-xs text-emerald-600">
              Your curriculum has been updated below.
            </p>

          </div>

        </div>

      )}


      {/* ==================================================
          CURRICULUM AFTER SAVING
      ================================================== */}

      <section
        id="selected-curriculum"
        className="mt-14 scroll-mt-10"
      >

        <div className="flex flex-wrap items-end justify-between gap-5">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
              Your Curriculum
            </p>

            <h2 className="mt-2 text-3xl font-extrabold">
              Selected Course Modules
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Open each course separately to view its complete learning path.
            </p>

          </div>


          <div className="rounded-xl bg-slate-100 px-5 py-3">

            <p className="text-xs text-slate-500">
              Program Total
            </p>

            <p className="font-extrabold text-slate-900">
              {savedTracks.length} Tracks â€¢ {totalModules} Modules
            </p>

          </div>

        </div>


        {/* TRACK ACCORDIONS */}

        <div className="mt-8 space-y-4">

          {savedObjects.map((track) => {
            const Icon = track.icon;

            const isOpen =
              openTracks.includes(track.id);

            return (
              <article
                key={track.id}
                className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm"
              >

                {/* COURSE HEADER */}

                <button
                  type="button"
                  onClick={() =>
                    toggleOpenTrack(track.id)
                  }
                  className="flex w-full items-center gap-4 px-6 py-5 text-left transition hover:bg-slate-50"
                >

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                    <Icon size={21} />

                  </div>


                  <div className="flex-1">

                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-blue-600">
                      Learning Track
                    </p>

                    <h3 className="mt-1 text-lg font-extrabold">
                      {track.title}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      10 Modules â€¢ 5 Mentor Sessions â€¢ 1 Capstone Project
                    </p>

                  </div>


                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">

                    {isOpen ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}

                  </div>

                </button>


                {/* MODULE LIST */}

                {isOpen && (

                  <div className="border-t border-slate-100 bg-[#fafbfe] px-6 py-6">

                    <div className="space-y-3">

                      {track.modules.map((module, index) => {

                        const moduleNumber =
                          index + 1;

                        return (
                          <div key={module}>

                            <div className="grid grid-cols-[48px_1fr_auto] items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4">

                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600">
                                {String(moduleNumber).padStart(
                                  2,
                                  "0"
                                )}
                              </div>


                              <div>

                                <p className="text-[11px] font-bold uppercase text-blue-600">
                                  Module {moduleNumber}
                                </p>

                                <p className="mt-1 text-sm font-bold text-slate-800">
                                  {module}
                                </p>

                              </div>


                              <LockKeyhole
                                size={16}
                                className="text-slate-400"
                              />

                            </div>


                            <details className="rounded-xl border border-slate-200 bg-white px-5 py-4 mt-2"><summary className="cursor-pointer text-sm font-semibold text-blue-600">Explore module lessons</summary><ol className="mt-3 space-y-3 text-sm text-slate-600">{(lessonTopics[track.id]?.[courses.find(item => item.id === track.id)?.modules.indexOf(module)] || ["Core concepts", "Guided application", "Practical assignment"]).map((lesson, lessonIndex) => <li key={lesson}>{moduleNumber}.{lessonIndex + 1} · {lesson}</li>)}</ol></details>
                            {/* MENTOR SESSION */}

                            {moduleNumber % 2 === 0 && (

                              <div className="ml-6 flex gap-3 border-l-2 border-blue-200 py-4 pl-5">

                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">

                                  <MessageCircle size={15} />

                                </div>


                                <div>

                                  <p className="text-xs font-bold text-blue-600">
                                    Mentor Session{" "}
                                    {moduleNumber / 2}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-500">
                                    Doubt solving, practical discussion
                                    and mentor feedback.
                                  </p>

                                </div>

                              </div>

                            )}

                          </div>
                        );
                      })}

                    </div>


                    {/* CAPSTONE */}

                    <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">

                      <div className="flex gap-4">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">

                          <BadgeCheck size={19} />

                        </div>


                        <div>

                          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                            Final Project
                          </p>

                          <h4 className="mt-1 font-bold">
                            {track.title} Capstone Project
                          </h4>

                          <p className="mt-1 text-sm text-slate-500">
                            Complete a real-world project to finish this
                            learning track.
                          </p>

                        </div>

                      </div>

                    </div>

                  </div>

                )}

              </article>
            );
          })}

        </div>

      </section>


      {/* ==================================================
          FINAL CTA
      ================================================== */}

      <section className="mt-12 overflow-hidden rounded-[22px] bg-[#071936] px-8 py-8 text-white">

        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-300">
              Digital Career Accelerator
            </p>

            <h2 className="mt-2 text-2xl font-extrabold">
              Your program. Your learning path.
            </h2>

            <p className="mt-2 text-sm text-blue-100">
              Learn only the skills you choose and track each course
              separately.
            </p>

          </div>


          <Link
            to="/checkout/career-accelerator"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-7 py-4 font-bold text-blue-700 transition hover:-translate-y-0.5"
          >
            Continue to Checkout
            <ArrowRight size={18} />
          </Link>

        </div>

      </section>

    </main>
  );
}


/* ======================================================
   NORMAL INDIVIDUAL COURSE
====================================================== */

function CoursePurchaseCard({ course }) {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const addToCart = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("rathi-cart") || "[]");
      const cart = Array.isArray(stored) ? stored : [];
      const item = { id: course.id, title: course.title, price: course.price, image: course.image, type: "course" };
      const updated = cart.some((entry) => entry.id === course.id)
        ? cart.map((entry) => entry.id === course.id ? item : entry)
        : [...cart, item];
      localStorage.setItem("rathi-cart", JSON.stringify(updated));
      navigate("/cart");
    } catch {
      setError("Your cart could not be saved. Please try again.");
    }
  };

  return <aside className="rounded-3xl border border-white/20 bg-white p-7 text-slate-950 shadow-xl">
    <img src={course.image} alt="" className="mb-5 h-24 w-24 rounded-2xl" />
    <p className="text-sm font-semibold text-slate-500">{course.category} course</p>
    <p className="mt-2 text-4xl font-extrabold">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(course.price)}</p>
    <div className="my-6 flex flex-wrap gap-2">{course.tags.map((tag) => <span key={tag} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">{tag}</span>)}</div>
    <button onClick={addToCart} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 font-bold text-white hover:bg-blue-700">Add to Cart <ArrowRight size={18} /></button>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
  </aside>;
}

function NormalCourseContent({ course }) {
  return (
    <main className="mx-auto grid max-w-7xl gap-10 px-6 py-14 lg:grid-cols-[1fr_320px]">

      <section>

        <div className="mb-8">

          <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
            Curriculum
          </p>

          <h2 className="mt-2 text-3xl font-extrabold">
            Your Course Journey
          </h2>

        </div>


        <div className="space-y-4">

          {course.modules.map(
            (module, index) => {

              const moduleNumber =
                index + 1;

              return (
                <div key={module}>

                  <div className="grid grid-cols-[60px_1fr_auto] items-center gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md">

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-sm font-extrabold text-blue-600">

                      {String(
                        moduleNumber
                      ).padStart(2, "0")}

                    </div>


                    <div>

                      <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                        Module {moduleNumber}
                      </p>

                      <h3 className="mt-1 text-[17px] font-bold">
                        {module}
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        Video lessons â€¢ resources â€¢ practical activity
                      </p>

                    </div>


                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <LockKeyhole size={17} />
                    </div>

                  </div>


                  {moduleNumber % 2 === 0 && (

                    <div className="ml-8 flex gap-4 border-l-2 border-blue-200 py-5 pl-7">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">

                        <MessageCircle size={18} />

                      </div>


                      <div>

                        <p className="text-sm font-bold text-blue-600">
                          Mentor Session{" "}
                          {moduleNumber / 2}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Live doubt clearing and project feedback.
                        </p>

                      </div>

                    </div>

                  )}

                </div>
              );
            }
          )}

        </div>

      </section>


      <aside>

        <div className="sticky top-8 rounded-[22px] border border-blue-100 bg-white p-6 shadow-sm">

          <BadgeCheck
            size={28}
            className="text-blue-600"
          />

          <h3 className="mt-4 text-xl font-bold">
            Certification Path
          </h3>


          <div className="mt-6 space-y-4">

            <PathStep
              number="01"
              text="Complete modules"
            />

            <PathStep
              number="02"
              text="Attend mentor sessions"
            />

            <PathStep
              number="03"
              text="Complete practical work"
            />

            <PathStep
              number="04"
              text="Submit capstone project"
            />

            <PathStep
              number="05"
              text="Pass mentor evaluation"
            />

            <PathStep
              number="06"
              text="Earn certificate"
            />

          </div>

        </div>

      </aside>

    </main>
  );
}


/* ======================================================
   COURSE VIDEO PREVIEW
====================================================== */

function CourseVideoPreview({ course, preview }) {
  if (!preview) return null;

  return (
    <div className="w-full">

      <div className="overflow-hidden rounded-[24px] border border-white/20 bg-[#020617] shadow-[0_24px_70px_rgba(0,0,0,0.35)]">

        <div className="relative aspect-video overflow-hidden">

          <img
            src={preview.thumbnail}
            alt={`${course.title} course preview`}
            className="h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/5" />

          {/* VIDEO CONTROLS */}
          <div className="absolute inset-x-0 bottom-0 px-5 pb-4">

            {/* CYAN / BLUE PROGRESS BAR */}
            <div className="mb-4 h-[4px] rounded-full bg-white/30">

              <div
                className="relative h-full rounded-full bg-cyan-400"
                style={{ width: preview.progress }}
              >
                <span className="absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 translate-x-1/2 rounded-full bg-cyan-300 shadow-md" />
              </div>

            </div>

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-4">

                {/* PLAY - SIMPLE YOUTUBE STYLE TRIANGLE, NO YOUTUBE LOGO */}
                <button
                  type="button"
                  aria-label="Play preview"
                  className="flex h-8 w-8 items-center justify-center text-white transition hover:scale-110"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="ml-[2px] h-7 w-7 fill-current"
                  >
                    <path d="M7 4.5v15l12-7.5-12-7.5Z" />
                  </svg>
                </button>

                <button
                  type="button"
                  aria-label="Next"
                  className="text-white/95"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-current"
                  >
                    <path d="M6 5.5v13l9-6.5-9-6.5Zm10 0h2v13h-2v-13Z" />
                  </svg>
                </button>

                <button
                  type="button"
                  aria-label="Volume"
                  className="text-white/95"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-current"
                  >
                    <path d="M4 9v6h4l5 4V5L8 9H4Zm11.5 3a3.5 3.5 0 0 0-1.5-2.87v5.74A3.5 3.5 0 0 0 15.5 12Zm0-7.2v2.06a6 6 0 0 1 0 10.28v2.06a8 8 0 0 0 0-13.9Z" />
                  </svg>
                </button>

                <span className="text-xs font-semibold text-white sm:text-sm">
                  {preview.currentTime} / {preview.totalTime}
                </span>

              </div>

              <div className="flex items-center gap-4 text-white">

                <button
                  type="button"
                  aria-label="Settings"
                  className="text-lg leading-none"
                >
                  âš™
                </button>

                <button
                  type="button"
                  aria-label="Theater mode"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-current"
                  >
                    <path d="M3 6h18v12H3V6Zm2 2v8h14V8H5Z" />
                  </svg>
                </button>

                <button
                  type="button"
                  aria-label="Fullscreen"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-current"
                  >
                    <path d="M4 4h6v2H6v4H4V4Zm10 0h6v6h-2V6h-4V4ZM4 14h2v4h4v2H4v-6Zm14 0h2v6h-6v-2h4v-4Z" />
                  </svg>
                </button>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}


/* ======================================================
   HELPERS
====================================================== */

function PurchaseFeature({ text }) {
  return (
    <p className="flex items-center gap-3">

      <CheckCircle2
        size={17}
        className="shrink-0 text-emerald-500"
      />

      {text}

    </p>
  );
}


function PathStep({
  number,
  text,
}) {
  return (
    <div className="flex gap-3">

      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600">
        {number}
      </span>

      <p className="pt-1 text-sm font-medium text-slate-600">
        {text}
      </p>

    </div>
  );
}





