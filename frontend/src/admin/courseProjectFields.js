export function prepareCourseProjects(projects = [], moduleCount = 0) {
 return projects.map((project,index) => {
  const fail = message => { throw new Error(`Project ${index + 1}: ${message}`); };
  if (!project.title?.trim() || !project.problemStatement?.trim()) fail("enter a title and problem statement, or remove the project.");
  const resourceLinks = (project.resourceLinks || []).map(value => value.trim()).filter(Boolean);
  if (resourceLinks.some(value => { try { return new URL(value).protocol !== "https:"; } catch { return true; } })) fail("resource links must be valid HTTPS URLs.");
  const deadlineDays = project.deadlineType === "relative" ? Number(project.deadlineDays) : null;
  if (project.deadlineType === "relative" && (!Number.isInteger(deadlineDays) || deadlineDays < 1)) fail("enter a whole number of days greater than zero.");
  const fixedDeadline = project.deadlineType === "fixed" ? new Date(project.fixedDeadline) : null;
  if (fixedDeadline && (!project.fixedDeadline || Number.isNaN(fixedDeadline.getTime()))) fail("choose a valid deadline date and time.");
  const timerHours = project.timerHours == null ? null : Number(project.timerHours);
  if (timerHours != null && (!Number.isFinite(timerHours) || timerHours < 0.25)) fail("timer duration must be at least 0.25 hours.");
  const unlockModuleIndex = project.availability === "after_module" ? Number(project.unlockModuleIndex) : null;
  if (project.availability === "after_module" && (project.unlockModuleIndex == null || !Number.isInteger(unlockModuleIndex) || unlockModuleIndex < 0 || unlockModuleIndex >= moduleCount)) fail("choose an existing module to unlock this project.");
  return { ...(project._id ? { _id: project._id } : {}), title: project.title.trim(), problemStatement: project.problemStatement.trim(), deliverables: (project.deliverables || []).map(value => value.trim()).filter(Boolean), resourceLinks, submissionRequirements: project.submissionRequirements, availability: project.availability, unlockModuleIndex, deadlineType: project.deadlineType, deadlineDays, fixedDeadline: fixedDeadline?.toISOString() || null, timerHours, reviewCriteria: (project.reviewCriteria || "").trim(), requiredForCertificate: Boolean(project.requiredForCertificate) };
 });
}
