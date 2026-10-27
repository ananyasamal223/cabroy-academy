import "dotenv/config";
import { connectDB } from "../config/db.js";
import User from "../models/User.js";
import Course from "../models/Course.js";
import Lesson from "../models/Lesson.js";

// Deterministic, readable per-module lesson lists (title + duration in seconds),
// modelled after a real curriculum accordion: a few short lessons per module.
function lessonsFor(moduleTitle) {
  const bank = [
    ["Why This Module Matters", 44],
    ["Core Concepts Explained", 339],
    ["The Secret To Getting This Right", 82],
    ["Common Mistakes To Avoid", 685],
    ["Hands-On Walkthrough", 316],
    ["Recap & Key Takeaways", 171],
  ];
  // Use 4 of the 6 per module so it doesn't feel identical everywhere
  return bank.slice(0, 4).map(([suffix, seconds], i) => ({
    title: `${moduleTitle}: ${suffix}`,
    durationSeconds: seconds,
    order: i,
  }));
}

const courses = [
  {
    slug: "digital-marketing",
    category: "Digital Marketing",
    title: "Digital Marketing Mastery",
    description:
      "Learn SEO, social media, paid ads, content strategy, analytics and performance marketing through practical modules.",
    level: "Beginner to Advanced",
    duration: "10 Modules",
    sessions: 5,
    price: 4999,
    originalPrice: 7999,
    rating: 4.8,
    students: 12000,
    skills: ["SEO", "Google Ads", "Social Media", "Analytics"],
    modules: [
      "Digital Marketing Foundations",
      "Understanding Customers & Funnels",
      "SEO Fundamentals",
      "Content & Social Media",
      "Meta Advertising",
      "Google Ads",
      "Email Marketing",
      "Analytics & Tracking",
      "Performance Marketing",
      "Final Project Overview",
    ],
  },
  {
    slug: "data-analytics",
    category: "Data Analytics",
    title: "Data Analytics Mastery",
    description:
      "Learn Excel, SQL, Power BI, Python and business analytics through practical projects and guided sessions.",
    level: "Beginner to Intermediate",
    duration: "10 Modules",
    sessions: 5,
    price: 5499,
    originalPrice: 8499,
    rating: 4.8,
    students: 8500,
    skills: ["Excel", "SQL", "Power BI", "Python"],
    modules: [
      "Introduction to Data Analytics",
      "Excel for Data Analysis",
      "Data Cleaning",
      "SQL Fundamentals",
      "Advanced SQL",
      "Power BI Fundamentals",
      "Dashboard Building",
      "Python for Analytics",
      "Business Case Studies",
      "Final Analytics Project",
    ],
  },
  {
    slug: "ai-automation",
    category: "AI & Automation",
    title: "AI Automation Mastery",
    description:
      "Build AI-powered workflows using APIs, webhooks, LLMs, automation tools and practical business use cases.",
    level: "Intermediate",
    duration: "10 Modules",
    sessions: 5,
    price: 6499,
    originalPrice: 9999,
    rating: 4.9,
    students: 7200,
    skills: ["n8n", "APIs", "Webhooks", "LLMs"],
    modules: [
      "AI Automation Foundations",
      "APIs & Webhooks",
      "n8n Fundamentals",
      "Building Automation Workflows",
      "LLM Integration",
      "RAG & Knowledge Workflows",
      "AI Agents",
      "Business Process Automation",
      "Advanced Automation",
      "Final Capstone Overview",
    ],
  },
];

await connectDB();

const adminEmail = (process.env.ADMIN_EMAIL || "admin@rathiacademy.com").toLowerCase();
const admin = await User.findOne({ email: adminEmail });
if (!admin) {
  console.error(`No admin user found for ${adminEmail}. Run "npm run create-admin" first.`);
  process.exit(1);
}

for (const course of courses) {
  const savedCourse = await Course.findOneAndUpdate(
    { slug: course.slug },
    { $set: { ...course, instructor: admin._id, isPublished: true } },
    { upsert: true, new: true }
  );
  console.log(`Seeded: ${course.title}`);

  // Wipe and re-seed this course's lessons so re-running is safe/idempotent
  await Lesson.deleteMany({ course: savedCourse._id });

  let globalOrder = 0;
  const lessonDocs = [];
  course.modules.forEach((moduleTitle) => {
    lessonsFor(moduleTitle).forEach((lesson, i) => {
      lessonDocs.push({
        course: savedCourse._id,
        module: moduleTitle,
        title: lesson.title,
        durationSeconds: lesson.durationSeconds,
        durationMinutes: Math.round((lesson.durationSeconds / 60) * 10) / 10,
        order: globalOrder++,
        isPreview: i === 0 && globalOrder <= 4, // first lesson of the first module is a free preview
      });
    });
  });

  await Lesson.insertMany(lessonDocs);
  console.log(`  -> seeded ${lessonDocs.length} lessons across ${course.modules.length} modules`);
}

console.log("Course seeding complete.");
process.exit(0);
