import { getPublishedCourses } from "../api/courseCatalog.js";
import { courseVisual } from "../utils/courseVisuals";
import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/client";
import { FaDiscord } from "react-icons/fa";

import "./HomeHeroOrbit.css";
import { Link } from "react-router-dom";
import "./Home.css";
import CounsellingModal from "../components/CounsellingModal";
import BrochureModal from "../components/BrochureModal";
import HomeOfferings from "../components/HomeOfferings";
import HomeCareerPaths from "../components/HomeCareerPaths";
import { ArrowRight, Globe2, PencilRuler, ShieldCheck, Send, Quote, Star, Search, Menu, X, Download } from "lucide-react";

/*
  CABROY HOME
  - Uses real course / review data only.
  - No dummy courses. Testimonials currently show labeled preview samples.
  - Static hero/globe graphics are supplied in /public.
  - 3D reveal + parallax are dependency-free.
*/

const API_ORIGIN = (
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_URL) ||
  "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

const COMMUNITY_FALLBACK_AVATARS = [
  { name: "Community member", src: "/community-avatar-1.jpg" },
  { name: "Community member", src: "/community-avatar-2.jpg" },
  { name: "Community member", src: "/community-avatar-3.jpg" },
  { name: "Community member", src: "/community-avatar-4.jpg" },
];

const asArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  const candidates = [
    payload?.courses,
    payload?.items,
    payload?.results,
    payload?.reviews,
    payload?.feedback,
    payload?.testimonials,
    payload?.data,
    payload?.data?.courses,
    payload?.data?.items,
    payload?.data?.results,
    payload?.data?.reviews,
    payload?.data?.feedback,
    payload?.data?.testimonials,
  ];
  return candidates.find(Array.isArray) || [];
};

async function fetchFirst(paths) {
  let lastError;
  for (const path of paths) {
    try {
      const response = await api.get(path);
      return response.data;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("No working endpoint");
}

async function fetchAllWorking(paths) {
  const settled = await Promise.allSettled(
    paths.map(async (path) => {
      const response = await api.get(path);
      return response.data;
    })
  );

  return settled
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);
}

const uniqueBy = (items, keyFn) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const num = (...values) => {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return 0;
};

const compact = (value) =>
  new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

const money = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
};

const stripHtml = (value = "") =>
  String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const courseId = (course) =>
  course?._id || course?.id || course?.courseId || course?.slug || "";

const courseName = (course) =>
  course?.title || course?.name || course?.courseName || "Course";

const resolveAssetUrl = (src = "") => {
  if (!src) return "";
  if (/^https?:\/\//i.test(src) || src.startsWith("data:") || src.startsWith("blob:")) {
    return src;
  }
  if (src.startsWith("/uploads/")) return `${API_ORIGIN}${src}`;
  if (src.startsWith("/")) return src;
  return `${API_ORIGIN}/${src.replace(/^\/+/, "")}`;
};

const courseImage = (course) => {
  const visual = courseVisual(course);
  if (visual) return visual;
  const raw =
    course?.thumbnailUrl ||
    course?.thumbnail ||
    course?.imageUrl ||
    course?.image ||
    course?.coverImage ||
    course?.bannerImage ||
    course?.banner ||
    "";

  if (raw) return resolveAssetUrl(raw);

  const title = String(course?.title || "").toLowerCase();
  if (title.includes("digital")) return "/digital-marketing-course.jpg";
  if (title.includes("data") || title.includes("analytic")) return "/data-analytics-course.jpg";
  if (title.includes("ai") || title.includes("automation")) return "/ai-automation-course.jpg";
  return "/digital-marketing-thumbnail.jpg";
};

const coursePrice = (course) =>
  num(course?.discountedPrice, course?.salePrice, course?.price, course?.amount);

const courseMrp = (course) =>
  num(course?.originalPrice, course?.mrp, course?.listPrice);

const courseRating = (course) =>
  num(course?.averageRating, course?.rating, course?.avgRating);

const learnerCount = (course) =>
  num(
    course?.learnerCount,
    course?.students,
    course?.studentsCount,
    course?.enrollmentCount,
    course?.enrolledCount,
    course?.totalEnrollments
  );

const courseDuration = (course) =>
  course?.durationLabel ||
  course?.duration ||
  (course?.durationWeeks ? `${course.durationWeeks} Weeks` : "") ||
  (course?.weeks ? `${course.weeks} Weeks` : "");

const courseHref = (course) => {
  if (course?.detailsUrl) return course.detailsUrl;
  if (course?.publicUrl) return course.publicUrl;
  if (course?.slug) return `/courses/${course.slug}`;
  const id = courseId(course);
  return id ? `/courses/${id}` : "/courses";
};

const initials = (name = "Learner") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "L";

function Icon({ type }) {
  const p = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.85,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const icons = {
    user: (
      <svg {...p}>
        <circle cx="12" cy="7.5" r="4" />
        <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      </svg>
    ),
    folder: (
      <svg {...p}>
        <path d="M3 7h6l2 2h10v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
        <path d="M3 7V6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v1" />
      </svg>
    ),
    spark: (
      <svg {...p}>
        <path d="m12 3 1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7Z" />
        <path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7Z" />
      </svg>
    ),
    chat: (
      <svg {...p}>
        <path d="M21 14a5 5 0 0 1-5 5H9l-5 2 1.5-4.5A7.2 7.2 0 0 1 3 11a7 7 0 0 1 7-7h6a5 5 0 0 1 5 5Z" />
      </svg>
    ),
    users: (
      <svg {...p}>
        <circle cx="9" cy="7" r="3.5" />
        <path d="M3 21v-2a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v2" />
        <path d="M16 4.4a3.5 3.5 0 0 1 0 5.2M17 14a5 5 0 0 1 4 4.9V21" />
      </svg>
    ),
    award: (
      <svg {...p}>
        <circle cx="12" cy="8" r="5" />
        <path d="M8.5 12 7 21l5-3 5 3-1.5-9" />
      </svg>
    ),
    book: (
      <svg {...p}>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z" />
        <path d="M4 5.5v15M8 3v15" />
      </svg>
    ),
    target: (
      <svg {...p}>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    briefcase: (
      <svg {...p}>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
      </svg>
    ),
  };

  return icons[type] || icons.user;
}

function Reveal({ children, className = "", delay = 0 }) {
  return (
    <div
      className={`cab-reveal3d ${className}`}
      style={{ "--reveal-delay": `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function Avatar({ src, name, fallbackSrc = "" }) {
  const [imageFailed, setImageFailed] = useState(false);
  const source = imageFailed ? fallbackSrc : src;

  if (source) {
    return (
      <img
        className="cab-avatar"
        src={source}
        alt={name || "Learner"}
        onError={() => {
          if (!imageFailed && fallbackSrc && src !== fallbackSrc) setImageFailed(true);
        }}
      />
    );
  }

  return <span className="cab-avatar cab-avatar-fallback">{initials(name)}</span>;
}

function CourseCard({ course, index }) {
  const title = courseName(course);
  const image = courseImage(course);
  const price = coursePrice(course);
  const mrp = courseMrp(course);
  const rating = courseRating(course);
  const learners = learnerCount(course);
  const duration = courseDuration(course);
  const description = stripHtml(course?.shortDescription || course?.description || "");

  return (
    <article
      className="cab-course-card cab-tilt-card"
      style={{ "--card-delay": `${index * 70}ms` }}
    >
      <a className="cab-course-photo" href={courseHref(course)}>
        {image ? (
          <img src={image} alt={title} />
        ) : (
          <div className="cab-course-photo-fallback">
            <Icon type="book" />
            <span>{title}</span>
          </div>
        )}
      </a>

      <div className="cab-course-info">
        <h3>{title}</h3>
        {description ? <p>{description.slice(0, 112)}{description.length > 112 ? "…" : ""}</p> : null}

        <div className="cab-course-meta">
          {duration ? <span>◷ {duration}</span> : null}
          {rating ? <span className="cab-rating">★ {rating.toFixed(1)}</span> : null}
          {learners ? <span>{compact(learners)} learners</span> : null}
        </div>

        <div className="cab-course-bottom">
          <div className="cab-price-inline">
            {price ? <strong>{money(price)}</strong> : null}
            {mrp > price && price > 0 ? <del>{money(mrp)}</del> : null}
          </div>
          <a className="cab-card-button" href={courseHref(course)}>
            View Course <ArrowRight aria-hidden="true" strokeWidth={2.5} />
          </a>
        </div>
      </div>
    </article>
  );
}

function ReviewCard({ review }) {
  const person =
    review?.user ||
    review?.student ||
    review?.author ||
    review?.createdBy ||
    {};

  const name =
    person?.name ||
    review?.studentName ||
    review?.name ||
    "Learner";

  const avatar =
    person?.avatar ||
    person?.profileImage ||
    review?.avatar ||
    review?.profileImage ||
    "";

  const rating = Math.min(5, Math.max(0, num(review?.rating, review?.stars)));
  const text = stripHtml(
    review?.comment ||
    review?.review ||
    review?.message ||
    review?.content ||
    ""
  );

  const role =
    review?.designation ||
    review?.role ||
    review?.course?.title ||
    review?.courseTitle ||
    "CABROY learner";

  return (
    <article className="learner-review">
      <div className="learner-review-top">
        {rating > 0 ? (
          <div className="learner-rating" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
            <span className="learner-stars" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((index) => (
                <span className="learner-star" key={index}>
                  <Star className="learner-star-base" />
                  <span className="learner-star-fill" style={{ width: `${Math.min(1, Math.max(0, rating - index)) * 100}%` }}><Star /></span>
                </span>
              ))}
            </span>
            <b aria-hidden="true">{rating.toFixed(1)}<span> / 5</span></b>
          </div>
        ) : <span />}
        <Quote aria-hidden="true" />
      </div>
      {text ? <blockquote>{text}</blockquote> : <p className="learner-rating-only">A rating from our learning community.</p>}
      <div className="learner-review-person">
        <Avatar src={avatar} name={name} />
        <div><strong>{name}</strong><small>{role}</small></div>
      </div>
    </article>
  );
}

export default function Home() {
  const [counsellingOpen, setCounsellingOpen] = useState(false);
  const [brochureOpen, setBrochureOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courseLoadError, setCourseLoadError] = useState("");
  const [catalogReload, setCatalogReload] = useState(0);
  const [billing, setBilling] = useState("monthly");
  const heroRef = useRef(null);


  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoadingCourses(true);
    setCourseLoadError("");

    const loadHome = async () => {
      try {
        const liveCourses = await getPublishedCourses(api, { signal: controller.signal });
        if (!active) return;
        setCourses(liveCourses);
        setLoadingCourses(false);

        const reviewBatches = [];

        const publicReviewPayloads = await fetchAllWorking([
          "/feedback/public?limit=12",
          "/reviews?published=true&limit=12",
          "/testimonials?published=true&limit=12",
        ]);
        reviewBatches.push(...publicReviewPayloads.flatMap(asArray));

        const pickedCourses = liveCourses.slice(0, 8);
        const courseReviewResults = await Promise.allSettled(
          pickedCourses.map(async (course) => {
            const id = courseId(course);
            if (!id) return [];
            const payloads = await fetchAllWorking([
              `/courses/${id}/reviews`,
              `/courses/${id}/feedback`,
            ]);
            return payloads.flatMap(asArray);
          })
        );

        courseReviewResults.forEach((result) => {
          if (result.status === "fulfilled") reviewBatches.push(...result.value);
        });

        const liveReviews = uniqueBy(
          reviewBatches.filter(Boolean),
          (review) =>
            String(
              review?._id ||
              review?.id ||
              `${review?.studentName || review?.name || "learner"}-${review?.createdAt || review?.comment || review?.review || "review"
              }`
            )
        );

        if (!active) return;
        setReviews(liveReviews);
      } catch (error) {
        if (active && !controller.signal.aborted) setCourseLoadError("Courses could not load. The course service may be starting up. Please try again.");
        console.error("CABROY Home data:", error);
      } finally {
        if (active) setLoadingCourses(false);
      }
    };

    loadHome();
    return () => {
      active = false;
      controller.abort();
    };
  }, [catalogReload]);

  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll(".cab-reveal3d, .cab-tilt-card")
    );

    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const node = entry.target;
          const isCard = node.classList.contains("cab-tilt-card");
          const delay = Number(
            String(
              node.style.getPropertyValue(
                isCard ? "--card-delay" : "--reveal-delay"
              ) || "0"
            ).replace("ms", "")
          ) || 0;

          if (node.animate) {
            node.animate(
              [
                {
                  opacity: 0.35,
                  transform: isCard
                    ? "perspective(1000px) translateY(34px) rotateX(4deg)"
                    : "perspective(1200px) translateY(54px) rotateX(5deg) scale(.985)",
                  filter: "blur(2px)",
                },
                {
                  opacity: 1,
                  transform: "perspective(1200px) translateY(0) rotateX(0) scale(1)",
                  filter: "blur(0)",
                },
              ],
              {
                duration: isCard ? 620 : 780,
                delay,
                easing: "cubic-bezier(.16,.82,.22,1)",
                fill: "both",
              }
            );
          }

          observer.unobserve(node);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
    );

    nodes.forEach((node) => observer.observe(node));

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (heroRef.current) {
          const rect = heroRef.current.getBoundingClientRect();
          const ratio = Math.max(
            -1,
            Math.min(1, -rect.top / Math.max(rect.height, 1))
          );
          heroRef.current.style.setProperty("--hero-shift", `${ratio * 10}px`);
          heroRef.current.style.setProperty("--hero-rotate", `${ratio * -0.8}deg`);
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [courses.length, reviews.length]);

  const visibleCourses = useMemo(() => courses.slice(0, 4), [courses]);

  const avatars = useMemo(() => {
    const realAvatars = reviews
      .map((review) => {
        const person = review?.user || review?.student || review?.author || review?.createdBy || {};
        return {
          name: person?.name || review?.studentName || review?.name || "Learner",
          src: person?.avatar || person?.profileImage || review?.avatar || review?.profileImage || "",
        };
      })
      .filter((item) => Boolean(item.src));

    return Array.from({ length: 4 }, (_, index) => ({
      ...(realAvatars[index] || COMMUNITY_FALLBACK_AVATARS[index]),
      fallbackSrc: COMMUNITY_FALLBACK_AVATARS[index].src,
    }));
  }, [reviews]);

  // Temporary visual preview; replace with reviews.slice(0, 4) for live testimonials.
  const testimonials = [
    { id: "preview-1", name: "Aarav Sharma", courseTitle: "Digital Marketing", rating: 5, comment: "The practical projects helped me connect the concepts to real campaigns. I finally feel confident putting what I learn into action." },
    { id: "preview-2", name: "Priya Mehta", courseTitle: "Data Analytics", rating: 4.5, comment: "Clear explanations and a pace I could follow alongside work. Building my first dashboard was the highlight of the course." },
    { id: "preview-3", name: "Rohan Patel", courseTitle: "Social Media Marketing", rating: 4, comment: "I liked having a structured path instead of jumping between tutorials. The assignments gave me a great starting point for my portfolio." },
    { id: "preview-4", name: "Sneha Iyer", courseTitle: "Search Engine Optimization", rating: 5, comment: "The step-by-step lessons made a complex topic feel approachable. Being able to revisit each module made learning so much easier." },
  ];

  const planPrice = (monthlyPrice) =>
    billing === "yearly" ? monthlyPrice * 12 : monthlyPrice;
  const billingSuffix = billing === "yearly" ? "/ year" : "/ month";

  return (
    <main className="cab-home">
      {counsellingOpen && <CounsellingModal onClose={() => setCounsellingOpen(false)} />}
      {brochureOpen && <BrochureModal courses={courses} loading={loadingCourses} onClose={() => setBrochureOpen(false)} />}
      <header className="cab-header">
        <div className="cab-shell cab-nav">
          <a className="cab-logo" href="/" aria-label="CABROY School of Marketing">
            <img src="/cabroy-logo-original.png" alt="CABROY crest" />
            <span className="cab-brand-copy">
              <b>CABROY</b>
              <small>SCHOOL OF MARKETING</small>
            </span>
          </a>

          <nav id="home-navigation" aria-label="Main navigation" className={`cab-menu${menuOpen ? " cab-menu-open" : ""}`}>
            <a className="active" href="/" aria-current="page">Home</a>
            <a href="/courses">Courses</a>
            <a href="/community">Community</a>
            <a href="/pricing">Pricing</a>
            <a href="/about">About</a>
            <button type="button" onClick={() => { setMenuOpen(false); setCounsellingOpen(true); }}>Contact</button>
          </nav>

          <form className="cab-search" action="/courses" method="get" role="search">
            <input type="search" name="q" aria-label="Search courses" placeholder="Search courses or skills" maxLength={150} />
            <button type="submit" aria-label="Find courses"><Search aria-hidden="true" /></button>
          </form>

          <button className="cab-mobile-toggle" type="button" aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} aria-controls="home-navigation" onClick={() => setMenuOpen(!menuOpen)} onKeyDown={(event) => { if (event.key === "Escape") setMenuOpen(false); }}>{menuOpen ? <X /> : <Menu />}</button>
          <div className="cab-auth">
            <a href="/login">Login</a>
            <a className="cab-btn cab-btn-small" href="/signup">Sign Up</a>
          </div>
        </div>
      </header>

      <section className="cab-hero cab-hero-studio cab-hero-orbit" ref={heroRef}>
        <div className="cab-shell cab-hero-grid">
          <div className="cab-hero-copy orbit-copy">
            <h1>Find your direction.<br /><span>Build your future.</span></h1>
            <p>Explore Digital Marketing, Data Analytics and AI Automation.</p>
            <div className="cab-actions">
              <Link className="cab-btn" to="/courses">Explore Courses <ArrowRight aria-hidden="true" size={19} /></Link>
              <button type="button" className="cab-btn cab-btn-outline" onClick={() => setCounsellingOpen(true)}>Talk to an Advisor</button>
            </div>
            <div className="orbit-benefits" aria-label="Learning benefits">
              <span><Icon type="award" />Practical projects</span>
              <span><Icon type="users" />Expert mentors</span>
              <span><Icon type="book" />Flexible learning</span>
            </div>
          </div>
          <div className="orbit-art">
            <div className="orbit-glow" aria-hidden="true" />
            <svg className="orbit-lines" viewBox="0 0 600 580" fill="none" aria-hidden="true">
              <ellipse cx="300" cy="240" rx="275" ry="113" transform="rotate(-15 300 240)" />
              <ellipse cx="300" cy="332" rx="275" ry="113" transform="rotate(17 300 332)" />
              <circle cx="470" cy="94" r="5" /><circle cx="41" cy="266" r="4" /><circle cx="516" cy="408" r="4" />
            </svg>
            <img className="orbit-person" src="/cabroy-orbit-learner.png" alt="Learner holding a tablet and looking ahead" fetchPriority="high" width="1122" height="1402" />
            <span className="orbit-tool orbit-tool-analytics"><img src="/course-icons/google-analytics.svg" alt="Google Analytics" width="40" height="40" /></span>
            <span className="orbit-tool orbit-tool-meta"><img src="/course-icons/meta-ads.svg" alt="Meta" width="40" height="40" /></span>
            <span className="orbit-tool orbit-tool-python"><img src="/course-icons/python.svg" alt="Python" width="40" height="40" /></span>
            <span className="orbit-tool orbit-tool-chatgpt"><img src="/course-icons/chatgpt.svg" alt="ChatGPT" width="40" height="40" /></span>
            <Link className="orbit-growth-card" to="/courses"><div><b>Learn. Apply. <span>Grow.</span></b><p>Build practical skills that make an impact.</p></div><span className="orbit-growth-arrow"><ArrowRight size={20} aria-hidden="true" /></span></Link>
          </div>
        </div>

        <div className="cab-shell cab-feature-strip">
          {[
            ["user", "1:1", "Doubt Clearing"],
            ["folder", "Real-World", "Projects"],
            ["spark", "AI Tools", "& Modern Workflows"],
            ["chat", "Discord", "Community"],
            ["users", "Industry", "Mentors"],
            ["award", "Certificates", "& Career Support"],
          ].map(([icon, title, text], index) => (
            <div className="cab-feature" key={title} style={{ "--i": index }}>
              <span>{title === "Discord" ? <FaDiscord aria-hidden="true" /> : <Icon type={icon} />}</span>
              <div><b>{title}</b><small>{text}</small></div>
            </div>
          ))}
        </div>
      </section>

      <section className="cab-section cab-connected" aria-labelledby="connected-title">
        <div className="cab-shell">
          <div className="cab-connected-panel">
            <div className="cab-connected-heading">
              <span className="cab-eyebrow">THE CABROY CAREER SYSTEM</span>
              <h2 id="connected-title">Everything connects to<br /><span>your next career move.</span></h2>
              <p>Practical learning, expert guidance and a community that helps you turn new skills into work you can show.</p>
              <Link to="/courses" className="cab-btn">Explore Courses <ArrowRight size={17} aria-hidden="true" /></Link>
            </div>
            <div className="cab-connected-flow">
              <svg className="cab-connected-wires" viewBox="0 0 1000 320" preserveAspectRatio="none" fill="none" aria-hidden="true">
                <g stroke="#dce5ef" strokeWidth="1.2">
                  <path d="M0 35H130Q170 35 190 75L230 140Q240 160 285 160H365" />
                  <path d="M0 118H170Q200 118 225 143L240 155Q250 160 285 160" />
                  <path d="M0 205H170Q200 205 225 180L240 165Q250 160 285 160" />
                  <path d="M0 290H130Q170 290 190 250L230 180Q240 160 285 160" />
                  <path d="M635 160H715Q760 160 770 140L810 75Q830 35 870 35H1000" />
                  <path d="M715 160Q750 160 760 155L775 143Q800 118 830 118H1000" />
                  <path d="M715 160Q750 160 760 165L775 180Q800 205 830 205H1000" />
                  <path d="M715 160Q760 160 770 180L810 250Q830 290 870 290H1000" />
                </g>
                <g className="cab-connected-energy" stroke="#69a9fa" strokeWidth="1.7"><path d="M0 35H130Q170 35 190 75L230 140Q240 160 285 160H365" pathLength="100" style={{ "--flow-delay": "0.0s" }} /><path d="M0 118H170Q200 118 225 143L240 155Q250 160 285 160" pathLength="100" style={{ "--flow-delay": "0.35s" }} /><path d="M0 205H170Q200 205 225 180L240 165Q250 160 285 160" pathLength="100" style={{ "--flow-delay": "0.7s" }} /><path d="M0 290H130Q170 290 190 250L230 180Q240 160 285 160" pathLength="100" style={{ "--flow-delay": "1.0499999999999998s" }} /><path d="M635 160H715Q760 160 770 140L810 75Q830 35 870 35H1000" pathLength="100" style={{ "--flow-delay": "1.4s" }} /><path d="M715 160Q750 160 760 155L775 143Q800 118 830 118H1000" pathLength="100" style={{ "--flow-delay": "1.75s" }} /><path d="M715 160Q750 160 760 165L775 180Q800 205 830 205H1000" pathLength="100" style={{ "--flow-delay": "2.0999999999999996s" }} /><path d="M715 160Q760 160 770 180L810 250Q830 290 870 290H1000" pathLength="100" style={{ "--flow-delay": "2.4499999999999997s" }} /></g>
              </svg>
              <div className="cab-connected-nodes cab-connected-inputs">
                {[["book", "Courses"], ["users", "Mentors"], ["spark", "Practical tools"], ["chat", "Community"]].map(([icon, label]) => <div className="cab-connected-node" key={label}><span><Icon type={icon} /></span><b>{label}</b></div>)}
              </div>
              <div className="cab-connected-dashboard">
                <div className="cab-connected-dashboard-top"><span className="cab-connected-monogram">C</span><b>Your learning workspace</b><span className="cab-connected-live">BUILD &amp; GROW</span></div>
                <div className="cab-connected-prompt"><Icon type="spark" /><span>What will you build with your next skill?</span></div>
                <div className="cab-connected-dashboard-body"><span className="cab-connected-label">YOUR PATH FORWARD</span><h3>Small steps. Real progress.</h3><div className="cab-connected-progress"><span /><span /><span /><span /></div><div className="cab-connected-stages"><span>Learn</span><span>Practice</span><span>Build</span><span>Grow</span></div></div>
                <div className="cab-connected-project"><span><Icon type="folder" /></span><div><b>Your portfolio starts here</b><small>Projects that put your learning into practice</small></div><ArrowRight size={16} aria-hidden="true" /></div>
              </div>
              <div className="cab-connected-nodes cab-connected-outputs">
                {[["target", "Campaign projects"], ["award", "Certifications"], ["folder", "Portfolio"], ["briefcase", "Career preparation"]].map(([icon, label]) => <div className="cab-connected-node" key={label}><span><Icon type={icon} /></span><b>{label}</b></div>)}
              </div>
            </div>
            <div className="cab-connected-footer"><span>ONE CONNECTED LEARNING JOURNEY</span><div>{["Learn", "Practice", "Build", "Grow"].map((label, index) => <React.Fragment key={label}>{index > 0 && <ArrowRight size={16} aria-hidden="true" />}<b>{label}</b></React.Fragment>)}</div></div>
          </div>
        </div>
      </section>

      <HomeOfferings />

      <section className="cab-section cab-courses-section">
        <div className="cab-shell">
          <Reveal>
            <div className="cab-section-head">
              <div>
                <div className="cab-eyebrow">OUR COURSES</div>
                <h2>Industry-Relevant Marketing Courses</h2>
                <p>Hands-on learning. Real tools. Actual results. Choose a course and start building your future today.</p>
              </div>
              <a className="cab-link-btn" href="/courses">View All Courses <ArrowRight aria-hidden="true" strokeWidth={2.5} /></a>
            </div>
          </Reveal>

          {loadingCourses ? (
            <div className="cab-course-grid">
              {[0, 1, 2, 3].map((n) => <div className="cab-skeleton" key={n} />)}
            </div>
          ) : visibleCourses.length ? (
            <div className={`cab-course-grid cab-course-grid-${visibleCourses.length}`}>
              {visibleCourses.map((course, index) => (
                <CourseCard
                  key={courseId(course) || `${courseName(course)}-${index}`}
                  course={course}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="cab-empty-state">
              {courseLoadError ? <><p role="alert">{courseLoadError}</p><button type="button" className="cab-link-btn" onClick={() => setCatalogReload(value => value + 1)}>Retry loading courses</button></> : "Published courses will appear here automatically from your real course catalog."}
            </div>
          )}
        </div>
      </section>

      <HomeCareerPaths />

      <section className="cab-section cab-tools" aria-labelledby="cab-tools-title">
        <div className="cab-shell">
          <div className="cab-tools-panel">
            <div className="cab-tools-orbits" aria-hidden="true">
              <svg viewBox="0 0 1080 700" preserveAspectRatio="none" fill="none">
                <defs><linearGradient id="tools-orbit-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="white" /><stop offset=".66" stopColor="white" /><stop offset=".88" stopColor="black" /></linearGradient><mask id="tools-orbit-mask"><rect width="1080" height="700" fill="url(#tools-orbit-fade)" /></mask></defs>
                <g mask="url(#tools-orbit-mask)" stroke="#e9ebef" strokeWidth="1">
                  <ellipse cx="540" cy="255" rx="270" ry="340" />
                  <ellipse cx="540" cy="255" rx="337" ry="407" />
                  <ellipse cx="540" cy="255" rx="404" ry="474" />
                  <ellipse cx="540" cy="255" rx="471" ry="541" />
                  <g stroke="#8d9ed0" strokeWidth="1.1" strokeLinecap="round">
                    <ellipse cx="540" cy="255" rx="270" ry="340" pathLength="1000" strokeDasharray="27 973" strokeDashoffset="-490" />
                    <ellipse cx="540" cy="255" rx="337" ry="407" pathLength="1000" strokeDasharray="30 970" strokeDashoffset="-62" />
                    <ellipse cx="540" cy="255" rx="404" ry="474" pathLength="1000" strokeDasharray="25 975" strokeDashoffset="-420" />
                    <ellipse cx="540" cy="255" rx="471" ry="541" pathLength="1000" strokeDasharray="24 976" strokeDashoffset="-960" />
                  </g>
                </g>
              </svg>
            </div>
            <div className="cab-tools-badges" aria-label="Tools covered across our courses">
              {[
                ["Google Ads", "/course-icons/google-ads.svg", "", "ads"],
                ["Meta Ads", "/course-icons/meta-ads.svg", "", "meta"],
                ["Google Analytics", "/course-icons/google-analytics.svg", "", "analytics"],
                ["HubSpot", "", "Hub", "hubspot"],
                ["Excel", "/course-icons/excel.svg", "", "excel"],
                ["Power BI", "/course-icons/power-bi.svg", "", "powerbi"],
                ["Python", "/course-icons/python.svg", "", "python"],
                ["SQL", "/course-icons/sql.svg", "", "sql"],
                ["n8n", "/course-icons/n8n.svg", "", "n8n"],
              ].map(([name, src, mark, tone]) => (
                <div className={`cab-tool-badge cab-tool-${tone}`} key={name}>
                  <span className="cab-tool-symbol">{src ? <img src={src} alt="" /> : mark}</span>
                  <span className="cab-tool-name">{name}</span>
                </div>
              ))}
            </div>
            <div className="cab-tools-content">
              <span className="cab-tools-eyebrow"><span /> PRACTICAL SKILLS. REAL TOOLS.</span>
              <h2 id="cab-tools-title">Learn the tools.<br /><span>Build your advantage.</span></h2>
              <p>Turn lessons into hands-on experience with the tools behind modern marketing, analytics and automation.</p>
              <Link className="cab-btn" to="/courses">Explore Courses <ArrowRight size={17} aria-hidden="true" /></Link>
              <div className="cab-tools-projects" aria-label="Examples of practical learning">
                <div className="cab-tools-project"><span className="cab-tools-project-icon"><Icon type="target" /></span><div><b>Your next campaign starts here</b><small>Plan, launch and measure with confidence</small></div><span className="cab-tools-project-check"><ShieldCheck size={16} aria-hidden="true" /></span></div>
                <div className="cab-tools-project"><span className="cab-tools-project-icon"><Icon type="folder" /></span><div><b>From data to a portfolio project</b><small>Build dashboards. Find insights. Show your skills.</small></div></div>
              </div>
            </div>
            <div className="cab-tools-footer"><span>LEARN BY DOING</span><p>Marketing <i /> Data Analytics <i /> AI &amp; Automation</p></div>
          </div>
        </div>
      </section>

      <section className="cab-section cab-community cab-community-arches" aria-labelledby="community-arches-title">
        <div className="cab-shell">
          <div className="community-arches-panel">
            <div className="community-arches-art" aria-hidden="true">
              <svg viewBox="0 0 1000 400" preserveAspectRatio="none" fill="none"><defs><linearGradient id="community-arch-fade" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#cbd7d2"/><stop offset="1" stopColor="#f5f8f6"/></linearGradient></defs><path d="M50 390Q180 -100 500 40Q820 -100 950 390" stroke="none"/><path d="M40 390C170 -55 830 -55 960 390M125 390C245 45 755 45 875 390" stroke="url(#community-arch-fade)" strokeWidth="2"/><g className="community-arch-moving" stroke="#9270d6" strokeWidth="2" strokeLinecap="round"><path d="M40 390C170 -55 830 -55 960 390" pathLength="100"/><path d="M125 390C245 45 755 45 875 390" pathLength="100"/></g></svg>
              {avatars.slice(0, 4).map((item, index) => <span className={`community-arch-avatar community-arch-avatar-${index + 1}`} key={index}><Avatar src={item.src} name="" fallbackSrc={item.fallbackSrc} /></span>)}
              <span className="community-arch-badge community-arch-post"><Icon type="chat" /> Fresh ideas, shared daily</span>
              <span className="community-arch-badge community-arch-answer"><ShieldCheck size={12} /> A little support goes a long way</span>
              <span className="community-arch-badge community-arch-heart"><Star size={14} aria-hidden="true" /> Celebrate progress</span>
              <span className="community-arch-icon community-arch-spark"><Icon type="spark" /></span>
              <span className="community-arch-icon community-arch-book"><Icon type="book" /></span>
              <span className="community-arch-icon community-arch-check"><ShieldCheck size={18} /></span>
              <span className="community-arch-badge community-arch-chat"><Icon type="chat" /> Keep the conversation going</span>
            </div>
            <div className="community-arches-content">
              <div className="community-arches-values"><div><strong>Connect</strong><span>Find your people</span></div><div><strong>Share</strong><span>Exchange fresh ideas</span></div><div><strong>Grow</strong><span>Move forward together</span></div></div>
              <h2 id="community-arches-title">Great learning starts<br />with a great community.</h2>
              <p>Ask questions, share your progress and connect with fellow learners in the CABROY Discord community.</p>
              <div className="community-arches-tags"><span><Icon type="chat" /> Ask questions</span><span><Icon type="spark" /> Share ideas</span><span><Icon type="users" /> Meet learners</span></div>
              <Link className="community-arches-join" to="/community"><FaDiscord aria-hidden="true" /> Join our Discord community <ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="cab-section cab-pricing" id="pricing">
        <div className="cab-shell">
          <Reveal>
            <div className="cab-section-head cab-pricing-head">
              <div>
                <div className="cab-eyebrow">CHOOSE YOUR PLAN</div>
                <h2>Invest in Your Marketing Career</h2>
                <p>Flexible plans for individuals and teams. Choose what works best for your goals.</p>
              </div>
              <div className="cab-billing" role="group" aria-label="Billing period">
                <button
                  className={billing === "monthly" ? "active" : ""}
                  type="button"
                  onClick={() => setBilling("monthly")}
                >
                  Monthly
                </button>
                <button
                  className={billing === "yearly" ? "active" : ""}
                  type="button"
                  onClick={() => setBilling("yearly")}
                >
                  Yearly
                </button>
              </div>
            </div>
          </Reveal>

          <div className="cab-pricing-grid">
            <Reveal delay={0}>
              <article className="cab-plan-card">
                <div className="cab-plan-title">
                  <span><Icon type="user" /></span>
                  <div><h3>Starter</h3><small>Perfect for beginners</small></div>
                </div>
                <div className="cab-plan-price">{money(planPrice(999))} <small>{billingSuffix}</small></div>
                <ul>
                  <li>Access to selected courses</li>
                  <li>Self-paced learning</li>
                  <li>Community access</li>
                  <li>Course certificates</li>
                </ul>
                <Link to={`/plans/starter?billing=${billing}`} className="cab-plan-button">Get Started</Link>
              </article>
            </Reveal>

            <Reveal delay={90}>
              <article className="cab-plan-card cab-plan-featured">
                <span className="cab-most-popular">Most Popular</span>
                <div className="cab-plan-title">
                  <span><Icon type="award" /></span>
                  <div><h3>Pro</h3><small>For serious learners</small></div>
                </div>
                <div className="cab-plan-price">{money(planPrice(1999))} <small>{billingSuffix}</small></div>
                <ul>
                  <li>Access to all courses</li>
                  <li>1:1 mentor sessions (limited)</li>
                  <li>Live sessions & doubt clearing</li>
                  <li>Projects & certifications</li>
                  <li>Discord community access</li>
                </ul>
                <Link to={`/plans/pro?billing=${billing}`} className="cab-plan-button filled">Get Started</Link>
              </article>
            </Reveal>

            <Reveal delay={180}>
              <article className="cab-plan-card">
                <div className="cab-plan-title">
                  <span><Icon type="users" /></span>
                  <div><h3>Business</h3><small>For teams & organizations</small></div>
                </div>
                <div className="cab-plan-price">{money(planPrice(6000))} <small>{billingSuffix}</small></div>
                <ul>
                  <li>Manage multiple students & courses</li>
                  <li>Dedicated mentor support</li>
                  <li>Live sessions & private doubt clearing</li>
                  <li>Custom learning paths</li>
                  <li>Priority support & onboarding</li>
                </ul>
                <Link to={`/plans/business?billing=${billing}`} className="cab-plan-button">Get Started</Link>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="cab-section cab-testimonials" aria-labelledby="learner-stories-title">
        <div className="cab-shell">
          <Reveal>
            <div className="learner-stories">
              <div className="learner-stories-intro">
                <span className="learner-stories-label"><Star aria-hidden="true" /> STUDENT STORIES</span>
                <span className="learner-preview-label">Sample testimonials - Design preview</span>
                <h2 id="learner-stories-title">Real learners.<br /><span>Real experiences.</span></h2>
                <p>Every learning journey is different. Hear what our students have to say about theirs.</p>
                <Link to="/courses" className="learner-stories-link">Find your next course <ArrowRight aria-hidden="true" /></Link>
              </div>
              <div className={`learner-reviews${testimonials.length === 1 ? " learner-reviews-single" : ""}`}>
                {testimonials.length ? testimonials.map((review, index) => (
                  <ReviewCard key={review?._id || review?.id || index} review={review} />
                )) : (
                  <div className="learner-reviews-empty"><Quote aria-hidden="true" /><h3>Your journey could inspire someone.</h3><p>Student stories will appear here as learners share their experiences.</p></div>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>


      <section className="cab-section cab-certification" aria-labelledby="cab-certification-title">
        <div className="cab-shell">
          <Reveal>
            <div className="cab-certification-panel">
              <div className="cab-certification-copy">
                <div className="cab-eyebrow">CERTIFICATION</div>
                <h2 id="cab-certification-title">
                  Earn a Certificate That Proves Your Skills
                </h2>
                <p>
                  Complete your CABROY course and receive a professional,
                  verifiable certificate designed to showcase your practical
                  marketing skills and learning achievement.
                </p>

                <div className="cab-certification-points">
                  <div>
                    <span><Icon type="award" /></span>
                    <div>
                      <b>Industry-Ready Credential</b>
                      <small>Showcase your completed learning with confidence.</small>
                    </div>
                  </div>

                  <div>
                    <span><Icon type="briefcase" /></span>
                    <div>
                      <b>Built for Your Portfolio</b>
                      <small>Add it to your CV, LinkedIn profile and portfolio.</small>
                    </div>
                  </div>

                  <div>
                    <span><Icon type="target" /></span>
                    <div>
                      <b>Easy to Verify</b>
                      <small>Certificate ID and verification-ready format.</small>
                    </div>
                  </div>
                </div>

                <a className="cab-btn cab-certification-cta" href="/courses">
                  Explore Certificate Courses <b>→</b>
                </a>
              </div>

              <div className="cab-certification-preview">
                <div className="cab-certification-glow" aria-hidden="true" />
                <img
                  src="/cabroy-course-completion-certificate.png"
                  alt="CABROY School of Marketing course completion certificate"
                />
                <span className="cab-certification-badge">
                  <Icon type="award" />
                  <b>Course Completion Certificate</b>
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="cab-section cab-global" aria-labelledby="cab-global-title">
        <div className="cab-shell">
          <Reveal>
            <div className="cab-global-card">
              <div className="cab-global-copy">
                <h2 id="cab-global-title">Learn Today. Work Anywhere.</h2>
                <p>Gain in-demand marketing skills and open doors to opportunities across India and the world.</p>
                <div className="cab-global-buttons">
                  <Link className="cab-btn" to="/courses">Explore Courses <ArrowRight size={16} aria-hidden="true" /></Link>
                  <button type="button" className="cab-btn cab-btn-light" onClick={() => setBrochureOpen(true)}><Download aria-hidden="true" /> Download Brochure</button>
                </div>
                <div className="cab-global-points">
                  <span><PencilRuler aria-hidden="true" /> Practical Skills</span>
                  <span><Globe2 aria-hidden="true" /> Global Opportunities</span>
                  <span><ShieldCheck aria-hidden="true" /> Future-Ready Career</span>
                </div>
              </div>
              <div className="cab-global-note"><Send aria-hidden="true" /><span>Marketing<br />Has No Boundaries</span></div>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="cab-footer">
        <div className="cab-shell cab-footer-grid">
          <div>
            <div className="cab-footer-brand">
              <img className="cab-footer-logo" src="/cabroy-logo-original.png" alt="CABROY crest" />
              <span><b>CABROY</b><small>SCHOOL OF MARKETING</small></span>
            </div>
            <strong>Strategy. Skills. Success.</strong>
            <p>Practical marketing education for a brighter tomorrow.</p>
          </div>

          <div>
            <h4>Quick Links</h4>
            <a href="/">Home</a>
            <a href="/courses">Courses</a>
            <a href="/community">Community</a>
            <a href="/pricing">Pricing</a>
          </div>

          <div>
            <h4>Company</h4>
            <a href="/about">About Us</a>
            <button className="cab-footer-link" type="button" onClick={() => { setMenuOpen(false); setCounsellingOpen(true); }}>Contact</button>
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms & Conditions</a>
            <a href="/careers">Careers</a>
          </div>

          <div>
            <h4>Stay Updated</h4>
            <p>Get marketing tips, course updates and more.</p>
            <form className="cab-email" action="/contact">
              <input type="email" name="email" aria-label="Email address" placeholder="Enter your email address" required />
              <button type="submit" aria-label="Continue with your email"><ArrowRight aria-hidden="true" /></button>
            </form>
          </div>
        </div>

        <div className="cab-shell cab-footer-bottom">
          <span>© 2026 CABROY School of Marketing. All rights reserved.</span>
          <span>Made for Marketers. Built for a Brighter Tomorrow.</span>
        </div>
      </footer>
    </main>
  );
}

