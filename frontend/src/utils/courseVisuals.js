export function courseVisual(course) {
 const topic = `${course.categoryGroup || ""} ${course.category || ""} ${course.slug || ""} ${course.title || ""}`.toLowerCase();
 if (/automation|artificial intelligence|\bai\b/.test(topic)) return "/course-automation-cinematic.png";
 if (/analytic|python|power.?bi|\bsql\b/.test(topic)) return "/course-analytics-cinematic.png";
 if (/marketing|google.?ads|social.?media/.test(topic)) return "/course-marketing-cinematic.png";
 return "";
}
