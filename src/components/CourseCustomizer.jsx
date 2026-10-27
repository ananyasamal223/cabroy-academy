import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUp, BarChart3, Bot, ChevronDown, Flame, GripVertical, Megaphone, RotateCcw, Search, ShoppingCart, SlidersHorizontal, X } from "lucide-react";
import { getProgramCourses, getProgramPrice } from "../utils/courseBundle";
import "./CourseCustomizer.css";
import ComboFilterSelect from "./ComboFilterSelect";
import { searchCourses } from "../utils/courseSearch";

const title = (course) => course.title.replace(" Mastery", "");
const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const theme = (course) => course.id === "data-analytics" ? "teal" : course.id === "ai-automation" ? "purple" : "blue";
const groups = [
  { label: "Most Popular", icon: Flame, category: null },
  { label: "Marketing", icon: Megaphone, category: "Digital Marketing" },
  { label: "Analytics", icon: BarChart3, category: "Data Analytics" },
  { label: "Automation", icon: Bot, category: "AI & Automation" },
];

export default function CourseCustomizer({ courses, selectedIds, onClose, onApply, onAddToCart }) {
  const dialogRef = useRef(null);
  const draggedId = useRef(null);
  const [draftIds, setDraftIds] = useState([...selectedIds]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [level, setLevel] = useState("All");
  const [openGroups, setOpenGroups] = useState(["Most Popular", "Marketing"]);
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const selected = getProgramCourses(courses, draftIds);
  const visible = searchCourses(courses, search).filter((course) =>
    (category === "All" || category === course.categoryLabel) &&
    (level === "All" || level === course.level)
  );
  const filtering = Boolean(search.trim() || category !== "All" || level !== "All");

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const close = () => dialogRef.current.close();
  const toggle = (id) => {
    setError("");
    setDraftIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };
  const reorder = (id, targetIndex) => {
    const currentIndex = draftIds.indexOf(id);
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= draftIds.length || currentIndex === targetIndex) return;
    const next = [...draftIds];
    next.splice(currentIndex, 1);
    next.splice(targetIndex, 0, id);
    setDraftIds(next);
    setAnnouncement(`${title(courses.find((course) => course.id === id))} moved to position ${targetIndex + 1}.`);
  };
  const reset = () => {
    setDraftIds(courses.map((course) => course.id));
    setSearch("");
    setCategory("All");
    setLevel("All");
    setOpenGroups(["Most Popular", "Marketing"]);
    setError("");
  };

  return (
    <dialog ref={dialogRef} className="cc-dialog" aria-labelledby="customize-title" aria-describedby="customize-description" onClose={() => {
      // StrictMode can queue a close event before the effect reopens the dialog.
      if (!dialogRef.current?.open) onClose();
    }}>
      <div className="cc-header">
        <div><p className="cp-section-label">MAKE IT YOURS</p><h2 id="customize-title">Customize Your Combo Program</h2><p id="customize-description">Choose, filter and reorder the courses you want in your combo.</p></div>
        <button className="cc-close" onClick={close} aria-label="Close customization"><X size={24} /></button>
      </div>

      <div className="cc-filters">
        <label className="cc-search"><Search size={20} /><input autoFocus aria-label="Search courses or skills" placeholder="Search courses or skills" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <ComboFilterSelect label="Filter by category" icon={SlidersHorizontal} value={category} onChange={setCategory}
          options={[{ value: "All", label: "All Categories" }, ...[...new Set(courses.map((course) => course.categoryLabel))].map((value) => ({ value, label: value }))]} />
        <ComboFilterSelect label="Filter by level" icon={BarChart3} value={level} onChange={setLevel}
          options={[{ value: "All", label: "All Levels" }, ...[...new Set(courses.map((course) => course.level))].map((value) => ({ value, label: value }))]} />
      </div>

      <div className="cc-body">
        <div className="cc-groups">
          {filtering && <p className="cc-result-count" role="status">{visible.length} matching {visible.length === 1 ? "course" : "courses"}</p>}
          {(filtering ? [{ label: "Search Results", icon: Search, category: null }] : groups).map((group, index) => {
            const Icon = group.icon;
            const matches = visible.filter((course) => !group.category || course.categoryLabel === group.category);
            if (filtering && !matches.length) return null;
            const open = filtering || openGroups.includes(group.label);
            return <section className="cc-group" key={group.label}>
              <h3><button aria-expanded={open} aria-controls={`cc-group-${index}`} onClick={() => setOpenGroups((current) => current.includes(group.label) ? current.filter((label) => label !== group.label) : [...current, group.label])} disabled={filtering}>
                <Icon size={23} className={`cc-group-icon cc-group-icon-${index}`} /><span>{group.label}</span><ChevronDown size={18} className={open ? "cc-chevron-open" : ""} />
              </button></h3>
              <div id={`cc-group-${index}`} hidden={!open}>
                <div className="cc-options">{matches.map((course) => {
                  const CourseIcon = course.icon;
                  return <label key={course.id} className={`cc-option ${draftIds.includes(course.id) ? "cc-option-selected" : ""}`}>
                    <input type="checkbox" checked={draftIds.includes(course.id)} onChange={() => toggle(course.id)} />
                    <span className={`cc-course-icon cp-${theme(course)}`}><CourseIcon size={23} /></span><span>{title(course)}</span>
                  </label>;
                })}</div>
              </div>
            </section>;
          })}
          {!visible.length && <div className="cc-no-results"><Search size={30} /><h3>No matching courses</h3><p>Try a different skill, category or level.</p><button onClick={() => { setSearch(""); setCategory("All"); setLevel("All"); }}>Clear filters</button></div>}
        </div>

        <aside className="cc-selected" aria-label="Selected courses">
          <h3>Selected Courses <span aria-live="polite">{selected.length}</span></h3>
          <p>Drag to reorder, or use the arrow buttons.</p>
          <ol>{selected.map((course, index) => {
            const Icon = course.icon;
            return <li key={course.id} onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }} onDrop={(event) => { event.preventDefault(); if (draggedId.current) reorder(draggedId.current, index); draggedId.current = null; }}>
              <span className="cc-drag" draggable onDragStart={(event) => { draggedId.current = course.id; event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", course.id); }} onDragEnd={() => { draggedId.current = null; }} title={`Drag to reorder ${title(course)}`}><GripVertical size={18} /></span>
              <span className={`cc-course-icon cp-${theme(course)}`}><Icon size={24} /></span><strong>{title(course)}</strong>
              <div className="cc-reorder"><button disabled={index === 0} aria-label={`Move ${title(course)} up`} onClick={() => reorder(course.id, index - 1)}><ArrowUp size={14} /></button><button disabled={index === selected.length - 1} aria-label={`Move ${title(course)} down`} onClick={() => reorder(course.id, index + 1)}><ArrowDown size={14} /></button></div>
              <button className="cc-remove" aria-label={`Remove ${title(course)}`} onClick={() => toggle(course.id)}><X size={17} /></button>
            </li>;
          })}</ol>
          {!selected.length && <div className="cc-selection-empty">Select a course to start your combo.</div>}
          <div className="cc-draft-total" aria-live="polite"><span>Your combo total</span><strong>{money(getProgramPrice(selected))}</strong></div>
        </aside>
      </div>

      <div className="cc-footer">
        <button className="cc-reset" onClick={reset}><RotateCcw size={16} />Reset to Default</button>
        <div className="cc-footer-actions">
          <button className="cc-apply" disabled={!selected.length} onClick={() => { onApply([...draftIds]); close(); }}>Apply Selection</button>
          <button className="cp-primary" disabled={!selected.length} onClick={() => { if (!onAddToCart([...draftIds])) setError("Your cart could not be saved. Please try again."); }}><ShoppingCart size={18} />Add to Cart<ArrowRight size={18} /></button>
        </div>
      </div>
      {error && <p className="cc-error" role="alert">{error}</p>}
      <span className="cc-sr-only" role="status">{announcement}</span>
    </dialog>
  );
}
