import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  Flame,
  Grid3X3,
  Headphones,
  Heart,
  Infinity as InfinityIcon,
  Loader2,
  MessageCircle,
  RefreshCw,
  Star,
} from "lucide-react";
import api from "../api/client";
import { courseThumbnail } from "../utils/courseThumbnail";
import { CourseFeedbackButton } from "../components/CourseFeedback";
import skillsBanner from "./assets/my-courses-girl-clear.png";
import "./MyCourses.css";
import "./MyCoursesRefresh.css";

const FALLBACK_IMAGE = "/digital-marketing-course.jpg";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatPrice(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function initials(name = "Rathi Academy") {
  return String(name)
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function CourseImage({ src, alt, className = "" }) {
  return (
    <img
      src={courseThumbnail(src, api.defaults.baseURL) || FALLBACK_IMAGE}
      alt={alt}
      className={className}
      onError={(event) => {
        if (!event.currentTarget.dataset.fallbackApplied) {
          event.currentTarget.dataset.fallbackApplied = "1";
          event.currentTarget.src = FALLBACK_IMAGE;
        }
      }}
    />
  );
}

export default function MyCourses() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [purchasedCourses, setPurchasedCourses] = useState([]);
  const [catalogCourses, setCatalogCourses] = useState([]);
  const [certificateCount, setCertificateCount] = useState(0);
  const [sortMode, setSortMode] = useState("recent");

  const loadPageData = useCallback(async ({ silent = false } = {}) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const [paymentsResult, catalogResult, certificatesResult] = await Promise.allSettled([
        api.get("/payments/me"),
        api.get("/courses?published=all"),
        api.get("/certificates/me"),
      ]);

      if (paymentsResult.status === "rejected") throw paymentsResult.reason;

      const payments = paymentsResult.value.data?.payments || [];
      const paidPayments = payments.filter((payment) => payment?.status === "paid");
      const purchaseMap = new Map();

      for (const payment of paidPayments) {
        const paymentCourses = Array.isArray(payment?.courses)
          ? payment.courses
          : payment?.course
            ? [payment.course]
            : [];

        for (const course of paymentCourses) {
          if (!course?._id) continue;
          const id = String(course._id);
          const purchaseDate = payment.createdAt || payment.updatedAt || null;
          const previous = purchaseMap.get(id);

          if (!previous) {
            purchaseMap.set(id, { id, basic: course, purchaseDate });
            continue;
          }

          const oldTime = new Date(previous.purchaseDate || 0).getTime();
          const newTime = new Date(purchaseDate || 0).getTime();
          if (newTime > oldTime) purchaseMap.set(id, { id, basic: course, purchaseDate });
        }
      }

      const purchases = Array.from(purchaseMap.values());
      const detailResults = await Promise.allSettled(
        purchases.map((record) => api.get(`/courses/${record.id}`))
      );

      const realPurchased = purchases.map((record, index) => {
        const detailResult = detailResults[index];
        const detail = detailResult.status === "fulfilled" ? detailResult.value.data : null;
        const course = detail?.course || record.basic || {};

        return {
          id: record.id,
          slug: course.slug || "",
          title: course.title || record.basic?.title || "Purchased Course",
          subtitle:
            course.shortDescription ||
            course.description ||
            "Access your purchased course and learning resources.",
          image: course.thumbnail || record.basic?.thumbnail || FALLBACK_IMAGE,
          instructor: course.instructor?.name || "Rathi Academy",
          purchaseDate: record.purchaseDate,
          price: course.price ?? record.basic?.price ?? 0,
        };
      });

      setPurchasedCourses(realPurchased);

      const liveCatalog =
        catalogResult.status === "fulfilled" ? catalogResult.value.data?.courses || [] : [];
      setCatalogCourses(liveCatalog);

      setCertificateCount(
        certificatesResult.status === "fulfilled"
          ? certificatesResult.value.data?.certificates?.length || 0
          : 0
      );
    } catch (err) {
      setPurchasedCourses([]);
      setCatalogCourses([]);
      setError(
        err?.response?.data?.message ||
          "We could not load your purchased courses. Please try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    loadPageData();

    const refresh = () => mounted && loadPageData({ silent: true });
    const refreshWhenVisible = () => {
      if (mounted && document.visibilityState === "visible") refresh();
    };

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      mounted = false;
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [loadPageData]);

  const purchasedIds = useMemo(
    () => new Set(purchasedCourses.map((course) => String(course.id))),
    [purchasedCourses]
  );

  const sortedPurchasedCourses = useMemo(() => {
    const copy = [...purchasedCourses];
    if (sortMode === "title") copy.sort((a, b) => a.title.localeCompare(b.title));
    else {
      copy.sort(
        (a, b) =>
          new Date(b.purchaseDate || 0).getTime() - new Date(a.purchaseDate || 0).getTime()
      );
    }
    return copy;
  }, [purchasedCourses, sortMode]);

  const recommendations = useMemo(() => {
    const realCourses = catalogCourses
      .filter((course) => course?._id)
      .sort((a, b) => {
        const learnerDifference = Number(b.students || 0) - Number(a.students || 0);
        if (learnerDifference) return learnerDifference;
        const ratingDifference = Number(b.rating || 0) - Number(a.rating || 0);
        if (ratingDifference) return ratingDifference;
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

    // Prefer real courses the student has not purchased. If the current backend
    // catalog only contains purchased courses, show those real courses instead
    // of inserting any dummy/fallback cards.
    const unpurchased = realCourses.filter(
      (course) => !purchasedIds.has(String(course._id))
    );
    const alreadyPurchased = realCourses.filter(
      (course) => purchasedIds.has(String(course._id))
    );

    return [...unpurchased, ...alreadyPurchased].slice(0, 3).map((course) => ({
      ...course,
      __purchased: purchasedIds.has(String(course._id)),
    }));
  }, [catalogCourses, purchasedIds]);

  function openCourseDetails(course) {
    if (course?.__purchased) {
      openCourseJourney({ id: course._id || course.id || course.slug });
      return;
    }
    const identifier = course?.slug || course?._id || course?.id;
    if (identifier) navigate(`/courses/${identifier}`);
  }

  function openCourseJourney(course) {
    const identifier = course?.id || course?._id || course?.slug;
    if (identifier) navigate(`/course-journey/${identifier}`);
  }

  if (loading) {
    return (
      <div className="mcx-loading-page">
        <Loader2 className="mcx-spin" size={30} />
        <p>Loading your purchased courses...</p>
      </div>
    );
  }

  const showExploreBelow = sortedPurchasedCourses.length >= 3;
  const gridSlots = showExploreBelow
    ? 3
    : Math.min(Math.max(sortedPurchasedCourses.length + 1, 2), 3);

  return (
    <div className="mcx-page">
      <section className="mcx-hero">
        <div className="mcx-shell mcx-hero-grid">
          <div className="mcx-heading-wrap">
            <div className="mcx-heading-line">
              <h1>My Courses</h1>
              {refreshing && <RefreshCw size={15} className="mcx-spin mcx-refresh" />}
            </div>
            <p>Access your purchased courses and learning resources.</p>
          </div>

          <div className="mcx-reference-banner-wrap">
            <div className="mcx-banner-copy">
              <strong>Skills today. A better tomorrow.</strong>
              <p>Keep learning, keep growing!</p>
            </div>
            <div className="mcx-banner-art" aria-hidden="true">
              <img src={skillsBanner} alt="" className="mcx-reference-banner" />
            </div>
          </div>
        </div>
      </section>

      <div className="mcx-shell">
        <nav className="mcx-tabs" aria-label="My courses navigation">
          <button type="button" className="mcx-tab mcx-tab-active" aria-current="page">
            <BookOpen size={17} /> My Courses
          </button>
          <button type="button" className="mcx-tab" onClick={() => navigate("/courses")}>
            <Grid3X3 size={17} /> Explore More
          </button>
        </nav>

        <section className="mcx-stats">
          <SummaryCard
            icon={BookOpen}
            tone="blue"
            value={purchasedCourses.length}
            label="Enrolled Courses"
          />
          <SummaryCard
            icon={Award}
            tone="indigo"
            value={certificateCount}
            label="Certificates"
            onClick={() => navigate("/certificates")}
          />
          <SummaryCard
            icon={InfinityIcon}
            tone="green"
            value="Lifetime Access"
            label="Learn at your own pace"
          />
          <SummaryCard
            icon={Headphones}
            tone="purple"
            value="Need Help?"
            label="Visit Support"
            onClick={() => navigate("/community")}
            linkLabel
          />
        </section>

        {error && (
          <div className="mcx-error">
            <div>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
            <button type="button" onClick={() => loadPageData()}>
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        <section className="mcx-section mcx-enrolled-section">
          <div className="mcx-section-head">
            <div>
              <h2>Your Enrolled Courses</h2>
              <p>Open your purchased courses and continue your course journey anytime.</p>
            </div>
            {purchasedCourses.length > 1 && (
              <label className="mcx-sort">
                <span>Sort by:</span>
                <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
                  <option value="recent">Recently Purchased</option>
                  <option value="title">Course Name</option>
                </select>
              </label>
            )}
          </div>

          <div className={`mcx-enrolled-grid mcx-cols-${gridSlots}`}>
            {sortedPurchasedCourses.map((course) => (
              <PurchasedCourseCard
                key={course.id}
                course={course}
                onOpenCourse={() => openCourseJourney(course)}
              />
            ))}
            {!showExploreBelow && <ExploreCard onExplore={() => navigate("/courses")} />}
          </div>

          {showExploreBelow && (
            <div className="mcx-explore-below">
              <ExploreCard onExplore={() => navigate("/courses")} />
            </div>
          )}

          {purchasedCourses.length === 0 && !error && (
            <div className="mcx-empty-note">
              You have not purchased a course yet. Explore the academy to begin your learning journey.
            </div>
          )}
        </section>

        <section className="mcx-section mcx-popular-section">
          <div className="mcx-section-head mcx-popular-head">
            <div className="mcx-title-with-icon">
              <Flame size={25} />
              <div>
                <h2>Popular Courses for You</h2>
                <p>Real courses from the current Rathi Academy catalog.</p>
              </div>
            </div>
            <button className="mcx-outline-action" type="button" onClick={() => navigate("/courses")}>
              View All Courses <ArrowRight size={13} />
            </button>
          </div>

          {recommendations.length > 0 ? (
            <div className="mcx-recommendations-grid">
              {recommendations.map((course) => (
                <RecommendationCard
                  key={course._id}
                  course={course}
                  onOpen={() => openCourseDetails(course)}
                />
              ))}
            </div>
          ) : (
            <div className="mcx-real-catalog-empty">
              No additional real courses are available in the backend catalog yet.
            </div>
          )}
        </section>

        {purchasedCourses.length > 0 && (
          <section className="mcx-section mcx-feedback-section">
            <div className="mcx-section-head mcx-feedback-head">
              <div className="mcx-title-with-icon mcx-feedback-title">
                <MessageCircle size={24} />
                <div>
                  <h2>Course Feedback</h2>
                  <p>Help us improve by sharing feedback for your purchased courses.</p>
                </div>
              </div>
            </div>

            <div className="mcx-feedback-grid">
              {sortedPurchasedCourses.map((course) => (
                <div key={course.id} className="mcx-feedback-card">
                  <div className="mcx-feedback-course">
                    <CourseImage
                      src={course.image}
                      alt={course.title}
                      className="mcx-feedback-thumb"
                    />
                    <div className="mcx-feedback-copy">
                      <h3>{course.title}</h3>
                      <p>
                        <CalendarDays size={11} />
                        Purchased {formatDate(course.purchaseDate) || "recently"}
                      </p>
                    </div>
                  </div>
                  <CourseFeedbackButton
                    courseId={course.id}
                    courseTitle={course.title}
                    className="mcx-feedback-button"
                  />
                </div>
              ))}
              <div className="mcx-feedback-note">
                <div className="mcx-feedback-heart"><Heart size={18} fill="currentColor" /></div>
                <div>
                  <strong>Enjoying your learning experience?</strong>
                  <span>Your feedback helps us create better courses for you.</span>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, tone, value, label, onClick, linkLabel = false }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={onClick ? "mcx-summary mcx-summary-clickable" : "mcx-summary"}
    >
      <span className={`mcx-summary-icon mcx-tone-${tone}`}><Icon size={21} /></span>
      <span className="mcx-summary-copy">
        <strong>{value}</strong>
        <span className={linkLabel ? "mcx-summary-link" : ""}>{label}</span>
      </span>
    </Tag>
  );
}

function PurchasedCourseCard({ course, onOpenCourse }) {
  return (
    <article className="mcx-course-card">
      <div className="mcx-course-media">
        <CourseImage src={course.image} alt={course.title} className="mcx-course-image" />
        <span className="mcx-purchased-pill">Purchased</span>
      </div>

      <div className="mcx-course-body">
        <h3>{course.title}</h3>
        <p className="mcx-course-subtitle">{course.subtitle}</p>

        <div className="mcx-instructor-row">
          <span>{initials(course.instructor)}</span>
          <strong>{course.instructor}</strong>
        </div>

        <div className="mcx-material-row">
          <div className="mcx-material-info">
            <span className="mcx-drive-badge"><BookOpen size={18} /></span>
            <div>
              <strong>Course Journey</strong>
              <span>Open modules, sessions and learning resources</span>
            </div>
          </div>
          <button type="button" onClick={onOpenCourse} className="mcx-drive-button">
            Open Course <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </article>
  );
}

function ExploreCard({ onExplore }) {
  return (
    <button
      type="button"
      className="mcx-explore-card-reference"
      onClick={onExplore}
      aria-label="Explore more courses"
    >
      <span className="mcx-explore-plus-wrap" aria-hidden="true">
        <span className="mcx-explore-ray mcx-explore-ray-left" />
        <span className="mcx-explore-ray mcx-explore-ray-right" />
        <span className="mcx-explore-ray mcx-explore-ray-left-small" />
        <span className="mcx-explore-ray mcx-explore-ray-right-small" />
        <span className="mcx-explore-plus">+</span>
      </span>
      <strong>Explore More Courses</strong>
      <span className="mcx-explore-subtitle">Add new skills to your learning journey.</span>
      <span className="mcx-explore-button">
        Browse All Courses <ArrowRight size={21} />
      </span>
    </button>
  );
}

function RecommendationCard({ course, onOpen }) {
  return (
    <article className="mcx-recommendation-card">
      <CourseImage src={course.thumbnail} alt={course.title} className="mcx-rec-thumb" />
      <div className="mcx-rec-copy">
        <div className="mcx-rec-top">
          <h3>{course.title}</h3>
          {course.__purchased && <span className="mcx-rec-owned">Purchased</span>}
        </div>
        <div className="mcx-rec-meta">
          {Number(course.rating || 0) > 0 && (
            <span><Star size={11} fill="currentColor" /> {Number(course.rating).toFixed(1)}</span>
          )}
          {Number(course.students || 0) > 0 && (
            <span>{Number(course.students).toLocaleString("en-IN")} learners</span>
          )}
        </div>
        <div className="mcx-rec-bottom">
          <strong>{formatPrice(course.price)}</strong>
          <button type="button" onClick={onOpen}>
            {course.__purchased ? "Open Course" : "View Details"}
          </button>
        </div>
      </div>
    </article>
  );
}
