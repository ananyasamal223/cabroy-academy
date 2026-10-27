import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle, Clock3, Upload } from "lucide-react";
import StudentLayout from "./StudentLayout";

const projectData = {
  "digital-marketing": {
    course: "Digital Marketing",
    title: "Launch a Performance Marketing Campaign",
    statement:
      "Create a complete paid marketing campaign for a fictional D2C brand. Define the target audience, funnel, campaign structure, ad concepts, budget allocation, KPIs and reporting approach.",
    deliverables: [
      "Campaign strategy document",
      "Meta or Google Ads structure",
      "3 ad creative concepts",
      "Budget and KPI tracking sheet",
      "Final performance analysis",
    ],
  },
  "data-analytics": {
    course: "Data Analysis",
    title: "Build an Executive Sales Dashboard",
    statement:
      "Analyze a business sales dataset, clean the data, answer business questions and build a dashboard that communicates actionable insights.",
    deliverables: ["Cleaned dataset", "SQL queries", "Dashboard file/link", "Insights summary"],
  },
  "ai-automation": {
    course: "AI Automation",
    title: "Build an AI-Powered Business Workflow",
    statement:
      "Design and implement an automation workflow that solves a practical business problem using APIs, webhooks and an LLM or AI tool.",
    deliverables: ["Workflow export", "README", "Demo URL/video", "Architecture explanation"],
  },
};

const TEN_HOURS = 10 * 60 * 60;

export default function Assignment() {
  const { courseId } = useParams();
  const project = projectData[courseId] || projectData["digital-marketing"];

  const [started, setStarted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TEN_HOURS);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!started || submitted || secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [started, submitted, secondsLeft]);

  const time = useMemo(() => {
    const h = String(Math.floor(secondsLeft / 3600)).padStart(2, "0");
    const m = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, "0");
    const s = String(secondsLeft % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }, [secondsLeft]);

  return (
    <StudentLayout title="Projects">
      <div className="max-w-5xl">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
          {project.course} • Final Capstone
        </p>
        <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">{project.title}</h1>

        {!started ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
            <section className="rounded-[22px] border border-slate-200 bg-white p-7">
              <h2 className="text-xl font-extrabold">Problem Statement</h2>
              <p className="mt-4 leading-7 text-slate-600">{project.statement}</p>

              <h3 className="mt-7 font-extrabold">Required Deliverables</h3>
              <div className="mt-4 space-y-3">
                {project.deliverables.map((item, index) => (
                  <div key={item} className="flex gap-3 rounded-xl bg-slate-50 px-4 py-3">
                    <span className="font-bold text-blue-600">{String(index + 1).padStart(2, "0")}</span>
                    <span className="text-sm text-slate-600">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            <aside className="h-fit rounded-[22px] bg-[#071936] p-6 text-white">
              <Clock3 className="text-blue-300" />
              <p className="mt-4 text-sm text-blue-200">Time Limit</p>
              <p className="mt-1 text-4xl font-extrabold">10 Hours</p>
              <p className="mt-4 text-sm leading-6 text-blue-100">
                The timer begins immediately after you start. Prepare your tools and files first.
              </p>
              <button
                onClick={() => setStarted(true)}
                className="mt-6 w-full rounded-xl bg-white py-3.5 font-bold text-blue-800"
              >
                Start Assignment
              </button>
            </aside>
          </div>
        ) : (
          <div className="mt-8">
            <div className="flex flex-col gap-4 rounded-[22px] border border-red-100 bg-red-50 p-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-red-500" />
                <div>
                  <p className="text-sm font-bold text-red-700">TIME REMAINING</p>
                  <p className="text-xs text-red-500">Submit before the timer reaches zero.</p>
                </div>
              </div>
              <p className="font-mono text-4xl font-extrabold text-red-700">{time}</p>
            </div>

            <section className="mt-6 rounded-[22px] border border-slate-200 bg-white p-7">
              <h2 className="text-xl font-extrabold">Submit Your Project</h2>
              <div className="mt-6 grid gap-4">
                <input className="h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-blue-500" placeholder="Project Name" />
                <input className="h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-blue-500" placeholder="GitHub / Drive URL" />
                <input className="h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-blue-500" placeholder="Demo URL" />
                <textarea rows="6" className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500" placeholder="Explain what you built, your approach and key decisions" />
              </div>

              {submitted ? (
                <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 font-semibold text-emerald-700">
                  Project submitted successfully. Your mentor can now review it.
                </div>
              ) : (
                <button
                  onClick={() => setSubmitted(true)}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-bold text-white"
                >
                  <Upload size={17} /> Submit Project
                </button>
              )}
            </section>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
