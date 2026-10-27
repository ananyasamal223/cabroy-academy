export function getProgramCourses(catalog, ids) {
  return [...new Set(ids)].map((id) => catalog.find((course) => course.id === id)).filter(Boolean);
}

export function getProgramPrice(courses) {
  const total = courses.reduce((sum, course) => sum + course.price, 0);
  if (courses.some(course => course.isBackendCourse)) return total;
  if (courses.length === 3) return 12999;
  return courses.length === 2 ? Math.round(total * 0.84) : total;
}

export function createProgramCartItem(catalog, ids) {
  const courses = getProgramCourses(catalog, ids);
  if (!courses.length) return null;
  if (courses.length === 1) {
    const { id, title, price, image } = courses[0];
    return { id, title, price, image, type: "course" };
  }
  const orderedIds = courses.map((course) => course.id);
  return {
    id: `combined-${[...orderedIds].sort().join("-")}`,
    title: courses.map((course) => course.title.replace(" Mastery", "")).join(" + "),
    price: getProgramPrice(courses),
    image: "/combined-program-graphic.png",
    type: "bundle",
    courses: orderedIds,
  };
}
