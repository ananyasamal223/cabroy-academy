import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, ClipboardCheck, FileText, Map, Target, X } from "lucide-react";
import "./HomeCareerResources.css";

const resources = [
  { id: "resume", icon: FileText, title: "Free Resume Assessment", text: "Discover how recruiters might evaluate your profile.", cta: "Get My Resume Reviewed" },
  { id: "readiness", icon: ClipboardCheck, title: "Career Readiness Test", text: "Identify your strengths and skill gaps.", cta: "Check My Career Readiness" },
  { id: "challenge", icon: Target, title: "Free Industry Project Challenge", text: "Experience practical learning before enrolling.", cta: "Take the Free Challenge" },
  { id: "roadmap", icon: Map, title: "Personalised Career Roadmap", text: "Discover the skills and career paths that fit your goals.", cta: "Get My Career Roadmap" },
];

const readiness = [
  ["I can name the role I want to apply for.", "Pick one role and compare three job descriptions."],
  ["I can show a project relevant to that role.", "Complete a project and capture the work in a case study."],
  ["My resume explains what I delivered.", "Rewrite your key bullets around actions and measurable outcomes."],
  ["I can talk through my project decisions in an interview.", "Practice explaining the goal, your decisions, and the result aloud."],
];

const paths = {
  "Digital Marketing": ["Audience research and campaign metrics", "Draft a campaign brief with a creative concept and measurement plan"],
  "Data Analytics": ["Spreadsheets, SQL, and data visualisation", "Build a small dashboard and explain one business decision it supports"],
  "AI Automation": ["Workflow mapping, prompts, and output validation", "Automate a repeatable task and test it against real examples"],
};

function CareerTool({ resource, onClose }) {
  const dialog = useRef(null);
  const title = useId();
  const [result, setResult] = useState(null);

  useEffect(() => {
    const previous = document.activeElement;
    const element = dialog.current;
    element.showModal();
    return () => { element.close(); previous?.focus(); };
  }, []);

  function evaluate(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (resource.id === "resume") {
      const resume = data.get("resume");
      setResult({
        title: "Resume feedback",
        items: [
          /\b(experience|projects?)\b/i.test(resume) ? "An experience or projects section is visible." : "Add an Experience or Projects section with clear examples.",
          /\d+(?:\.\d+)?\s*(?:%|hours?|days?|users?|clients?|leads?|projects?)/i.test(resume) ? "A measurable result is visible." : "Where possible, quantify a result with a count, percentage, or time saved.",
          "Tailor your skills and strongest project to the role you’re applying for.",
        ],
      });
    } else if (resource.id === "readiness") {
      const checked = data.getAll("ready");
      const gaps = readiness.filter((_, index) => !checked.includes(String(index)));
      setResult({ title: `${checked.length} of ${readiness.length} readiness checks complete`, items: gaps.length ? gaps.map(([, advice]) => advice) : ["Practice with a mock interview and start tracking suitable applications."] });
    } else {
      const [skills, project] = paths[data.get("track")];
      const startingPoint = data.get("level") === "starting" ? "Start with the fundamentals" : "Review your existing skills and fill the gaps";
      setResult({ title: `${data.get("track")} roadmap`, items: [`${startingPoint}: ${skills}.`, `${project}.`, "Publish a short case study and practice explaining your decisions in an interview."] });
    }
  }

  return <dialog ref={dialog} className="cab-counselling cab-career-tool" aria-labelledby={title} onCancel={onClose}
    onClick={(event) => { if (event.target === dialog.current) onClose(); }}>
    <div className="cab-counselling-content">
      <button type="button" className="cab-counselling-close" aria-label="Close career tool" onClick={onClose}><X size={20} aria-hidden="true" /></button>
      <h2 id={title}>{resource.title}</h2>
      {resource.id === "challenge" ? <>
        <p>Plan a launch campaign for a neighbourhood cafe introducing an online ordering service.</p>
        <ol>
          <li>Define one audience and one campaign goal.</li>
          <li>Choose a marketing channel and draft one ad.</li>
          <li>Pick two metrics and explain how you’ll use them to improve the campaign.</li>
        </ol>
        <p>Put your work on one page with a short explanation of your choices.</p>
      </> : <form className="cab-career-tool-form" onSubmit={evaluate}>
        {resource.id === "resume" && <label>Resume text
          <textarea name="resume" rows={6} minLength={20} maxLength={12000} required placeholder="Paste your resume text. You can leave out contact details." />
          <small>Get an automated checklist. Your text stays in this browser session.</small>
        </label>}
        {resource.id === "readiness" && <fieldset><legend>Select the statements that apply to you</legend>
          {readiness.map(([statement], index) => <label key={statement}><input type="checkbox" name="ready" value={index} /> {statement}</label>)}
        </fieldset>}
        {resource.id === "roadmap" && <>
          <label>Career interest<select name="track">{Object.keys(paths).map((path) => <option key={path}>{path}</option>)}</select></label>
          <label>Experience<select name="level"><option value="starting">Just getting started</option><option value="experience">I have some experience</option></select></label>
        </>}
        <button className="cab-btn" type="submit">{resource.cta}</button>
      </form>}
      {result && <section className="cab-career-tool-result" aria-live="polite">
        <h3>{result.title}</h3><ul>{result.items.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>}
    </div>
  </dialog>;
}

export default function HomeCareerResources() {
  const [current, setCurrent] = useState(null);
  const openRoadmap = () => setCurrent(resources.find(({ id }) => id === "roadmap"));
  return <section className="cab-section cab-career-resources" aria-labelledby="career-resources-title">
    <div className="cab-shell">
      <div className="cab-career-resources-banner">
        <h2 id="career-resources-title">From Your First Project to Your Next Career Breakthrough.</h2>
        <p>Build industry-relevant skills, gain practical experience and unlock new career opportunities with expert guidance.</p>
        <ul><li>Career Counselling</li><li>Real-World Projects</li><li>Industry Mentorship</li><li>Professional Portfolio</li></ul>
        <div className="cab-career-resources-actions">
          <button type="button" className="cab-btn" onClick={openRoadmap}>Get My Career Roadmap <ArrowRight size={17} aria-hidden="true" /></button>
          <a href="#sample-campaign-project">Explore a Sample Project</a>
        </div>
      </div>
      <div className="cab-career-resources-grid">{resources.map((resource) => (
        <article key={resource.id}>
          <resource.icon size={24} aria-hidden="true" />
          <h3>{resource.title}</h3><p>{resource.text}</p>
          <button type="button" onClick={() => setCurrent(resource)}>{resource.cta} <ArrowRight size={15} aria-hidden="true" /></button>
        </article>
      ))}</div>
    </div>
    {current && <CareerTool key={current.id} resource={current} onClose={() => setCurrent(null)} />}
  </section>;
}
