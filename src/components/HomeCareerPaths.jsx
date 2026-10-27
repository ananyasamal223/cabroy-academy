import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Layers, Target, BarChart3, Workflow, FolderCheck, Sparkles, Briefcase } from "lucide-react";
import "./HomeCareerPaths.css";

const paths = [
  { tab: "Complete Career Path", title: "Connect your skills. Expand your possibilities.", text: "Bring marketing, data and AI together in one learning path. Build the knowledge to plan campaigns, understand results and create smarter workflows.", count: "3 complementary courses", ids: "digital-marketing,data-analytics,ai-automation", nodes: [[Target, "Digital Marketing"], [BarChart3, "Data Analytics"], [Workflow, "AI Automation"], [FolderCheck, "Practical Projects"], [Briefcase, "Portfolio Skills"]] },
  { tab: "Analytics & Automation", title: "Find the insight. Build the next step.", text: "Pair data analytics with AI automation. Learn to make sense of data, connect your tools and turn repeatable tasks into practical workflows.", count: "2 complementary courses", ids: "data-analytics,ai-automation", nodes: [[BarChart3, "Data Analytics"], [Workflow, "AI Automation"], [Layers, "Connected Tools"], [FolderCheck, "Practical Projects"], [Sparkles, "Portfolio Skills"]] },
];
export default function HomeCareerPaths() {
  const [selected, setSelected] = useState(0);
  const path = paths[selected];
  return <section className="cab-section career-paths" aria-labelledby="career-paths-title"><div className="cab-shell">
    <div className="career-paths-heading"><span className="career-paths-kicker">COURSE BUNDLES & CAREER PATHS</span><h2 id="career-paths-title">Build your own <span>advantage.</span></h2><p>Bring complementary skills together. Find the learning path that connects to your goals.</p></div>
    <div className="career-paths-tabs" role="tablist" aria-label="Learning paths">{paths.map((item, index) => <button type="button" key={item.tab} role="tab" id={`career-tab-${index}`} aria-selected={selected === index} aria-controls="career-path-panel" onClick={() => setSelected(index)} onKeyDown={(event) => { if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) { event.preventDefault(); const next = event.key === "Home" ? 0 : event.key === "End" ? paths.length - 1 : (selected + (event.key === "ArrowRight" ? 1 : -1) + paths.length) % paths.length; setSelected(next); event.currentTarget.parentElement.children[next].focus(); } }} tabIndex={selected === index ? 0 : -1}>{item.tab}</button>)}</div>
    <div className="career-paths-stage"><div className="career-paths-panel" id="career-path-panel" role="tabpanel" aria-labelledby={`career-tab-${selected}`}>
      <div className="career-paths-copy"><span className="career-paths-symbol"><Layers size={27} aria-hidden="true" /></span><span className="career-paths-count">{path.count}</span><h3>{path.title}</h3><p>{path.text}</p><Link to={`/courses?bundle=${path.ids}`} className="career-paths-link">Explore Bundle <ArrowRight size={16} aria-hidden="true" /></Link></div>
      <div className="bundle-hub-scene" key={selected} aria-label="Tools combine in your learning bundle to build projects and portfolio skills">
        <div className="bundle-hub-plane">
          <svg className="bundle-hub-wires" viewBox="0 0 600 400" fill="none" preserveAspectRatio="none" aria-hidden="true">
            <g stroke="#c3d6ef" strokeWidth="1.5" strokeDasharray="3 5"><path d="M40 60H115Q140 60 140 90V170H265M40 180H265M40 300H115Q140 300 140 270V210H265M180 350V265Q180 240 265 220M175 30V110Q175 140 265 155"/></g>
            <path d="M310 190H365Q390 190 390 165V110H450V55H565" stroke="#bad2f1" strokeWidth="2"/>
            <path className="bundle-hub-energy" d="M40 180H285M310 190H365Q390 190 390 165V110H450V55H565" pathLength="100" stroke="#3a8ff5" strokeWidth="2.5"/>
          </svg>
          {(selected === 0 ? [["google-ads", "Google Ads"], ["meta-ads", "Meta Ads"], ["power-bi", "Power BI"], ["python", "Python"], ["n8n", "n8n"]] : [["power-bi", "Power BI"], ["python", "Python"], ["sql", "SQL"], ["google-analytics", "Google Analytics"], ["n8n", "n8n"]]).map(([file, name], index) => <span className={`bundle-hub-tool bundle-hub-tool-${index+1}`} key={file}><img src={`/course-icons/${file}.svg`} alt={name} title={name} /></span>)}
          <div className="bundle-hub-core"><div className="bundle-hub-core-top"><i /><i /><span><Layers size={26} aria-hidden="true" /></span></div><b>Your Learning Bundle</b></div>
          <div className="bundle-hub-result bundle-hub-result-project"><FolderCheck size={22} aria-hidden="true" /><span>APPLY YOUR SKILLS</span><b>Build Projects</b><div className="bundle-hub-mini-bars"><i/><i/><i/><i/></div></div>
          <div className="bundle-hub-result bundle-hub-result-portfolio"><Briefcase size={22} aria-hidden="true" /><span>SHOW YOUR WORK</span><b>Create Your Portfolio</b><div className="bundle-hub-mini-lines"><i/><i/><i/></div></div>
        </div>
        <span className="bundle-hub-caption">CONNECTED SKILLS. PRACTICAL POSSIBILITIES.</span>
      </div>
    </div></div>
  </div></section>;
}
