import { courseVisual } from "./courseVisuals.js";
export function normalizeLiveCourse(course, apiBase = "http://localhost:5000/api") {
 const origin = apiBase.replace(/\/api\/?$/, "");
 const category = course.category || "General";
 const categoryGroup = ({ "Digital Marketing": "Marketing", "Data Analytics": "Analytics", "AI & Automation": "AI & Automation" })[category] || category;
 const curriculum = Array.isArray(course.curriculum) && course.curriculum.length ? course.curriculum : (course.modules || []).map(title => ({ title, submodules: [] }));
 const thumbnail = courseVisual(course) || course.thumbnail || "/courses-skills-3d.png";
 return { ...course, id: String(course._id), isBackendCourse: true, title: course.title || "Untitled course", category, categoryGroup, categoryLabel: category, description: course.shortDescription || course.description || "", fullDescription: course.description || "", price: Number(course.price) || 0, originalPrice: course.originalPrice == null ? null : Number(course.originalPrice), image: thumbnail.startsWith("/uploads/") ? origin + thumbnail : thumbnail, tags: course.tags?.length ? course.tags : course.skills || [], skills: course.skills || [], requirements: course.requirements || [], curriculum, modules: curriculum.map(module => module.title), projects: course.projects || [], level: course.level || "Beginner", durationHours: Number(course.durationMinutes || 0) / 60, languages: course.languages || [], accent: categoryGroup === "AI & Automation" ? "purple" : "blue" };
}
