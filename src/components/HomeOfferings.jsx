import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, MessageSquare, Target, Search, PencilRuler, BarChart3, FolderCheck, Sparkles } from "lucide-react";
import "./HomeOfferings.css";

const tasks = [
  { icon: Search, title: "Research your audience", detail: "Find the people behind the numbers", number: "01" },
  { icon: PencilRuler, title: "Create your campaign", detail: "Turn your strategy into compelling content", number: "02" },
  { icon: BarChart3, title: "Measure what matters", detail: "Analyse results and share your insights", number: "03" },
];

export default function HomeOfferings() {
  const sceneRef = useRef(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    if (!("IntersectionObserver" in window)) { setRevealed(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setRevealed(true); observer.disconnect(); }
    }, { threshold: .15 });
    if (sceneRef.current) observer.observe(sceneRef.current);
    return () => observer.disconnect();
  }, []);
  const moveScene = (event) => {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const scene = sceneRef.current;
    const bounds = scene.getBoundingClientRect();
    scene.style.setProperty("--project-rotate-y", `${((event.clientX - bounds.left) / bounds.width - .5) * 8}deg`);
    scene.style.setProperty("--project-rotate-x", `${(.5 - (event.clientY - bounds.top) / bounds.height) * 6}deg`);
  };
  const resetScene = () => {
    sceneRef.current?.style.setProperty("--project-rotate-y", "0deg");
    sceneRef.current?.style.setProperty("--project-rotate-x", "0deg");
  };
  return (
    <section className="cab-section cab-project-lab" aria-labelledby="project-lab-title">
      <div className="cab-shell cab-project-lab-grid">
        <div className="cab-project-lab-copy">
          <span className="cab-eyebrow">LEARNING, PUT INTO PRACTICE</span>
          <h2 id="project-lab-title">Build real projects.<br /><span>Create your portfolio.</span></h2>
          <p>Go from understanding a concept to putting it to work. Bring your skills together through practical projects, with guidance along the way.</p>
          <div className="cab-project-lab-points">
            <span><Check aria-hidden="true" /> Apply what you learn</span>
            <span><Check aria-hidden="true" /> Learn from mentor feedback</span>
            <span><Check aria-hidden="true" /> Build work you can showcase</span>
          </div>
          <Link className="cab-btn" to="/courses">Explore Project-Based Courses <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
        <div className={`cab-project-canvas cab-project-sequence${revealed ? " is-revealed" : ""}`} ref={sceneRef} onPointerMove={moveScene} onPointerLeave={resetScene} aria-label="Example marketing project workflow">
          <svg className="cab-project-connectors" viewBox="0 0 600 620" preserveAspectRatio="none" fill="none" aria-hidden="true">
            <path d="M280 72V105M280 237V265Q280 285 310 285H460Q480 285 480 310V475M280 237V255Q280 285 220 285H145Q115 285 115 320V360" pathLength="100" stroke="#98c6e5" strokeWidth="1.5" />
            <path d="M145 410V490Q145 515 185 515H330" pathLength="100" stroke="#98c6e5" strokeWidth="1.5" strokeDasharray="4 5" />
            <g fill="white" stroke="#98c6e5" strokeWidth="2"><circle cx="280" cy="72" r="4"/><circle cx="280" cy="237" r="4"/><circle cx="480" cy="475" r="4"/></g>
          </svg>
          <div className="cab-project-chip"><span><Sparkles size={14} aria-hidden="true" /></span><b>Your next portfolio piece</b><small>PROJECT PREVIEW</small></div>
          <article className="cab-project-brief">
            <span className="cab-project-kicker">THE CHALLENGE</span>
            <h3>Launch a marketing campaign</h3>
            <p>One brief. Your ideas. A practical plan.</p>
            <div className="cab-project-tool-row"><span>YOUR TOOLKIT</span>{[["Google Ads", "google-ads"], ["Meta Ads", "meta-ads"], ["Google Analytics", "google-analytics"]].map(([name, file]) => <img key={file} src={`/course-icons/${file}.svg`} alt={name} title={name} />)}</div>
          </article>
          <div className="cab-project-feedback"><MessageSquare size={17} aria-hidden="true" /><div><b>Mentor feedback</b><small>A fresh perspective, when you need it</small></div></div>
          <div className="cab-project-task-stack"><span className="cab-project-kicker">MAKE IT HAPPEN</span>{tasks.map(({icon: TaskIcon, title, detail, number}) => <article className="cab-project-task" key={number}><span className="cab-project-task-icon"><TaskIcon size={17} aria-hidden="true" /></span><div><h4>{title}</h4><p>{detail}</p></div><small>{number}</small></article>)}</div>
          <article className="cab-project-outcome"><span className="cab-project-outcome-icon"><FolderCheck size={22} aria-hidden="true" /></span><span className="cab-project-kicker">THE TAKEAWAY</span><h3>Work worth showing.</h3><p>Bring your strategy, creative work and insights into one portfolio project.</p><span className="cab-project-outcome-tag"><Target size={12} aria-hidden="true" /> Built through practice</span></article>
          <span className="cab-project-example">Illustrative project workflow</span>
        </div>
      </div>
    </section>
  );
}
