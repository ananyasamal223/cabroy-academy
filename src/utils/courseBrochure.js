import { jsPDF } from "jspdf";

// Only public catalog content belongs in a brochure; never include lead details.
const plainText = (value) => String(value || "")
  .replace(/<[^>]*>/g, " ")
  .replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"')
  .replace(/[\u2013\u2014]/g, "-").replace(/\u20b9/g, "INR ")
  .replace(/\s+/g, " ").trim();

export function createCourseBrochure(course) {
  const doc = new jsPDF();
  const width = 170;
  let y = 46;
  const header = () => {
    doc.setFillColor(8, 35, 78);
    doc.rect(0, 0, 210, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.text("CABROY", 20, 13);
    doc.setFontSize(8);
    doc.text("SCHOOL OF MARKETING  |  COURSE BROCHURE", 20, 22);
  };
  header();
  const write = (text, size = 11, bold = false) => {
    const value = plainText(text);
    if (!value) return;
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(value, width);
    for (const line of lines) {
      if (y + size * .45 > 273) { doc.addPage(); header(); y = 44; }
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.setFontSize(size);
      doc.setTextColor(bold ? 20 : 69, bold ? 53 : 84, bold ? 94 : 108);
      doc.text(line, 20, y);
      y += size * .5;
    }
    y += 4;
  };
  const section = (title, values) => {
    const items = (Array.isArray(values) ? values : [values]).filter(value => plainText(value));
    if (!items.length) return;
    if (y > 248) { doc.addPage(); header(); y = 44; }
    y += 4;
    write(title, 14, true);
    items.forEach(value => write(value));
  };
  write(course.title || course.name || "Course", 24, true);
  write(course.shortDescription, 12);
  const duration = course.duration || (course.durationMinutes ? `${course.durationMinutes} minutes` : "");
  section("Course at a glance", [
    course.category && `Category: ${course.category}`,
    course.level && `Level: ${course.level}`,
    duration && `Duration: ${duration}`,
    course.sessions > 0 && `Sessions: ${course.sessions}`,
    course.instructor?.name && `Instructor: ${course.instructor.name}`,
    typeof course.price === "number" && `Course fee: INR ${course.price.toLocaleString("en-IN")}`,
  ].filter(Boolean));
  section("About this course", course.description);
  section("Skills you will learn", course.skills);
  if (course.curriculum?.length) {
    section("Course curriculum", course.curriculum.flatMap((module, index) => [
      `${index + 1}. ${module.title}`, ...(module.submodules || []).map(item => `- ${item}`),
    ]));
  } else {
    section("Course modules", course.modules);
  }
  section("Requirements", course.requirements);
  section("Take the next step", "Explore this course on our website for current availability and enrolment details. Course information and fees may change.");
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    doc.setDrawColor(220, 229, 240);
    doc.line(20, 280, 190, 280);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 115, 135);
    doc.text("Strategy. Skills. Success.", 20, 287);
    doc.text(`${page} / ${pageCount}`, 190, 287, { align: "right" });
  }
  return doc;
}

export function brochureFilename(course) {
  const slug = String(course.slug || course.title || "course").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `cabroy-${slug || "course"}-brochure.pdf`;
}
