import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { normalizeLiveCourse } from "../utils/liveCourses";
import CourseDetailReference from "./CourseDetailReference";
export default function LiveCourseDetails({ courseId }) {
 const [course, setCourse] = useState(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");
 const [missing, setMissing] = useState(false);
 const [reload, setReload] = useState(0);
 useEffect(() => {
  const controller = new AbortController();
  api.get(`/courses/${encodeURIComponent(courseId)}`, { signal: controller.signal }).then(({ data }) => {
   if (controller.signal.aborted) return;
   if (!data.course?.isPublished) { setMissing(true); setCourse(null); return; }
   setCourse(normalizeLiveCourse(data.course, api.defaults.baseURL)); setError(""); setMissing(false);
  }).catch(err => { if (!controller.signal.aborted) { setMissing(err.response?.status === 404); setError(err.response?.data?.message || "Could not load this course. Please try again."); } })
   .finally(() => { if (!controller.signal.aborted) setLoading(false); });
  return () => controller.abort();
 }, [courseId, reload]);
 if (loading) return <main className="grid min-h-[60vh] place-items-center p-6"><p role="status">Loading course...</p></main>;
 if (missing || error || !course) return <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center"><h1 className="text-2xl font-bold">{missing ? "Course not found" : "Course unavailable"}</h1><p role={missing ? undefined : "alert"}>{missing ? "This course is not currently published." : error}</p>{!missing && <button type="button" className="rounded-lg bg-blue-600 px-5 py-3 text-white" onClick={() => { setLoading(true); setReload(value => value + 1); }}>Retry</button>}<Link className="font-semibold text-blue-600" to="/courses">Browse courses</Link></main>;
 return <CourseDetailReference course={course} />;
}
