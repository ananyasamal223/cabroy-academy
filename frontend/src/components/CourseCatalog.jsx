import { courseVisual } from "../utils/courseVisuals";
﻿import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Bot, BookOpen, Grid2X2, Megaphone, Search, ShoppingCart } from "lucide-react";
import { searchCourses } from "../utils/courseSearch";
import "./CourseCatalog.css";
import { courseArtwork } from "../data/courseCurriculum";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const categories = [["All", Grid2X2], ["Marketing", Megaphone], ["Analytics", BarChart3], ["AI & Automation", Bot]];
const headlines = { "digital-marketing": "Grow Brands Online", "data-analytics": "Turn Data into Decisions", "ai-automation": "Automate What Matters" };

export default function CourseCatalog({ programs, loading = false, error = "", search, onSearchChange, onAddToCart, onCustomize }) {
  const [category, setCategory] = useState("All");


  const allCourses = programs;
  const categoryOptions = [...categories, ...[...new Set(programs.map(course => course.categoryGroup))].filter(label => !["Design", "Development", "Business", "Productivity"].includes(label) && !categories.some(([name]) => name === label)).map(label => [label, BookOpen])];
  const matchingPrograms = searchCourses(programs, search);
  const visible = searchCourses(allCourses, search).filter((course) => category === "All" || course.categoryGroup === category);
  const reset = () => { setCategory("All"); onSearchChange(""); };

  const add = (course) => onAddToCart({ id: course.id, title: course.title, price: course.price, image: course.image, type: "course" });

  if (loading || (error && !programs.length)) return null;
  return <div className="pc-catalog">
    <section className="pc-programs" aria-labelledby="programs-title">
      <div className="pc-heading"><div><p>INDIVIDUAL PROGRAMS</p><h2 id="programs-title">Learn one skill at a time</h2></div><span>Specialized programs to master in-demand skills</span><button className="pc-outline" onClick={reset}>View All Programs <ArrowRight size={16} /></button></div>
      <div className="pc-program-grid">{matchingPrograms.map((course) => <article className={`pc-program-card ${course.accent === "purple" ? "pc-purple" : ""}`} key={course.id}>
        <div className={`pc-banner pc-banner-${course.id}`}><div><small>{course.category}</small><strong>{headlines[course.id] || `Learn ${course.category}`}</strong></div><img src={course.image} alt="" loading="lazy" /></div>
        <div className="pc-program-info"><p className="pc-category">{course.category}</p><h3>{course.title}</h3><p className="pc-description">{course.description}</p><div className="pc-tags">{course.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
          <div className="pc-card-actions"><strong>{money(course.price)}</strong><button className="pc-cart" onClick={() => add(course)} aria-label={`Add ${course.title} to cart`}><ShoppingCart size={20} /></button><Link className="pc-view pc-card-link" to={`/courses/${course.id}`} aria-label={`View ${course.title}`}>View Course <ArrowRight size={16} /></Link></div>
          <button className="pc-customize" onClick={() => onCustomize(course)} aria-haspopup="dialog">Add to your custom combo <ArrowRight size={14} /></button>
        </div>
      </article>)}</div>
      {!matchingPrograms.length && <p className="pc-empty">No individual programs match your search. Explore matching courses below.</p>}
    </section>

    <section className="pc-all-courses" id="all-courses" aria-labelledby="all-courses-title">
      <div className="pc-heading"><div><p>ALL COURSES</p><h2 id="all-courses-title">Explore Our Courses</h2></div><span>Build in-demand skills with practical learning paths</span><button className="pc-outline" onClick={reset}>View All Courses <ArrowRight size={16} /></button></div>
      <div className="pc-category-bar" role="group" aria-label="Course categories">{categoryOptions.map(([label, Icon]) => <button key={label} className={category === label ? "active" : ""} aria-pressed={category === label} onClick={() => setCategory(label)}><Icon size={18} />{label}</button>)}</div>
      <div className="pc-search-row"><label><Search size={18} /><input aria-label="Search all courses" placeholder="Search courses or skills..." value={search} onChange={(event) => onSearchChange(event.target.value)} /></label><span role="status">{visible.length} {visible.length === 1 ? "course" : "courses"}{search.trim() ? ` matching â€œ${search.trim()}â€` : " available"}</span></div>
      <div className="pc-course-grid">{visible.map((course) => <article className="pc-course-card" key={course.id}>
        <div className={`pc-course-thumbnail pc-thumb-${course.id}`}><img src={courseVisual(course) || courseArtwork[course.id] || course.image} alt="" loading="lazy" /><span>{course.category}</span><strong>{course.title.replace(" Mastery", "").replace(" Complete Course", "")}</strong></div><div className="pc-course-top"><div><p className="pc-category">{course.category}</p><h3>{course.title}</h3><p>{course.description}</p></div></div>
        <div className="pc-tags">{course.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        <div className="pc-card-actions"><strong>{money(course.price)}</strong><button className="pc-cart" onClick={() => add(course)} aria-label={`Add ${course.title} to cart`}><ShoppingCart size={19} /></button><Link className="pc-view pc-card-link" to={`/courses/${course.id}`} aria-label={`View ${course.title}`}>View Course <ArrowRight size={15} /></Link></div>
      </article>)}</div>
      {!visible.length && <div className="pc-empty"><h3>No courses found</h3><p>Try another search or category.</p><button className="pc-outline" onClick={reset}>Show all courses</button></div>}
    </section>

  </div>;
}

