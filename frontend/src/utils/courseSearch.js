const normalize = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function searchCourses(courses, query) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return courses;
  const matches = (text) => words.every((word) => normalize(text).includes(word));
  const titles = courses.filter((course) => matches(course.title));
  if (titles.length) return titles;
  return courses.filter((course) => matches([course.title, ...(course.tags || course.skills || [])].join(" ")));
}
