import { Children } from "react";
import { BookOpen, ChevronDown, FolderOpen, Monitor } from "lucide-react";
import "./CourseEssentials.css";
export default function CourseEssentials({ course, lessons, outcomes, requirements, children }) {
 const audience = course.targetAudience?.length ? course.targetAudience.join("  /  ") : "Students and professionals building new skills.";
 const detailRows = [
  ["Learning resources", "Materials and access to support your learning."],
  ["Learning outcomes", "The practical skills covered by your course."],
  ["Course at a glance", "Course structure, format and experience level."],
  ["Certificate pathway", "Subject to course completion requirements."],
  ["Course instructor", course.instructor?.name || "Your course learning team."],
  ["Requirements", "What to prepare before you start."],
  ["Tags", "Topics and tools covered in this course."],
  ["Target audience", "Who this learning path is suited to."],
 ];
 const steps = [
  ["Learn",`${lessons} guided lessons & activities, with course learning resources.`],
  ["Apply",outcomes?.length ? outcomes.slice(0,2).join("  /  ") : "Put your learning into practice through course activities."],
  ["Prepare",requirements?.length ? requirements.slice(0,2).join("  /  ") : "A laptop, internet access and willingness to practice."],
  ["Your fit",audience],
 ];
 return <section className="course-essentials" aria-labelledby="essentials-title" id="course-resources">
  <header className="essentials-heading"><span><i/>Resources &amp; Course Details</span><small>{course.title}</small></header>
  <div className="essentials-grid"><div className="essentials-intro"><span className="atlas-eyebrow">YOUR LEARNING ESSENTIALS</span><h2 id="essentials-title">A clear path.<br/>The right resources.</h2><p>Explore the learning resources, practical skills and course details that help you prepare for your next step.</p></div>
  <ol className="essentials-steps">{steps.map(([title,text],i)=><li key={title}><span>{String(i+1).padStart(2,"0")}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol>
  <div className="essentials-visual"><div className="essentials-folder" aria-hidden="true"><div className="essentials-sheet sheet-lessons"><b>Lessons</b><i/><i/><i/></div><div className="essentials-sheet sheet-resources"><b>Resources</b><i/><i/><i/></div><div className="essentials-sheet sheet-projects"><b>Practice</b><i/><i/><i/></div><div className="essentials-folder-front"><FolderOpen size={28}/><strong>CABROY</strong></div></div><div className="essentials-access"><Monitor size={22}/><div><b>Access through your student dashboard.</b><p>Purchased course downloads open with Start Learning.</p></div></div></div></div>
  <details className="essentials-complete"><summary><BookOpen size={18}/>View complete course details<ChevronDown size={18}/></summary><div className="guided-details-layout"><div className="guided-details-rows">{Children.toArray(children).map((child,index) => <details className="guided-detail-row" key={detailRows[index]?.[0] || index} open={index < 2}><summary><span className="guided-row-number">{String(index+1).padStart(2,"0")}</span><b>{detailRows[index]?.[0] || "Course details"}</b><span className="guided-row-description">{detailRows[index]?.[1]}</span><ChevronDown size={17}/></summary><div className="guided-row-body">{child}</div></details>)}</div><aside className="guided-course-guide"><span className="guided-guide-eyebrow">YOUR COURSE GUIDE</span><h3>Know your course<br/>before you begin.</h3><p>Explore the details that matter to your next step.</p><div className="guided-mini-folder" aria-hidden="true"><div><i/><i/><i/></div><span><FolderOpen size={32}/></span></div><div className="guided-guide-note"><BookOpen size={18}/><p>Expand a section to explore the details.</p></div></aside></div></details>
 </section>;
}
