import React, { useEffect, useState } from "react";

import {
  ArrowLeft,
  Clock3,
  FolderKanban,
  CheckCircle2,
  ExternalLink,
  Link2,
  FileText,
  Upload,
  Play,
  Trophy,
} from "lucide-react";

/* =========================================================
   DEMO COURSE DATA
   Later replace with backend enrollment data.
========================================================= */

const enrolledCourses = [
  {
    id: "digital-marketing",
    title: "Digital Marketing Mastery",
    image: "/digital-marketing-course.jpg",

    projects: [
      {
        id: "seo-campaign",

        title: "SEO Campaign Project",

        status: "pending",

        deadline:
          "10 Sep 2026 • 11:59 PM",

        durationHours: 10,

        problem:
          "Build a complete SEO campaign for a selected brand including keyword research, competitor research, on-page SEO strategy and a final performance report.",

        deliverables: [
          "Keyword Research Document",
          "Competitor Analysis",
          "On-page SEO Plan",
          "Final SEO Campaign Report",
        ],

        githubRequired: false,
      },

      {
        id: "social-media-campaign",

        title:
          "Social Media Campaign Project",

        status: "completed",

        deadline: "Completed",

        durationHours: 10,

        problem:
          "Create a complete social media campaign for a selected brand including campaign goals, content plan, platform strategy and performance metrics.",

        deliverables: [
          "Campaign Strategy",
          "30-day Content Plan",
          "Platform Selection",
          "Performance Report",
        ],

        githubRequired: false,
      },
    ],
  },

  {
    id: "data-analytics",

    title: "Data Analytics Mastery",

    image: "/data-analytics-course.jpg",

    projects: [
      {
        id: "sales-dashboard",

        title:
          "Sales Analytics Dashboard",

        status: "pending",

        deadline:
          "14 Sep 2026 • 11:59 PM",

        durationHours: 10,

        problem:
          "Analyze a business sales dataset and create an interactive dashboard that highlights revenue trends, product performance and actionable business insights.",

        deliverables: [
          "Cleaned Dataset",
          "Analysis Notebook / SQL Queries",
          "Interactive Dashboard",
          "Insight Summary",
        ],

        githubRequired: true,
      },

      {
        id: "customer-analysis",

        title:
          "Customer Behaviour Analysis",

        status: "pending",

        deadline:
          "20 Sep 2026 • 11:59 PM",

        durationHours: 10,

        problem:
          "Analyze customer behaviour and identify important customer segments, purchasing patterns and retention opportunities.",

        deliverables: [
          "Data Cleaning",
          "EDA Report",
          "Customer Segmentation",
          "Final Business Recommendations",
        ],

        githubRequired: true,
      },
    ],
  },

  {
    id: "ai-automation",

    title: "AI Automation Mastery",

    image: "/ai-automation-course.jpg",

    projects: [
      {
        id: "ai-support-agent",

        title:
          "AI Customer Support Agent",

        status: "pending",

        deadline:
          "18 Sep 2026 • 11:59 PM",

        durationHours: 10,

        problem:
          "Build an AI-powered customer support workflow using an LLM, APIs and automation tools. The system should answer common queries and route unsupported queries appropriately.",

        deliverables: [
          "Workflow Design",
          "Working Automation",
          "GitHub Repository",
          "Demo / Documentation",
        ],

        githubRequired: true,
      },

      {
        id: "lead-automation",

        title:
          "Lead Automation Workflow",

        status: "completed",

        deadline: "Completed",

        durationHours: 10,

        problem:
          "Create an automated lead handling workflow that receives leads, validates information, routes them and sends follow-up communication.",

        deliverables: [
          "Workflow",
          "API / Webhook Setup",
          "GitHub Repository",
          "Project Documentation",
        ],

        githubRequired: true,
      },
    ],
  },
];

/* =========================================================
   HELPERS
========================================================= */

const getProjectTimerKey = (
  projectId
) =>
  `rathi-project-start-${projectId}`;

const getSubmissionKey = (
  projectId
) =>
  `rathi-project-submission-${projectId}`;

function formatTime(totalSeconds) {
  if (totalSeconds <= 0) {
    return "00:00:00";
  }

  const hours = Math.floor(
    totalSeconds / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds =
    totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) =>
      String(value).padStart(2, "0")
    )
    .join(":");
}

/* =========================================================
   MAIN
========================================================= */

export default function Projects() {
  const [screen, setScreen] =
    useState("courses");

  const [
    selectedCourse,
    setSelectedCourse,
  ] = useState(null);

  const [
    selectedProject,
    setSelectedProject,
  ] = useState(null);

  const [
    remainingSeconds,
    setRemainingSeconds,
  ] = useState(null);

  const [
    githubLink,
    setGithubLink,
  ] = useState("");

  const [
    projectLink,
    setProjectLink,
  ] = useState("");

  const [
    additionalLink,
    setAdditionalLink,
  ] = useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    fileName,
    setFileName,
  ] = useState("");

  const [
    submitted,
    setSubmitted,
  ] = useState(false);

  /* =======================================================
     COURSE STATS
  ======================================================= */

  const getProjectStats = (
    course
  ) => {
    const total =
      course.projects.length;

    const completed =
      course.projects.filter(
        (project) =>
          project.status ===
          "completed"
      ).length;

    return {
      total,
      completed,
      pending:
        total - completed,
    };
  };

  /* =======================================================
     OPEN COURSE
  ======================================================= */

  const openCourseProjects = (
    course
  ) => {
    setSelectedCourse(course);

    setSelectedProject(null);

    setScreen("projects");
  };

  /* =======================================================
     OPEN PROJECT
  ======================================================= */

  const openProject = (
    project
  ) => {
    setSelectedProject(project);

    setScreen("details");

    setSubmitted(false);

    const savedSubmission =
      localStorage.getItem(
        getSubmissionKey(
          project.id
        )
      );

    if (savedSubmission) {
      try {
        const submission =
          JSON.parse(
            savedSubmission
          );

        setGithubLink(
          submission.githubLink ||
          ""
        );

        setProjectLink(
          submission.projectLink ||
          ""
        );

        setAdditionalLink(
          submission.additionalLink ||
          ""
        );

        setDescription(
          submission.description ||
          ""
        );

        setFileName(
          submission.fileName ||
          ""
        );

        setSubmitted(
          Boolean(
            submission.submitted
          )
        );
      } catch {
        // ignore invalid localStorage data
      }
    }
  };

  /* =======================================================
     START PROJECT
  ======================================================= */

  const startAssignment = () => {
    if (!selectedProject) {
      return;
    }

    const key =
      getProjectTimerKey(
        selectedProject.id
      );

    let startTime =
      localStorage.getItem(key);

    if (!startTime) {
      startTime =
        Date.now().toString();

      localStorage.setItem(
        key,
        startTime
      );
    }

    setScreen("workspace");
  };

  /* =======================================================
     TIMER
  ======================================================= */

  useEffect(() => {
    if (
      screen !== "workspace" ||
      !selectedProject
    ) {
      return;
    }

    const key =
      getProjectTimerKey(
        selectedProject.id
      );

    let startTime = Number(
      localStorage.getItem(key)
    );

    if (!startTime) {
      startTime = Date.now();

      localStorage.setItem(
        key,
        startTime.toString()
      );
    }

    const totalSeconds =
      selectedProject.durationHours *
      60 *
      60;

    const updateTimer = () => {
      const elapsedSeconds =
        Math.floor(
          (Date.now() -
            startTime) /
          1000
        );

      const left = Math.max(
        totalSeconds -
        elapsedSeconds,
        0
      );

      setRemainingSeconds(
        left
      );
    };

    updateTimer();

    const interval =
      setInterval(
        updateTimer,
        1000
      );

    return () =>
      clearInterval(interval);
  }, [
    screen,
    selectedProject,
  ]);

  /* =======================================================
     SUBMIT PROJECT
  ======================================================= */

  const submitProject = () => {
    if (!selectedProject) {
      return;
    }

    if (
      !projectLink.trim()
    ) {
      alert(
        "Please add your Project / Drive / Live link."
      );

      return;
    }

    if (
      !description.trim()
    ) {
      alert(
        "Please add a project description."
      );

      return;
    }

    if (
      selectedProject.githubRequired &&
      !githubLink.trim()
    ) {
      alert(
        "Please add your GitHub repository link."
      );

      return;
    }

    const submission = {
      githubLink,
      projectLink,
      additionalLink,
      description,
      fileName,

      submitted: true,

      submittedAt:
        new Date().toISOString(),
    };

    localStorage.setItem(
      getSubmissionKey(
        selectedProject.id
      ),

      JSON.stringify(
        submission
      )
    );

    setSubmitted(true);
  };

  /* =======================================================
     SCREEN 1 — ENROLLED COURSES
  ======================================================= */

  if (
    screen === "courses"
  ) {
    return (
      <div className="mx-auto max-w-[1250px] p-5 md:p-7">

        <div>
          <h1 className="text-[26px] font-bold text-[#101936]">
            Projects
          </h1>

          <p className="mt-1 text-[12px] text-[#7c879b]">
            Select one of your
            enrolled courses to
            view its projects.
          </p>
        </div>

        <div className="mt-6 space-y-4">

          {enrolledCourses.map(
            (course) => {
              const stats =
                getProjectStats(
                  course
                );

              return (
                <div
                  key={
                    course.id
                  }
                  className="flex flex-col gap-5 rounded-[18px] border border-[#e5eaf2] bg-white p-5 shadow-[0_5px_20px_rgba(15,23,42,.035)] md:flex-row md:items-center"
                >

                  <img
                    src={
                      course.image
                    }
                    alt={
                      course.title
                    }
                    className="h-[110px] w-full rounded-[14px] object-cover md:w-[180px]"
                  />

                  <div className="min-w-0 flex-1">

                    <p className="text-[10px] font-bold uppercase tracking-[1px] text-[#2563eb]">
                      Enrolled Course
                    </p>

                    <h2 className="mt-2 text-[20px] font-bold text-[#101936]">
                      {
                        course.title
                      }
                    </h2>

                    <div className="mt-4 flex flex-wrap gap-5 text-[11px] text-[#68758c]">

                      <span>
                        {
                          stats.total
                        }{" "}
                        Projects
                      </span>

                      <span>
                        {
                          stats.completed
                        }{" "}
                        Completed
                      </span>

                      <span>
                        {
                          stats.pending
                        }{" "}
                        Pending
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      openCourseProjects(
                        course
                      )
                    }
                    className="flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#2563eb] px-5 text-[12px] font-semibold text-white"
                  >
                    <FolderKanban
                      size={16}
                    />

                    View Projects
                  </button>
                </div>
              );
            }
          )}
        </div>
      </div>
    );
  }

  /* =======================================================
     SCREEN 2 — COURSE PROJECT LIST
  ======================================================= */

  if (
    screen === "projects" &&
    selectedCourse
  ) {
    return (
      <div className="mx-auto max-w-[1250px] p-5 md:p-7">

        <button
          onClick={() =>
            setScreen(
              "courses"
            )
          }
          className="flex items-center gap-2 text-[12px] font-semibold text-[#667085]"
        >
          <ArrowLeft
            size={16}
          />

          Back to Courses
        </button>

        <div className="mt-5">

          <p className="text-[10px] font-bold uppercase tracking-[1px] text-[#2563eb]">
            {
              selectedCourse.title
            }
          </p>

          <h1 className="mt-2 text-[25px] font-bold text-[#101936]">
            Course Projects
          </h1>

          <p className="mt-1 text-[12px] text-[#7c879b]">
            Complete the projects
            below to demonstrate
            your practical skills.
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">

          {selectedCourse.projects.map(
            (project) => (
              <div
                key={
                  project.id
                }
                className="rounded-[18px] border border-[#e5eaf2] bg-white p-5 shadow-[0_5px_20px_rgba(15,23,42,.035)]"
              >

                <div className="flex items-start justify-between gap-3">

                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#eef4ff] text-[#2563eb]">
                    <FolderKanban
                      size={20}
                    />
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-semibold ${project.status ===
                        "completed"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-amber-50 text-amber-600"
                      }`}
                  >
                    {project.status ===
                      "completed"
                      ? "Completed"
                      : "Not Started"}
                  </span>
                </div>

                <h2 className="mt-5 text-[18px] font-bold text-[#101936]">
                  {
                    project.title
                  }
                </h2>

                <p className="mt-2 text-[11px] leading-5 text-[#68758c]">
                  {
                    project.problem
                  }
                </p>

                <div className="mt-5 flex items-center gap-2 text-[11px] text-[#68758c]">

                  <Clock3
                    size={15}
                  />

                  {
                    project.deadline
                  }
                </div>

                <button
                  onClick={() =>
                    openProject(
                      project
                    )
                  }
                  className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-[9px] border border-[#dfe5ee] bg-white text-[11px] font-semibold text-[#2563eb] hover:bg-[#f7f9ff]"
                >
                  View Project

                  <ExternalLink
                    size={14}
                  />
                </button>
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  /* =======================================================
     SCREEN 3 — PROJECT DETAILS
  ======================================================= */

  if (
    screen === "details" &&
    selectedProject &&
    selectedCourse
  ) {
    return (
      <div className="mx-auto max-w-[1250px] p-5 md:p-7">

        <button
          onClick={() =>
            setScreen(
              "projects"
            )
          }
          className="flex items-center gap-2 text-[12px] font-semibold text-[#667085]"
        >
          <ArrowLeft
            size={16}
          />

          Back to Projects
        </button>

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">

          {/* LEFT */}

          <div className="rounded-[18px] border border-[#e5eaf2] bg-white p-6">

            <p className="text-[10px] font-bold uppercase tracking-[1px] text-[#2563eb]">
              {
                selectedCourse.title
              }
            </p>

            <h1 className="mt-2 text-[26px] font-bold text-[#101936]">
              {
                selectedProject.title
              }
            </h1>

            {/* PROBLEM */}

            <div className="mt-7">

              <h2 className="text-[15px] font-bold text-[#101936]">
                Problem Statement
              </h2>

              <p className="mt-3 text-[12px] leading-6 text-[#5f6b80]">
                {
                  selectedProject.problem
                }
              </p>
            </div>

            {/* DELIVERABLES */}

            <div className="mt-8">

              <h2 className="text-[15px] font-bold text-[#101936]">
                Deliverables
              </h2>

              <div className="mt-4 space-y-3">

                {selectedProject.deliverables.map(
                  (
                    deliverable,
                    index
                  ) => (
                    <div
                      key={
                        deliverable
                      }
                      className="flex items-center gap-3 rounded-xl bg-[#f8faff] p-3 text-[11px] text-[#4e5b72]"
                    >

                      <span className="grid h-6 w-6 place-items-center rounded-full bg-[#e8f0ff] text-[10px] font-bold text-[#2563eb]">
                        {index +
                          1}
                      </span>

                      {
                        deliverable
                      }
                    </div>
                  )
                )}
              </div>
            </div>

            {/* START */}

            {selectedProject.status !==
              "completed" && (
                <button
                  onClick={
                    startAssignment
                  }
                  className="mt-8 flex h-12 items-center gap-2 rounded-[10px] bg-[#2563eb] px-6 text-[13px] font-semibold text-white"
                >
                  <Play
                    size={17}
                  />

                  Start Assignment
                </button>
              )}
          </div>

          {/* RIGHT */}

          <div className="space-y-4">

            <div className="rounded-[18px] border border-[#e5eaf2] bg-white p-5">

              <p className="text-[11px] text-[#8a94a8]">
                Project Deadline
              </p>

              <p className="mt-2 text-[13px] font-bold text-[#101936]">
                {
                  selectedProject.deadline
                }
              </p>
            </div>

            <div className="rounded-[18px] border border-[#e5eaf2] bg-white p-5">

              <p className="text-[11px] text-[#8a94a8]">
                Assignment Duration
              </p>

              <p className="mt-2 text-[22px] font-bold text-[#2563eb]">
                {
                  selectedProject.durationHours
                }{" "}
                Hours
              </p>

              <p className="mt-2 text-[10px] leading-5 text-[#8a94a8]">
                Timer starts only
                when you click
                Start Assignment.
              </p>
            </div>

            <div className="rounded-[18px] border border-[#e5eaf2] bg-white p-5">

              <h3 className="text-[13px] font-bold text-[#101936]">
                Review Process
              </h3>

              <p className="mt-3 text-[10px] leading-5 text-[#7c879b]">
                Submit your project
                links, description
                and deliverables.
                Your mentor can
                review the work and
                provide feedback.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     SCREEN 4 — ACTIVE PROJECT WORKSPACE
  ======================================================= */

  if (
    screen === "workspace" &&
    selectedProject &&
    selectedCourse
  ) {
    const expired =
      remainingSeconds === 0;

    return (
      <div className="mx-auto max-w-[1250px] p-5 md:p-7">

        <button
          onClick={() =>
            setScreen(
              "details"
            )
          }
          className="flex items-center gap-2 text-[12px] font-semibold text-[#667085]"
        >
          <ArrowLeft
            size={16}
          />

          Project Details
        </button>

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">

          {/* =================================================
              LEFT
          ================================================= */}

          <div className="min-w-0 space-y-5">

            {/* PROJECT INFORMATION */}

            <div className="rounded-[18px] border border-[#e5eaf2] bg-white p-6">

              <p className="text-[10px] font-bold uppercase tracking-[1px] text-[#2563eb]">
                {
                  selectedCourse.title
                }
              </p>

              <h1 className="mt-2 text-[24px] font-bold text-[#101936]">
                {
                  selectedProject.title
                }
              </h1>

              <h2 className="mt-7 text-[14px] font-bold text-[#101936]">
                Problem Statement
              </h2>

              <p className="mt-3 text-[11px] leading-6 text-[#5f6b80]">
                {
                  selectedProject.problem
                }
              </p>
            </div>

            {/* =================================================
                SUBMISSION FORM
            ================================================= */}

            <div className="rounded-[18px] border border-[#e5eaf2] bg-white p-6">

              <h2 className="text-[17px] font-bold text-[#101936]">
                Your Submission
              </h2>

              <p className="mt-1 text-[11px] text-[#8a94a8]">
                Share your project
                links and explain
                what you built.
              </p>

              {/* ===============================
                  GITHUB LINK
              =============================== */}

              <div className="mt-6">

                <label className="flex items-center gap-2 text-[11px] font-semibold text-[#344054]">

                  {/* SAFE GITHUB ICON */}
                  {/* No lucide Github import */}

                  <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-[#111827] text-[8px] font-black text-white">
                    GH
                  </span>

                  GitHub Repository Link

                  {!selectedProject.githubRequired && (
                    <span className="font-normal text-[#98a2b3]">
                      (Optional)
                    </span>
                  )}
                </label>

                <input
                  value={
                    githubLink
                  }
                  onChange={(e) =>
                    setGithubLink(
                      e.target
                        .value
                    )
                  }
                  placeholder="https://github.com/username/project"
                  className="mt-2 h-11 w-full rounded-[10px] border border-[#dfe5ee] px-3 text-[12px] outline-none focus:border-[#2563eb]"
                />
              </div>

              {/* ===============================
                  PROJECT LINK
              =============================== */}

              <div className="mt-5">

                <label className="flex items-center gap-2 text-[11px] font-semibold text-[#344054]">

                  <Link2
                    size={15}
                  />

                  Project / Drive / Live Link *

                </label>

                <input
                  value={
                    projectLink
                  }
                  onChange={(e) =>
                    setProjectLink(
                      e.target
                        .value
                    )
                  }
                  placeholder="https://..."
                  className="mt-2 h-11 w-full rounded-[10px] border border-[#dfe5ee] px-3 text-[12px] outline-none focus:border-[#2563eb]"
                />
              </div>

              {/* ===============================
                  DESCRIPTION
              =============================== */}

              <div className="mt-5">

                <label className="flex items-center gap-2 text-[11px] font-semibold text-[#344054]">

                  <FileText
                    size={15}
                  />

                  Project Description *

                </label>

                <textarea
                  value={
                    description
                  }
                  onChange={(e) =>
                    setDescription(
                      e.target
                        .value
                    )
                  }
                  placeholder="Explain your approach, tools used, results and important observations..."
                  className="mt-2 min-h-[130px] w-full resize-none rounded-[10px] border border-[#dfe5ee] p-3 text-[12px] leading-5 outline-none focus:border-[#2563eb]"
                />
              </div>

              {/* ===============================
                  ADDITIONAL LINK
              =============================== */}

              <div className="mt-5">

                <label className="text-[11px] font-semibold text-[#344054]">
                  Additional Link

                  <span className="ml-1 font-normal text-[#98a2b3]">
                    (Optional)
                  </span>
                </label>

                <input
                  value={
                    additionalLink
                  }
                  onChange={(e) =>
                    setAdditionalLink(
                      e.target
                        .value
                    )
                  }
                  placeholder="Demo video, report, documentation..."
                  className="mt-2 h-11 w-full rounded-[10px] border border-[#dfe5ee] px-3 text-[12px] outline-none focus:border-[#2563eb]"
                />
              </div>

              {/* ===============================
                  FILE UPLOAD
              =============================== */}

              <div className="mt-5">

                <label className="text-[11px] font-semibold text-[#344054]">
                  Upload Supporting File
                </label>

                <label className="mt-2 flex min-h-[90px] cursor-pointer items-center justify-center rounded-[10px] border border-dashed border-[#cfd7e6] bg-[#fafbfe]">

                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) =>
                      setFileName(
                        e.target
                          .files?.[0]
                          ?.name ||
                        ""
                      )
                    }
                  />

                  <div className="text-center">

                    <Upload
                      size={20}
                      className="mx-auto text-[#2563eb]"
                    />

                    <p className="mt-2 text-[11px] font-semibold text-[#526078]">
                      {fileName ||
                        "Choose File"}
                    </p>
                  </div>
                </label>
              </div>

              {/* ===============================
                  SUBMIT STATUS
              =============================== */}

              {submitted ? (
                <div className="mt-6 flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-[12px] font-semibold text-emerald-700">

                  <CheckCircle2
                    size={19}
                  />

                  Project submitted successfully.
                </div>
              ) : (
                <button
                  onClick={
                    submitProject
                  }
                  disabled={
                    expired
                  }
                  className={`mt-6 h-12 rounded-[10px] px-7 text-[13px] font-semibold text-white ${expired
                      ? "cursor-not-allowed bg-slate-400"
                      : "bg-[#2563eb] hover:bg-[#1d55ca]"
                    }`}
                >
                  {expired
                    ? "Submission Time Ended"
                    : "Submit Project"}
                </button>
              )}
            </div>
          </div>

          {/* =================================================
              RIGHT SIDEBAR
          ================================================= */}

          <div className="space-y-4">

            {/* TIMER */}

            <div className="rounded-[18px] border border-[#e5eaf2] bg-white p-5 text-center">

              <Clock3
                size={22}
                className="mx-auto text-[#ef4444]"
              />

              <p className="mt-3 text-[11px] text-[#8a94a8]">
                Time Remaining
              </p>

              <p
                className={`mt-2 text-[27px] font-bold tracking-[1px] ${expired
                    ? "text-red-500"
                    : "text-[#101936]"
                  }`}
              >
                {remainingSeconds ===
                  null
                  ? "--:--:--"
                  : formatTime(
                    remainingSeconds
                  )}
              </p>

              <p className="mt-2 text-[10px] leading-5 text-[#98a2b3]">
                The timer continues
                even if the page is
                refreshed.
              </p>
            </div>

            {/* DELIVERABLES */}

            <div className="rounded-[18px] border border-[#e5eaf2] bg-white p-5">

              <h3 className="text-[13px] font-bold text-[#101936]">
                Deliverables
              </h3>

              <div className="mt-4 space-y-3">

                {selectedProject.deliverables.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      key={
                        item
                      }
                      className="flex gap-3 text-[10px] leading-5 text-[#667085]"
                    >

                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#eef4ff] text-[9px] font-bold text-[#2563eb]">
                        {index +
                          1}
                      </span>

                      {
                        item
                      }
                    </div>
                  )
                )}
              </div>
            </div>

            {/* DEADLINE */}

            <div className="rounded-[18px] border border-[#e5eaf2] bg-white p-5">

              <p className="text-[10px] text-[#8a94a8]">
                Project Deadline
              </p>

              <p className="mt-2 text-[12px] font-bold text-[#101936]">
                {
                  selectedProject.deadline
                }
              </p>
            </div>

            {/* REVIEW */}

            <div className="rounded-[18px] border border-[#e5eaf2] bg-white p-5">

              <Trophy
                size={19}
                className="text-[#f59e0b]"
              />

              <h3 className="mt-3 text-[13px] font-bold text-[#101936]">
                Review Process
              </h3>

              <p className="mt-2 text-[10px] leading-5 text-[#7c879b]">
                Your mentor will
                review the submitted
                links, documentation
                and deliverables
                before marking the
                project complete.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}