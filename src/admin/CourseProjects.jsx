import { Plus, Trash2, FolderKanban } from "lucide-react";
import "./CourseProjects.css";
const newProject = () => ({ title: "", problemStatement: "", deliverables: [], resourceLinks: [], submissionRequirements: { projectLink: true, description: true, githubLink: false, additionalLink: false, supportingFile: false }, availability: "after_purchase", unlockModuleIndex: null, deadlineType: "relative", deadlineDays: 14, fixedDeadline: "", timerHours: null, reviewCriteria: "", requiredForCertificate: false });
const localDate = value => {
 if (!value) return "";
 const date = new Date(value);
 if (Number.isNaN(date.getTime())) return "";
 return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
export default function CourseProjects({ projects = [], modules = [], onChange }) {
 const edit = (index, patch) => onChange(projects.map((project, i) => i === index ? { ...project, ...patch } : project));
 const remove = index => { if (projects[index].title && !window.confirm("Remove this course project?")) return; onChange(projects.filter((_, i) => i !== index)); };
 return <section id="course-projects" className="ce-card ce-projects" aria-labelledby="course-projects-title">
  <h2 id="course-projects-title"><span>04</span><FolderKanban size={21} />Projects & Assignments</h2>
  <p className="ce-section-description">Define optional projects for this course, including instructions, deliverables and review requirements.</p>
  {!projects.length && <div className="ce-project-empty"><FolderKanban size={30} /><strong>No projects added yet</strong><p>Add one or more practical projects, or leave this step empty.</p></div>}
  <div className="ce-project-list">{projects.map((project, index) => <article key={project._id || index} className="ce-project-item">
   <div className="ce-project-heading"><h3>Project {index + 1}</h3><button type="button" className="ce-secondary" aria-label={`Remove project ${index + 1}`} onClick={() => remove(index)}><Trash2 size={16} />Remove</button></div>
   <label>Project title<input value={project.title} onChange={e => edit(index, { title: e.target.value })} placeholder="e.g. SEO Campaign Project" maxLength={200} /></label>
   <label>Problem statement<textarea rows={3} value={project.problemStatement} onChange={e => edit(index, { problemStatement: e.target.value })} placeholder="Explain what the student should build or solve." /></label>
   <div className="ce-fields">
    <label>Deliverables<textarea rows={4} value={(project.deliverables || []).join("\n")} onChange={e => edit(index, { deliverables: e.target.value.split("\n") })} placeholder={'One deliverable per line\nKeyword research document\nFinal campaign report'} /></label>
    <label>Resource links<textarea rows={4} value={(project.resourceLinks || []).join("\n")} onChange={e => edit(index, { resourceLinks: e.target.value.split("\n") })} placeholder="One HTTPS link per line for instructions, templates or examples." /></label>
   </div>
   <fieldset className="ce-project-requirements"><legend>Required submission fields</legend>{[["projectLink", "Project / Drive / live link"], ["description", "Project description"], ["githubLink", "GitHub repository link"], ["additionalLink", "Additional link"], ["supportingFile", "Supporting file"]].map(([key,label]) => <label key={key}><input type="checkbox" checked={Boolean(project.submissionRequirements?.[key])} onChange={e => edit(index, { submissionRequirements: { ...project.submissionRequirements, [key]: e.target.checked } })} />{label}</label>)}</fieldset>
   <div className="ce-fields">
    <label>Availability<select value={project.availability} onChange={e => edit(index, { availability: e.target.value, unlockModuleIndex: e.target.value === "after_module" ? 0 : null })}><option value="after_purchase">Immediately after purchase</option><option value="after_module" disabled={!modules.length}>After completing a module</option></select></label>
    {project.availability === "after_module" && <label>Unlock after module<select value={project.unlockModuleIndex ?? ""} onChange={e => edit(index, { unlockModuleIndex: Number(e.target.value) })}><option value="" disabled>Choose a module</option>{modules.map((module,i) => <option key={i} value={i}>Module {i + 1}: {module.title || "Untitled module"}</option>)}</select></label>}
    <label>Deadline<select value={project.deadlineType} onChange={e => edit(index, { deadlineType: e.target.value })}><option value="relative">Days after enrollment</option><option value="fixed">Fixed date and time</option><option value="none">No deadline</option></select></label>
    {project.deadlineType === "relative" && <label>Days after enrollment<input type="number" min="1" step="1" value={project.deadlineDays ?? 14} onChange={e => edit(index, { deadlineDays: e.target.value })} /></label>}
    {project.deadlineType === "fixed" && <label>Deadline date and time (your local time)<input type="datetime-local" value={localDate(project.fixedDeadline)} onChange={e => edit(index, { fixedDeadline: e.target.value })} /></label>}
   </div>
   <label className="ce-project-checkbox"><input type="checkbox" checked={project.timerHours != null} onChange={e => edit(index, { timerHours: e.target.checked ? 10 : null })} />Enable a timer after the student starts</label>
   {project.timerHours != null && <label>Timer duration (hours)<input type="number" min="0.25" step="0.25" value={project.timerHours} onChange={e => edit(index, { timerHours: e.target.value })} /></label>}
   <label>Review criteria<textarea rows={3} value={project.reviewCriteria || ""} onChange={e => edit(index, { reviewCriteria: e.target.value })} placeholder="Describe what the mentor should check before approving." /></label>
   <label className="ce-project-checkbox"><input type="checkbox" checked={Boolean(project.requiredForCertificate)} onChange={e => edit(index, { requiredForCertificate: e.target.checked })} />Passing this project is required for the certificate</label>
  </article>)}</div>
  <button type="button" className="ce-secondary" onClick={() => onChange([...projects,newProject()])}><Plus size={17} />Add project</button>
 </section>;
}
