import CourseJourneyView from "./CourseJourneyView";
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/client";

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.round(totalSeconds || 0));
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatCourseDuration(course) {
  if (course?.duration) return course.duration;
  const minutes = Number(course?.durationMinutes || 0);
  if (!minutes) return "Self-paced";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (!hours) return `${remainingMinutes} min`;
  if (!remainingMinutes) return `${hours} hr`;
  return `${hours} hr ${remainingMinutes} min`;
}

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Groups the flat lessons array (already sorted by `order`) into
// [{ title, lessons: [...] }] modules, preserving first-seen order.
function groupLessonsByModule(lessons) {
  const map = new Map();
  for (const lesson of lessons) {
    const key = lesson.module || "Course Content";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(lesson);
  }
  return Array.from(map.entries()).map(([title, groupedLessons]) => ({
    title,
    lessons: groupedLessons,
  }));
}

export default function CourseJourney() {
  const { courseId } = useParams();

  const [course, setCourse] = useState(null);
  const [materialsBusy, setMaterialsBusy] = useState(false);
  const [materialsError, setMaterialsError] = useState("");
  async function openMaterials() {
    setMaterialsBusy(true); setMaterialsError("");
    try { const { data } = await api.get(`/courses/${course._id}/materials`); if (!data.url || !/^https:\/\//i.test(data.url)) { setMaterialsError("Materials are not available yet. Please contact your instructor."); return; } window.location.assign(data.url); } catch (err) { setMaterialsError(err.response?.data?.message || "Could not open course materials. Please try again."); } finally { setMaterialsBusy(false); }
  }
  const [lessons, setLessons] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openModules, setOpenModules] = useState(() => new Set([0]));

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [{ data: courseData }, { data: enrollmentData }] = await Promise.all([
          api.get(`/courses/${courseId}`),
          api.get("/enrollments/me"),
        ]);

        if (cancelled) return;

        const loadedCourse = courseData.course;
        const matchingEnrollment = (enrollmentData.enrollments || []).find(
          (item) => String(item.course?._id) === String(loadedCourse?._id)
        );

        setCourse(loadedCourse);
        setLessons(courseData.lessons || []);
        setEnrollment(matchingEnrollment || null);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || "Could not load this course.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  function toggleModule(index) {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  const moduleGroups = useMemo(() => groupLessonsByModule(lessons), [lessons]);
  const assignedInstructor = enrollment?.mentor || null;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500">
        Loading course...
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-center">
        <p className="text-slate-600">{error || "Course not found"}</p>
        <Link to="/dashboard" className="font-semibold text-blue-600">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return <CourseJourneyView course={course} enrollment={enrollment} lessons={lessons} moduleGroups={moduleGroups} openModules={openModules} toggleModule={toggleModule} openMaterials={openMaterials} materialsBusy={materialsBusy} materialsError={materialsError} courseDuration={formatCourseDuration(course)} />;
}
