import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, SlidersHorizontal, CalendarDays, Layers3, Trophy, Megaphone, BarChart3, Bot, Check, Search, ArrowRight, ChevronRight, Plus, Rocket, ShieldCheck, BookOpen, Tag, Star } from "lucide-react";
import "./Courses.css";
import CourseCustomizer from "../components/CourseCustomizer";
import CourseCatalog from "../components/CourseCatalog";
import { getProgramCourses, getProgramPrice, createProgramCartItem } from "../utils/courseBundle";
import api from "../api/client";
import { normalizeLiveCourse } from "../utils/liveCourses";

const formatPrice = (price) => `\u20B9${price.toLocaleString("en-IN")}`;
const courseTheme = (id) => id === "data-analytics" ? "teal" : id === "ai-automation" ? "purple" : "blue";
const shortTitle = (course) => course.title.replace(" Mastery", "");
function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem("rathi-cart") || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch { return []; }
}

export default function Courses() {
  const navigate = useNavigate();
  const [individualCourses, setIndividualCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);
  const selectionInitialized = useRef(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [customizerIds, setCustomizerIds] = useState([]);
  const [cart, setCart] = useState(readCart);
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get("q")?.trim() || "");

  const [notice, setNotice] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  useEffect(() => {
    const controller = new AbortController();
    api.get("/courses?published=true", { signal: controller.signal }).then(({ data }) => {
      if (controller.signal.aborted) return;
      const catalog = (data.courses || []).filter(course => course.isPublished === true).map(course => {
        const normalized = normalizeLiveCourse(course, api.defaults.baseURL);
        return { ...normalized, icon: normalized.categoryGroup === "Marketing" ? Megaphone : normalized.categoryGroup === "Analytics" ? BarChart3 : normalized.categoryGroup === "AI & Automation" ? Bot : BookOpen };
      });
      setIndividualCourses(catalog); setLoadError("");
      if (!selectionInitialized.current) {
        const requested = new URLSearchParams(window.location.search).get("bundle")?.split(",") || [];
        const selected = catalog.filter(course => requested.includes(course.id) || requested.includes(course.slug)).map(course => course.id);
        setSelectedIds(selected.length ? selected : catalog.slice(0, 3).map(course => course.id));
        selectionInitialized.current = true;
      } else setSelectedIds(previous => previous.filter(id => catalog.some(course => course.id === id)));
    }).catch(error => { if (!controller.signal.aborted) setLoadError(error.response?.data?.message || "Could not load courses. Please try again."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [reload]);
  useEffect(() => {
    const refresh = () => { if (!document.hidden) setReload(value => value + 1); };
    window.addEventListener("focus", refresh);
    const interval = setInterval(refresh, 60000);
    return () => { window.removeEventListener("focus", refresh); clearInterval(interval); };
  }, []);
  const selectedCourses = getProgramCourses(individualCourses, selectedIds);
  const originalPrice = selectedCourses.reduce((sum, course) => sum + course.price, 0);
  const price = getProgramPrice(selectedCourses);
  const saving = originalPrice - price;
  const discount = originalPrice ? Math.round(saving / originalPrice * 100) : 0;
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  const openSelector = () => {
    setCustomizerIds([...selectedIds]);
    setShowCustomizer(true);
  };
  const addToCombo = (course) => {
    setCustomizerIds(selectedIds.includes(course.id) ? [...selectedIds] : [...selectedIds, course.id]);
    setShowCustomizer(true);
  };
  const saveItem = (item) => {
    const latest = readCart();
    const updated = latest.some((existing) => existing.id === item.id)
      ? latest.map((existing) => existing.id === item.id ? item : existing)
      : [...latest, item];
    try {
      localStorage.setItem("rathi-cart", JSON.stringify(updated));
      setCart(updated);
      return true;
    } catch {
      setNotice("Your cart could not be saved. Please try again.");
      return false;
    }
  };
  const buyCombo = (ids = selectedIds) => {
    const item = createProgramCartItem(individualCourses, ids);
    if (!item || !saveItem(item)) return false;
    setSelectedIds([...ids]);
    navigate("/cart");
    return true;
  };

  return (
    <div className="cp-page">
      <header className="cp-header">
        <div className="cp-nav cp-container">
          <Link className="cp-brand" to="/" aria-label="Rathi Academy home"><span>rathi<span>academy</span></span></Link>
          <nav aria-label="Main navigation"><Link to="/">Home</Link><Link className="cp-nav-active" to="/courses">Courses</Link><a href="/#pricing">Learning Plans</a><Link to="/community">Community</Link></nav>
          <label className="cp-search"><Search size={18} /><input aria-label="Search courses" placeholder="Search courses, skills or careers..." value={search} onChange={(event) => setSearch(event.target.value)} /></label>
          <Link className="cp-cart" to="/cart" aria-label={`Cart with ${cart.length} items`}><ShoppingCart size={23} />{cart.length > 0 && <span>{cart.length}</span>}</Link>
        </div>
      </header>

      <section className="cp-hero" aria-labelledby="courses-title">
        <div className="cp-container cp-hero-inner">
          <div className="cp-hero-copy">
            <p className="cp-eyebrow">COMBO PROGRAM</p>
            <h1 id="courses-title">Move Your Career <span>Forward.</span></h1>
            <p className="cp-hero-description">Choose individual courses or combine multiple skills into one structured program.<br />Gain in-demand skills, work on real projects, and build your next chapter.</p>
            <div className="cp-hero-benefits">
              {[[Layers3, "Learn", "In-Demand Skills"], [Rocket, "Work on", "Real Projects"], [ShieldCheck, "Structured", "Learning Paths"], [BarChart3, "Build Your", "Career Skills"]].map(([Icon, line, text]) => <div key={text}><Icon size={29} /><span>{line}<br />{text}</span></div>)}
            </div>
          </div>
          <div className="cp-workspace-visual"><img src="/courses-skills-3d.png" alt="Blue and white 3D tiles featuring analytics, AI, achievement and career growth" width="1536" height="1024" fetchPriority="high" /></div>
        </div>
      </section>

      <main className="cp-container cp-main">
        {loading && <p role="status" className="cp-empty">Loading published courses...</p>}
        {loadError && <div role="alert" className="cp-empty">{loadError} <button type="button" onClick={() => { setLoading(true); setReload(value => value + 1); }}>Retry</button></div>}
        <div className="cp-workspace">
          <div className="cp-program-column">
            <div className="cp-toolbar" aria-label="Program controls">
              <button className="cp-all" onClick={() => { setSearch(""); }}>All</button>
              <button className="cp-primary" onClick={openSelector} aria-haspopup="dialog"><SlidersHorizontal size={18} />Customize</button>
            </div>

            <section className="cp-builder" aria-labelledby="combo-title">
              <div className="cp-builder-heading"><div><h2 id="combo-title">Your Custom <span>Combo Program</span></h2><p>Build your learning path. Choose courses to create your perfect program.</p></div>{saving > 0 && <div className="cp-savings-note"><Star size={20} fill="currentColor" /><span><strong>Save {formatPrice(saving)}</strong><small>with this combo</small></span></div>}</div>
              <div className="cp-combo-cards">
                {selectedCourses.map((course, index) => { const Icon = course.icon; return <div className="cp-combo-item" key={course.id}>
                  {index > 0 && <Plus className="cp-combo-plus" size={24} />}
                  <Link to={`/courses/${course.id}`} className={`cp-skill-card cp-${courseTheme(course.id)}`} aria-label={`View ${course.title}`}>
                    <div className="cp-skill-top"><span className="cp-skill-icon"><Icon size={29} /></span><span className="cp-level-label">{course.level}</span><Check className="cp-check" size={17} /></div>
                    <h3>{shortTitle(course)}</h3>
                    <div className="cp-skill-bottom">
                      <p>{course.tags.join(", ")}</p>
                      <span className="cp-skill-link" aria-hidden="true"><ChevronRight size={20} /></span>
                    </div>
                  </Link>
                </div>; })}
                {!selectedCourses.length && <p className="cp-empty">Choose your first course to start building a program.</p>}
              </div>
              <button className="cp-add-more" onClick={openSelector}><span className="cp-add-icon"><Plus size={25} /></span><span><strong>Add More Courses</strong><small>Browse and choose the skills for your combo program</small></span><ChevronRight size={23} /></button>
            </section>


          </div>

          <aside className="cp-summary" aria-label="Program pricing">
            <div className="cp-offer"><span><Tag size={15} />{discount ? `${discount}% OFF` : "YOUR PROGRAM"}</span><small>{selectedCourses.length > 1 ? "Better together" : "Made for your goals"}</small></div>
            <p className="cp-summary-label">{selectedCourses.length > 1 ? "Combined Program" : "Your Learning Program"}</p>
            <div className="cp-total" aria-live="polite"><strong>{formatPrice(price)}</strong>{saving > 0 && <del>{formatPrice(originalPrice)}</del>}</div>
            <div className="cp-summary-features">
              {[[CalendarDays, "Flexible learning", "Learn at your pace"], [Layers3, `${selectedCourses.reduce((sum, course) => sum + course.modules.length, 0)} Modules Total`, "Structured learning path"], [BookOpen, `${selectedCourses.length} Courses Included`, "Your choice of skills"], [Trophy, `${selectedCourses.reduce((sum, course) => sum + course.projects.length, 0)} Course Projects`, "Build your portfolio"]].map(([Icon, title, text]) => <div key={title}><Icon size={20} /><strong>{title}</strong><small>{text}</small></div>)}
            </div>
            <button className="cp-buy cp-primary" onClick={() => buyCombo()} disabled={!selectedCourses.length}><ShoppingCart size={23} />{selectedCourses.length > 1 ? "Buy This Combo Now" : "Continue to Cart"}<ArrowRight size={19} /></button>
            <p className="cp-summary-hint">Choose courses and build your program</p>
            <div className="cp-summary-footer"><span><Layers3 size={22} />Flexible course<br />combinations</span><span><BookOpen size={22} />Practical<br />learning</span><span><Trophy size={22} />Portfolio<br />projects</span></div>
          </aside>
        </div>
        <CourseCatalog
          programs={individualCourses}
          loading={loading}
          error={loadError}
          search={search}
          onSearchChange={setSearch}
          onCustomize={addToCombo}
          onAddToCart={(item) => {
            if (!saveItem(item)) return false;
            setNotice(`${item.title} added to cart.`);
            return true;
          }}
        />
      </main>
      <div className={`cp-toast ${notice ? "cp-toast-visible" : ""}`} role="status">{notice}</div>
      {showCustomizer && (
        <CourseCustomizer
          courses={individualCourses}
          selectedIds={customizerIds}
          onClose={() => setShowCustomizer(false)}
          onApply={(ids) => setSelectedIds(ids)}
          onAddToCart={buyCombo}
        />
      )}
    </div>
  );
}
