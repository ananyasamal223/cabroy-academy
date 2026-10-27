import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ImagePlus, Save, ArrowUpRight, Plus, X, FileSpreadsheet, Layers3, ArrowUp, ArrowDown, Trash2, FileText, CheckCircle2, Circle } from "lucide-react";
import api from "../api/client";
import CourseAccess from "./CourseAccess";
import CourseProjects from "./CourseProjects";
import { prepareCourseProjects } from "./courseProjectFields.js";
import "./Courses.css";
import "./CourseWorkspace.css";
const blank = { accessOptions: ["individual"], title: "", category: "", shortDescription: "", description: "", price: "", originalPrice: "", duration: "", level: "Beginner", thumbnail: "", skills: [], requirements: [], modules: [], curriculum: [], projects: [], materialUrl: "" };
const origin = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
export default function CourseCreation() {
  const [form, setForm] = useState(blank);
  const [courses, setCourses] = useState([]);
  const [id, setId] = useState("");
  const [published, setPublished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [dirty, setDirty] = useState(false);
  useEffect(() => { api.get("/courses?published=all").then(({ data }) => setCourses(data.courses || [])).catch(() => setError("Could not load existing courses. Reload to try again.")); }, []);
  useEffect(() => { const warn = event => { if (dirty) { event.preventDefault(); event.returnValue = ""; } }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [dirty]);
  const update = (key, value) => { setForm(previous => ({ ...previous, [key]: value })); setDirty(true); setMessage(""); };
  async function selectCourse(value) {
    if (dirty && !window.confirm("Discard unsaved changes?")) return;
    setError(""); setMessage("");
    if (!value) { setForm(blank); setId(""); setPublished(false); setDirty(false); return; }
    setBusy(true);
    try { const [{ data }, materials] = await Promise.all([api.get(`/courses/${value}`), api.get(`/courses/${value}/materials`)]); setForm({ ...blank, ...data.course, price: data.course.price ?? "", originalPrice: data.course.originalPrice ?? "", curriculum: data.course.curriculum?.length ? data.course.curriculum : (data.course.modules || []).map(title => ({ title, submodules: [] })), materialUrl: materials.data.url || "" }); setId(value); setPublished(data.course.isPublished); setDirty(false); }
    catch (err) { setError(err.response?.data?.message || "Could not open this course."); } finally { setBusy(false); }
  }
  async function upload(event) {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) { setError("Choose a PNG, JPG or WEBP image under 2 MB."); return; }
    setUploading(true); setError("");
    try { const body = new FormData(); body.append("file", file); const { data } = await api.post("/uploads", body); update("thumbnail", data.file.url); } catch { setError("Image upload failed. Please try again."); } finally { setUploading(false); }
  }
  async function save(event) {
    event.preventDefault();
    if (busy || uploading) return;
    const publish = event.nativeEvent.submitter?.value === "publish";
    setError(""); setMessage("");
    if (!form.accessOptions.length) { setError("Select at least one course access option."); return; }
    if (!form.title.trim()) { setError("Enter a course title before saving."); return; }
    if (publish && (!form.category || !form.shortDescription.trim() || !form.description.trim() || !form.thumbnail || !form.materialUrl.trim() || form.price === "")) { setError("Publishing requires a category, both descriptions, thumbnail, price and resource link."); return; }
    if (form.materialUrl && !/^https:\/\//i.test(form.materialUrl.trim())) { setError("Use a secure https:// resource link."); return; }
    if (Number(form.price) < 0 || (form.originalPrice !== "" && Number(form.originalPrice) < Number(form.price))) { setError("Prices must be positive, and the original price cannot be lower than the selling price."); return; }
    if (form.curriculum.some(module => !module.title.trim() || module.submodules.some(title => !title.trim()))) { setError("Enter a title for each module and submodule, or remove empty entries."); return; }
    const curriculum = form.curriculum.map(module => ({ title: module.title.trim(), submodules: module.submodules.map(title => title.trim()) }));
    let projects;
    try { projects = prepareCourseProjects(form.projects, form.curriculum.length); } catch (err) { setError(err.message); return; }
    setBusy(true);
    try {
      const payload = { accessOptions: form.accessOptions, title: form.title.trim(), category: form.category || "General", shortDescription: form.shortDescription.trim(), description: form.description.trim(), price: Number(form.price) || 0, originalPrice: form.originalPrice === "" ? null : Number(form.originalPrice), duration: form.duration, level: form.level, thumbnail: form.thumbnail, skills: form.skills, requirements: form.requirements, modules: curriculum.map(module => module.title), curriculum, projects, materialUrl: form.materialUrl.trim(), isPublished: publish };
      if (!id) payload.slug = `${form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "course"}-${crypto.randomUUID().slice(0, 8)}`;
      const { data } = await (id ? api.patch(`/courses/${id}`, payload) : api.post("/courses", payload));
      setId(data.course._id); setPublished(publish); setDirty(false); setCourses(previous => [data.course, ...previous.filter(course => course._id !== data.course._id)]); setMessage(publish ? "Course published successfully." : "Draft saved successfully.");
    } catch (err) { setError(err.response?.data?.message || "Could not save the course. Your changes are still here."); } finally { setBusy(false); }
  }
  const field = (key, label, type = "text", placeholder = "") => <label>{label}<input type={type} value={form[key]} onChange={event => update(key, event.target.value)} placeholder={placeholder} min={type === "number" ? 0 : undefined} step={type === "number" ? "0.01" : undefined} /></label>;
  let projectsReady = form.projects.length > 0;
  try { prepareCourseProjects(form.projects, form.curriculum.length); } catch { projectsReady = false; }
  const essentialChecks = [
    { label: "Course cover", done: Boolean(form.thumbnail), href: "#course-cover" },
    { label: "Resource link", done: /^https:\/\//i.test(form.materialUrl.trim()), href: "#course-materials" },
  ];
  const checklist = [
    { label: "01. Course information", done: Boolean(form.title.trim() && form.category && form.shortDescription.trim() && form.description.trim()) && essentialChecks.every(item => item.done), href: "#course-basics", checks: essentialChecks },
    { label: "02. Learning outcomes", done: form.skills.length > 0 && form.skills.every(item => item.trim()), href: "#course-outcomes" },
    { label: "03. Curriculum", done: form.curriculum.length > 0 && form.curriculum.every(module => module.title.trim() && module.submodules.every(title => title.trim())), href: "#course-curriculum" },
    { label: "04. Projects & assignments", done: projectsReady, href: "#course-projects" },
    { label: "05. Pricing & details", done: form.price !== "", href: "#course-pricing" },
    { label: "06. Course access", done: form.accessOptions.length > 0, href: "#course-access" },
  ];
  return <div className="ce-page"><header className="ce-heading"><div><span className="ce-eyebrow">COURSE WORKSPACE</span><h1>{id ? "Edit course" : "Create a course"}</h1><p>Turn your expertise into a learning experience. Start with the essentials, then build the journey.</p></div><Link to="/admin">Back to dashboard <ArrowUpRight size={17} /></Link></header>
    <div className="ce-switch"><label>Course library<select value={id} onChange={event => selectCourse(event.target.value)} disabled={busy || uploading}><option value="">+ Create a new course</option>{courses.map(course => <option key={course._id} value={course._id}>{course.title} ({course.isPublished ? "Published" : "Draft"})</option>)}</select></label><span className={`ce-badge ${published ? "live" : ""}`}>{dirty ? "Unsaved changes" : published ? "Published" : "Draft"}</span></div>
    <nav className="ce-section-nav" aria-label="Course sections"><a href="#course-basics"><span>01</span> Essentials</a><a href="#course-outcomes"><span>02</span> Learning outcomes</a><a href="#course-curriculum"><span>03</span> Curriculum</a><a href="#course-projects"><span>04</span> Projects & assignments</a><a href="#course-pricing"><span>05</span> Pricing</a><a href="#course-access"><span>06</span> Course access</a></nav><form onSubmit={save}>{error && <div className="ce-error" role="alert">{error}</div>}{message && <div className="ce-success" role="status">{message}</div>}<fieldset disabled={busy || uploading} className="ce-grid"><div className="ce-main"><section className="ce-card" id="course-basics"><h2><span>01</span> Basic information</h2><p className="ce-section-description">Introduce your course with a compelling title and a clear description.</p><div className="ce-fields">{field("title", "Course title", "text", "e.g. Digital Marketing Mastery")}<label>Category<select value={form.category} onChange={event => update("category", event.target.value)}><option value="">Choose a category</option>{[...new Set(["Digital Marketing", "Data Analytics", "AI & Automation", "Design", "Business", ...(form.category ? [form.category] : [])])].map(value => <option key={value}>{value}</option>)}</select></label></div><label>Short description<textarea rows={2} maxLength={160} value={form.shortDescription} onChange={event => update("shortDescription", event.target.value)} placeholder="A clear summary of what this course offers" /><small className="ce-counter">{form.shortDescription.length}/160</small></label><label>Full description<textarea rows={5} value={form.description} onChange={event => update("description", event.target.value)} placeholder="Describe the course, who it is for, and what learners will receive." /></label></section>
    <section className="ce-card" id="course-outcomes"><h2><span>02</span> Learning outcomes</h2><p className="ce-section-description">Help learners understand what they will achieve and what they need to begin.</p><div className="ce-fields"><ListEditor label="Learning outcomes" items={form.skills} onChange={items => update("skills", items)} /><ListEditor label="Requirements" items={form.requirements} onChange={items => update("requirements", items)} /></div></section>
    <CurriculumEditor modules={form.curriculum} onChange={items => update("curriculum", items)} /><CourseProjects projects={form.projects} modules={form.curriculum} onChange={items => update("projects", items)} /><section className="ce-card" id="course-pricing"><h2><span>05</span> Pricing & details</h2><p className="ce-section-description">Set the value, access duration, and experience level for your course.</p><div className="ce-fields">{field("price", "Selling price (INR)", "number", "0.00")}{field("originalPrice", "Original price (optional)", "number", "0.00")}{field("duration", "Duration / access details", "text", "e.g. Self-paced")}<label>Level<select value={form.level} onChange={event => update("level", event.target.value)}>{[...new Set(["Beginner", "Intermediate", "Advanced", "All levels", form.level])].map(value => <option key={value}>{value}</option>)}</select></label></div></section><CourseAccess stepNumber="06" value={form.accessOptions} onChange={value => update("accessOptions", value)} /></div>
    <aside className="ce-aside"><section className="ce-card" id="course-cover"><h2><ImagePlus size={20} /> Course thumbnail</h2><div className="ce-image">{form.thumbnail ? <img src={form.thumbnail.startsWith("/") && !form.thumbnail.startsWith("/uploads/") ? form.thumbnail : form.thumbnail.startsWith("/") ? origin + form.thumbnail : form.thumbnail} alt="Course thumbnail preview" /> : <><ImagePlus size={34} /><span>Add a course cover</span></>}</div><label className="ce-upload">{uploading ? "Uploading..." : form.thumbnail ? "Replace image" : "Choose image"}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={upload} /></label>{form.thumbnail && <button type="button" className="ce-text-button" onClick={() => update("thumbnail", "")}>Remove image</button>}<p className="ce-note">PNG, JPG or WEBP. Up to 2 MB.</p></section>
    <section className="ce-card" id="course-materials"><h2><FileSpreadsheet size={20} /> Course materials</h2><p className="ce-note">Add the Google Sheet or download link enrolled students should open.</p>{field("materialUrl", "Resource link", "url", "https://docs.google.com/spreadsheets/...")}<p className="ce-note">Check the file's sharing settings before publishing. Learning progress is not tracked for external materials.</p></section><section className="ce-card ce-publish-check"><div className="ce-check-heading"><h2>Publishing checklist</h2><span>{checklist.filter(item => item.done).length}/{checklist.length}</span></div><p className="ce-note">A few essentials before your course goes live.</p><ul>{checklist.map(item => <li key={item.label}><a href={item.href} className={item.done ? "is-complete" : ""}>{item.done ? <CheckCircle2 size={17} /> : <Circle size={17} />}<span>{item.label}</span><ArrowUpRight size={14} /></a>{item.checks && <ul className="ml-5">{item.checks.map(check => <li key={check.label}><a href={check.href} className={check.done ? "is-complete" : ""}>{check.done ? <CheckCircle2 size={14} /> : <Circle size={14} />}<span>{check.label}</span><ArrowUpRight size={12} /></a></li>)}</ul>}</li>)}</ul></section></aside></fieldset>
    <footer className="ce-savebar"><span>{busy ? "Saving your course..." : dirty ? "You have unsaved changes" : id ? "All changes saved" : "Start building your course"}</span><div><button type="button" className="ce-secondary" disabled={busy || uploading} onClick={() => selectCourse("")}>New course</button><button type="submit" value="draft" className="ce-secondary" disabled={busy || uploading}><Save size={16} />{published ? "Unpublish & save draft" : "Save draft"}</button><button type="submit" value="publish" className="ce-primary" disabled={busy || uploading}>{published ? "Save published course" : "Publish course"}<ArrowUpRight size={17} /></button></div></footer></form></div>;
}
function ListEditor({ label, items, onChange }) {
  const [value, setValue] = useState("");
  const add = () => { const text = value.trim(); if (text && !items.includes(text)) onChange([...items, text]); setValue(""); };
  return <div className="ce-list"><label>{label}<div className="ce-list-input"><input value={value} onChange={event => setValue(event.target.value)} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); add(); } }} placeholder="Type an item and press Enter" /><button type="button" onClick={add} aria-label={`Add to ${label}`}><Plus size={18} /></button></div></label>{items.length ? <ul>{items.map((text, index) => <li key={`${text}-${index}`}><span>{text}</span><button type="button" aria-label={`Remove ${text}`} onClick={() => onChange(items.filter((_, i) => i !== index))}><X size={15} /></button></li>)}</ul> : <p className="ce-note">No items added yet.</p>}</div>;
}
function CurriculumEditor({ modules, onChange }) {
  const edit = (index, patch) => onChange(modules.map((module, i) => i === index ? { ...module, ...patch } : module));
  const move = (index, direction) => { const next = [...modules]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; onChange(next); };
  const remove = index => { if ((modules[index].title || modules[index].submodules.some(Boolean)) && !window.confirm("Remove this module and its submodules?")) return; onChange(modules.filter((_, i) => i !== index)); };
  const totalSubmodules = modules.reduce((sum, module) => sum + module.submodules.length, 0);
  return <section className="ce-card ce-curriculum" id="course-curriculum">
    <div className="ce-curriculum-heading"><div><h2><span>03</span> Course curriculum</h2><p className="ce-section-description">A clear path from the first lesson to the final outcome.</p></div><span className="ce-curriculum-icon"><Layers3 size={24} /></span></div>
    <div className="ce-curriculum-toolbar"><div><span><Layers3 size={15} /><strong>{modules.length}</strong> modules</span><span><FileText size={15} /><strong>{totalSubmodules}</strong> submodules</span></div><span className="ce-toolbar-note">Build in learning order</span></div>
    {!modules.length && <div className="ce-empty"><div className="ce-empty-art"><span><FileText size={22} /></span><span><BookOpen size={30} /></span><span><Layers3 size={22} /></span></div><h3>Every great course starts with a plan</h3><p>Create a module for each main idea, then add<br className="ce-desktop-break" /> submodules to guide learners step by step.</p><button type="button" className="ce-primary" onClick={() => onChange([{ title: "", submodules: [] }])}><Plus size={17} /> Create your first module</button><small>For example: Getting started → Tools & setup → First project</small></div>}
    <div className="ce-module-list">{modules.map((module, index) => <article className="ce-module" key={index}>
      <div className="ce-module-top"><div className="ce-module-identity"><span className="ce-module-number">{String(index + 1).padStart(2, "0")}</span><div><strong>MODULE {String(index + 1).padStart(2, "0")}</strong><span>{module.submodules.length} {module.submodules.length === 1 ? "submodule" : "submodules"}</span></div></div><div className="ce-module-actions"><button type="button" disabled={index === 0} onClick={() => move(index, -1)} title="Move module up" aria-label={`Move module ${index + 1} up`}><ArrowUp size={16} /></button><button type="button" disabled={index === modules.length - 1} onClick={() => move(index, 1)} title="Move module down" aria-label={`Move module ${index + 1} down`}><ArrowDown size={16} /></button><span className="ce-action-divider" /><button type="button" className="ce-remove" title="Remove module" aria-label={`Remove module ${index + 1}`} onClick={() => remove(index)}><Trash2 size={16} /></button></div></div>
      <div className="ce-module-body"><label>Module title<input value={module.title} placeholder="e.g. Digital marketing fundamentals" onChange={event => edit(index, { title: event.target.value })} /></label>
      <div className="ce-submodules"><div className="ce-subheading"><span>SUBMODULES</span><span>Topics within this module</span></div>{!module.submodules.length && <p className="ce-submodule-hint">Break this module into smaller, focused lessons.</p>}{module.submodules.map((title, subIndex) => <div className="ce-submodule" key={subIndex}><span className="ce-submodule-number">{index + 1}.{subIndex + 1}</span><FileText size={16} className="ce-topic-icon" /><input aria-label={`Module ${index + 1}, submodule ${subIndex + 1} title`} value={title} placeholder="Give this submodule a title" onChange={event => edit(index, { submodules: module.submodules.map((item, i) => i === subIndex ? event.target.value : item) })} /><button type="button" className="ce-remove" title="Remove submodule" aria-label={`Remove submodule ${index + 1}.${subIndex + 1}`} onClick={() => edit(index, { submodules: module.submodules.filter((_, i) => i !== subIndex) })}><X size={16} /></button></div>)}<button type="button" className="ce-add-submodule" onClick={() => edit(index, { submodules: [...module.submodules, ""] })}><Plus size={16} /> Add submodule</button></div></div>
    </article>)}</div>
    {modules.length > 0 && <button type="button" className="ce-add-module" onClick={() => onChange([...modules, { title: "", submodules: [] }])}><span><Plus size={19} /></span><div>Add another module<small>Continue building your course curriculum</small></div><Plus size={18} /></button>}
  </section>;
}
