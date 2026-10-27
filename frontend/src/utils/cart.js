import { courses } from "../data/courses";
import { exploreCourses } from "../data/exploreCourses";

const catalog = [...courses, ...exploreCourses];
const programImages = {
  "digital-marketing": "/digital-marketing-course.jpg",
  "data-analytics": "/data-analytics-course.jpg",
  "ai-automation": "/ai-automation-course.jpg",
};

export function readCartItems() {
  try {
    const stored = JSON.parse(localStorage.getItem("rathi-cart") || "[]");
    return Array.isArray(stored) ? stored.filter((item) => item && typeof item.id === "string" && typeof item.title === "string" && Number.isFinite(Number(item.price)) && Number(item.price) >= 0) : [];
  } catch { return []; }
}

export function describeCartItem(item) {
  const isBundle = item.type === "bundle";
  const known = catalog.find((course) => course.id === item.id);
  const ids = [...new Set(Array.isArray(item.courses) ? item.courses.filter((id) => typeof id === "string") : [])];
  const included = ids.map((id) => catalog.find((course) => course.id === id)).filter(Boolean);
  const price = Number(item.price) || 0;
  const comparisonPrice = isBundle && included.length === ids.length && ids.length > 0
    ? included.reduce((sum, course) => sum + course.price, 0)
    : price;
  const originalPrice = Math.max(price, comparisonPrice);
  return {
    isBundle,
    image: item.image || known?.image || programImages[item.id] || (isBundle ? "/combined-program-graphic.png" : ""),
    category: known?.category || "Course",
    level: known?.level || "Individual course",
    courseCount: isBundle ? ids.length || 1 : 1,
    modules: isBundle ? included.reduce((sum, course) => sum + (course.modules?.length || 0), 0) : known?.modules?.length || 0,
    tags: isBundle ? included.map((course) => course.title.replace(" Mastery", "")) : (known?.tags || known?.skills || []).slice(0, 4),
    href: isBundle ? `/courses?bundle=${encodeURIComponent(ids.join(","))}` : `/courses/${encodeURIComponent(item.id)}`,
    originalPrice,
    savings: originalPrice - price,
  };
}

export function getCartTotals(items) {
  return items.reduce((totals, item) => {
    const detail = describeCartItem(item);
    return {
      total: totals.total + Number(item.price),
      savings: totals.savings + detail.savings,
      originalTotal: totals.originalTotal + detail.originalPrice,
      courseCount: totals.courseCount + detail.courseCount,
    };
  }, { total: 0, savings: 0, originalTotal: 0, courseCount: 0 });
}
