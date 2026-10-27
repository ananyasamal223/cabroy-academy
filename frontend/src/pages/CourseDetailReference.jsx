import { courseVisual } from "../utils/courseVisuals";
import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Search, Check, ChevronDown, Play, X, ChartNoAxesColumnIncreasing, Users, Clock3, Award, Video, FileText, Infinity as InfinityIcon, Monitor, Gift, CheckCircle2 } from "lucide-react";
import { getCurriculum, courseArtwork } from "../data/courseCurriculum";
import "./CourseDetailReference.css";
import "./CourseProgramme.css";
import ReferenceProgramme from "../components/ReferenceProgramme";
import "./ReferenceCoursePage.css";
const money = n => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
const previews = { "digital-marketing": "/digital-marketing-thumbnail.jpg", "data-analytics": "/data-analytics-thumbnail.jpg", "ai-automation": "/ai-automation-thumbnail.jpg" };
function Card({ title, children }) { return <section className="cdr-card"><h2>{title}</h2>{children}</section>; }
function Row({ icon: Icon, children }) { return <li><Icon size={19}/><span>{children}</span></li>; }
export default function CourseDetailReference({ course }) {
 const curriculum = course.isBackendCourse ? course.curriculum.map(module => ({ title: module.title, lessons: (module.submodules || []).map(title => ({ title, type: "Topic" })) })) : getCurriculum(course), lessons = curriculum.reduce((n, m) => n + m.lessons.length, 0);
 const [trailer, setTrailer] = useState(false);
 const { token, loading: authLoading } = useAuth();
 const [access, setAccess] = useState({ id: null, token: null, owned: false, error: "" });
 const [accessRetry, setAccessRetry] = useState(0);
 const [downloads, setDownloads] = useState(false);
 const [resource, setResource] = useState({ loading: false, url: "", error: "" });
 useEffect(() => {
  setDownloads(false);
  setResource({ loading: false, url: "", error: "" });
  if (authLoading || !token) return;
  const controller = new AbortController();
  api.get("/enrollments/me", { signal: controller.signal }).then(({ data }) => {
   if (controller.signal.aborted) return;
   const owned = (data.enrollments || []).some(item => String(item.course?._id || item.course) === String(course.id) && ["active", "completed"].includes(item.status));
   setAccess({ id: course.id, token, owned, error: "" });
  }).catch(err => { if (!controller.signal.aborted) setAccess({ id: course.id, token, owned: false, error: err.response?.data?.message || "Could not verify course access. Please retry." }); });
  return () => controller.abort();
 }, [course.id, token, authLoading, accessRetry]);
 const accessReady = !authLoading && (!token || (access.id === course.id && access.token === token));
 const owned = Boolean(token && accessReady && access.owned && !access.error);
 async function openDownloads() {
  if (!owned) return;
  setDownloads(true);
  setResource({ loading: true, url: "", error: "" });
  try {
   const { data } = await api.get(`/courses/${encodeURIComponent(course.id)}/materials`);
   let url;
   try { url = new URL(data.url); } catch { throw new Error("Course downloads are not available yet. Please contact your instructor."); }
   if (url.protocol !== "https:") throw new Error("A valid course download link has not been configured yet.");
   setResource({ loading: false, url: url.href, error: "" });
  } catch (err) { setResource({ loading: false, url: "", error: err.response?.data?.message || err.message || "Unable to load course downloads." }); }
 }
 function courseAction() {
  if (!accessReady) return;
  if (token && access.error) { setAccess({ id: null, token: null, owned: false, error: "" }); setAccessRetry(value => value + 1); return; }
  if (owned) { openDownloads(); return; }
  enroll();
 }
 const [open, setOpen] = useState([0]), [overview, setOverview] = useState(false), [error, setError] = useState(""), [search, setSearch] = useState("");
 const navigate = useNavigate(), skills = course.skills || course.tags || [];
 const outcomes = course.isBackendCourse ? course.skills : course.learningOutcomes?.length ? course.learningOutcomes : [...skills.map(s => `Build practical skills in ${s}`), "Apply your knowledge through guided activities", "Bring your skills together in a final project"];
 const requirements = course.requirements?.length ? course.requirements : ["A computer or laptop with internet access", "Willingness to learn and practice", "Basic familiarity with the internet", `Suitable for ${String(course.level || "all levels").toLowerCase()} learners`];
 const image = courseVisual(course) || previews[course.id] || courseArtwork[course.id] || course.image;
 const discount = course.originalPrice > course.price ? Math.round((1 - course.price / course.originalPrice) * 100) : 0;
 function enroll(buy = false) {
  try { const stored = JSON.parse(localStorage.getItem("rathi-cart") || "[]"), cart = Array.isArray(stored) ? stored : [];
   localStorage.setItem("rathi-cart", JSON.stringify([...cart.filter(c => c.id !== course.id), { id: course.id, title: course.title, price: course.price, image: courseArtwork[course.id] || course.image, type: "course" }]));
   navigate(buy ? `/checkout/${course.id}` : "/cart");
  } catch { setError("Unable to save your cart. Please try again."); }
 }
 return <div className="cdr-page cdr-programme reference-course-page"><div className="cdr-shell">
  <header className="cdr-header"><Link className="cdr-brand" to="/"><span>rathi<b>academy</b></span></Link><form className="cdr-search" onSubmit={e => { e.preventDefault(); navigate(`/courses?q=${encodeURIComponent(search.trim())}`); }}><input aria-label="Search courses" placeholder="Search for courses..." value={search} onChange={e => setSearch(e.target.value)}/><button type="submit" aria-label="Search courses"><Search size={16}/></button></form><Link to="/cart" className="cdr-cart" aria-label="Open cart"><ShoppingCart size={21}/></Link></header>
  <nav className="programme-nav" aria-label="Course sections"><a className="reference-nav-brand" href="#programme-overview">CABROY<span>School of Marketing</span></a><a href="#programme-highlights">Highlights</a><a href="#programme-journey">Your journey</a><a href="#programme-explorer">Curriculum</a><a href="#programme-projects">Practice</a><a href="#programme-people">Your team</a><a href="#programme-faq">FAQs</a><button type="button" onClick={courseAction} disabled={!accessReady}>{!accessReady ? "Checking..." : token && access.error ? "Retry" : owned ? "Start Learning" : "Buy Now"}</button></nav>
  <div className="cdr-full-hero">
   <section className="cdr-course-hero cdr-immersive-hero" id="programme-overview" aria-label="Course introduction and preview">
    <div className="cdr-course-hero-copy"><span className="cdr-course-hero-kicker">LEARN. BUILD. GROW.</span><span className="cdr-course-hero-category">{course.category}</span><h1>{course.title.split(" ").slice(0, -1).join(" ")}<strong>{course.title.split(" ").at(-1)}</strong></h1><p>{course.description || `Build practical skills with ${course.title}. Learn through structured modules and hands-on activities.`}</p>
     {skills.length > 0 && <div className="cdr-course-hero-skills">{skills.slice(0,4).map(skill => <span key={skill}><Check size={13} aria-hidden="true" />{skill}</span>)}</div>}
     <div className="cdr-course-hero-actions"><button type="button" disabled={!accessReady} onClick={courseAction}>{!accessReady ? "Checking access..." : token && access.error ? "Retry access check" : owned ? "Start Learning" : "Buy Now"} <ChevronDown size={16} aria-hidden="true" className="cdr-course-arrow" /></button><a href="#cdr-curriculum">Explore curriculum <ChevronDown size={16} aria-hidden="true" /></a></div>
     {(error || (accessReady && token && access.error)) && <p role="alert">{error || access.error}</p>}
     <div className="cdr-course-hero-meta"><span><Video size={14} aria-hidden="true" />{curriculum.length} modules</span><span><FileText size={14} aria-hidden="true" />{lessons} lessons &amp; activities</span><span><ChartNoAxesColumnIncreasing size={14} aria-hidden="true" />{course.level || "All levels"}</span></div>
    </div>
    <div className="cdr-immersive-backdrop" aria-hidden="true"><img src={image} alt="" /></div>
    <button type="button" className="cdr-immersive-play" onClick={() => course.previewVideoUrl ? setTrailer(true) : setOverview(true)} aria-label={course.previewVideoUrl ? `Play ${course.title} preview` : `Explore ${course.title}`}><span><Play size={31} fill="currentColor" aria-hidden="true" /></span><small>{course.previewVideoUrl ? "Watch course preview" : "Explore this course"}</small></button>
   </section>
  </div>
  <div className="programme-facts">{[[Video, String(curriculum.length), "Learning modules"], [FileText, String(lessons), "Lessons & activities"], [ChartNoAxesColumnIncreasing, course.level || "All levels", "Experience level"], [Clock3, course.duration || "Self-paced", "Learning format"]].map(([FactIcon, value, label]) => <div key={label}><FactIcon size={21} aria-hidden="true"/><div><strong>{value}</strong><span>{label}</span></div></div>)}</div>
  <ReferenceProgramme course={course} curriculum={curriculum} onAction={courseAction} actionDisabled={!accessReady} actionLabel={!accessReady ? "Checking access..." : token && access.error ? "Retry access check" : owned ? "Start Learning" : "Buy Now"} />
  <main className="cdr-layout cdr-academy-layout cdr-roadmap-layout"><div className="cdr-content">



   <section id="cdr-curriculum" className="cdr-curriculum"><div className="cdr-section-heading"><span className="programme-eyebrow">THE COURSE ROADMAP</span><h2>One step closer.<br />One module at a time.</h2><span>{curriculum.length} Modules · {lessons} Lessons &amp; Activities</span></div><button className="programme-expand" type="button" onClick={() => setOpen(open.length === curriculum.length ? [] : curriculum.map((_, index) => index))}>{open.length === curriculum.length ? "Collapse all modules" : "Explore all modules"}<ChevronDown size={15} aria-hidden="true"/></button>{curriculum.map((module, i) => <article className={`cdr-module ${open.includes(i) ? "is-open" : ""}`} key={module.title}><h3><button aria-expanded={open.includes(i)} aria-controls={`cdr-module-${i}`} onClick={() => setOpen(a => a.includes(i) ? a.filter(n => n !== i) : [...a, i])}><span className="cdr-number">{String(i + 1).padStart(2, "0")}</span><strong>{module.title}</strong><small>{module.lessons.length} Lessons &amp; Activities</small><ChevronDown size={17}/></button></h3>{open.includes(i) && <div className="cdr-lessons" id={`cdr-module-${i}`}>{module.lessons.map((lesson, n) => <div key={lesson.title}><span className="cdr-lesson-icon">{lesson.type === "Practice" ? <FileText size={15}/> : <Play size={13} fill="currentColor"/>}</span><span>{i + 1}.{n + 1}</span><p>{lesson.title}</p><small>{lesson.type}</small></div>)}</div>}</article>)}</section>

   {course.fullDescription && <Card title="About this course"><p className="cdr-about-description">{course.fullDescription.trim()}</p></Card>}
  </div><aside className="cdr-sidebar" id="programme-details">
   <section className="cdr-card cdr-studio-resources"><h2>Learning resources</h2><ul><Row icon={Video}>{lessons} guided lessons &amp; activities</Row><Row icon={FileText}>Course learning resources</Row><Row icon={InfinityIcon}>Learn at your own pace</Row><Row icon={Monitor}>Access through your student dashboard</Row><Row icon={Award}>Course certification pathway</Row><Row icon={Gift}>Practical projects &amp; assignments</Row></ul></section>
   <section className="cdr-outcomes"><h2>Learning outcomes</h2>{!outcomes.length && <p>Learning outcomes will be added soon.</p>}<div>{outcomes.map(item => <p key={item}><span><Check size={13}/></span>{item}</p>)}</div></section>




   <section className="cdr-card cdr-studio-facts"><h2>Course at a glance</h2><ul><Row icon={Video}>{curriculum.length} modules</Row><Row icon={FileText}>{lessons} lessons &amp; activities</Row><Row icon={ChartNoAxesColumnIncreasing}>{course.level || "All levels"}</Row>{course.students > 0 && <Row icon={Users}>{Number(course.students).toLocaleString("en-IN")} learners enrolled</Row>}<Row icon={Clock3}>{course.duration || `${curriculum.length} learning modules`}</Row><Row icon={Award}>Certificate upon completion requirements</Row></ul></section>
   <section className="cdr-academy-certificate"><Award size={38} aria-hidden="true"/><div><h2>Certificate of completion</h2><p>Showcase your learning with a course certificate after meeting the completion requirements.</p></div></section>





   <Card title="A course by"><div className="cdr-instructor"><span>{(course.instructor?.name || "Rathi Academy").split(" ").slice(0, 2).map(s => s[0]).join("")}</span><div><strong>{course.instructor?.name || "Rathi Academy"}</strong><p>{course.instructor?.bio || `${course.category} learning team`}</p></div></div></Card>
   <Card title="Requirements"><ul className="cdr-requirements">{requirements.map(item => <Row key={item} icon={CheckCircle2}>{item}</Row>)}</ul></Card>
   <Card title="Tags"><div className="cdr-tags">{[course.category, ...skills].filter(Boolean).map((tag, i) => <span key={`${tag}-${i}`}>{tag}</span>)}</div></Card>
   <Card title="Target Audience"><ul className="cdr-audience">{(course.targetAudience || ["Students looking to build practical skills", "Professionals who want to upskill", "Freelancers building their portfolio", `Anyone interested in ${String(course.category || course.title).toLowerCase()}`]).map(item => <li key={item}>{item}</li>)}</ul></Card>
  </aside></main>

  <section className="programme-faq" id="programme-faq"><div><span className="programme-eyebrow">A LITTLE MORE CLARITY</span><h2>Your questions,<br /><span>answered.</span></h2><p>Know what to expect before you take your next step.</p></div><div className="programme-faq-list">{[["Who is this course for?", `This course is suited to ${String(course.level || "all levels").toLowerCase()} learners. Review the requirements and target audience above to decide whether it fits your goals.`], ["What will I learn?", `Explore ${curriculum.length} modules and ${lessons} lessons and activities. Expand a module above to see its topics.`], ["How do I access my course downloads?", "After purchase, sign in and choose Start Learning on this page. Your protected download option will open the course resource link."], ["How does certification work?", "A course certificate is available after meeting the completion requirements. Refer to your course materials or contact your instructor for the applicable requirements."]].map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={18} aria-hidden="true"/></summary><p>{answer}</p></details>)}</div></section>
  <section className="programme-closing"><div><span className="programme-eyebrow">MAKE YOUR NEXT MOVE</span><h2>Ready to put your skills to work?</h2><p>Take the next step with {course.title}.</p></div><button type="button" disabled={!accessReady} onClick={courseAction}>{!accessReady ? "Checking access..." : token && access.error ? "Retry access check" : owned ? "Start Learning" : "Buy Now"}<ChevronDown size={17} aria-hidden="true"/></button></section>
  {downloads && owned && <div className="cdr-modal-backdrop" onClick={event => { if (event.target === event.currentTarget) setDownloads(false); }}><section className="cdr-dialog" role="dialog" aria-modal="true" aria-labelledby="cdr-download-title" onKeyDown={event => { if (event.key === "Escape") setDownloads(false); }}><button autoFocus type="button" className="cdr-close" aria-label="Close downloads" onClick={() => setDownloads(false)}><X size={20}/></button><p className="cdr-dialog-label">YOUR COURSE MATERIALS</p><h2 id="cdr-download-title">{course.title}</h2><p>Open your course materials in Google Drive or the resource page to download your files.</p>{resource.loading ? <p role="status">Loading your download link...</p> : resource.error ? <><p role="alert">{resource.error}</p><button type="button" className="cdr-primary" onClick={openDownloads}>Try again</button></> : <a className="cdr-download-link" href={resource.url} target="_blank" rel="noopener noreferrer"><FileText size={18} aria-hidden="true"/> Open course downloads</a>}</section></div>}
  {trailer && <div className="cdr-modal-backdrop" onClick={event => { if (event.target === event.currentTarget) setTrailer(false); }}><section className="cdr-dialog cdr-video-dialog" role="dialog" aria-modal="true" aria-label={`${course.title} video preview`} onKeyDown={event => { if (event.key === "Escape") setTrailer(false); }}><button autoFocus className="cdr-close" type="button" aria-label="Close preview" onClick={() => setTrailer(false)}><X size={20}/></button><video controls autoPlay poster={image}><source src={course.previewVideoUrl}/></video></section></div>}
  {overview && <div className="cdr-modal-backdrop"><section className="cdr-dialog" role="dialog" aria-modal="true" aria-labelledby="cdr-overview-title" onKeyDown={e => { if (e.key === "Escape") setOverview(false); }}><button autoFocus className="cdr-close" aria-label="Close overview" onClick={() => setOverview(false)}><X size={20}/></button><p className="cdr-dialog-label">COURSE OVERVIEW</p><h2 id="cdr-overview-title">{course.title}</h2><p>{course.description}</p><h3>Your learning path</h3><p>{curriculum.length} modules · {lessons} lessons and activities</p><button className="cdr-primary" onClick={() => { setOverview(false); document.getElementById("cdr-curriculum")?.scrollIntoView({ behavior: "smooth" }); }}>Explore curriculum</button></section></div>}
 </div></div>;
}
