// Illustrative finished-project visuals, separate from course cover images.
const visuals = {
 marketing: { src: "/portfolio-marketing.png", alt: "Illustrative marketing portfolio with campaign creatives, a strategy brief and performance charts" },
 analytics: { src: "/portfolio-analytics.png", alt: "Illustrative analytics portfolio with an interactive dashboard, dataset and insight report" },
 automation: { src: "/portfolio-automation.png", alt: "Illustrative AI automation portfolio with a connected workflow and project report" },
};
export function portfolioVisual(course) {
 const category = String(course.category || course.categoryGroup || "").toLowerCase();
 const topic = /marketing|analytics|analysis|automation|\bai\b/.test(category) ? category : String(course.title || course.id || "").toLowerCase();
 if (/automation|\bai\b/.test(topic)) return visuals.automation;
 if (/marketing/.test(topic)) return visuals.marketing;
 if (/analytics|analysis|data science/.test(topic)) return visuals.analytics;
 return null;
}
