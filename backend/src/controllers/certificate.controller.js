import { notifyStudent } from "../utils/studentNotifications.js";
import crypto from "crypto";
import Certificate from "../models/Certificate.js";
import Progress from "../models/Progress.js";
import Enrollment from "../models/Enrollment.js";

export async function issueCertificate(req,res){
  const progress=await Progress.findOne({user:req.user._id,course:req.params.courseId,percentage:100});
  if(!progress) return res.status(400).json({message:"Complete the course before requesting certificate"});
  const certificate=await Certificate.findOneAndUpdate(
    {user:req.user._id,course:req.params.courseId},
    {$setOnInsert:{user:req.user._id,course:req.params.courseId,certificateId:`RA-${crypto.randomUUID().slice(0,8).toUpperCase()}`}},
    {upsert:true,new:true}
  ).populate("user","name").populate("course","title");
  await notifyStudent({ user: req.user._id, eventKey: "certificate:" + certificate._id, type: "certificate", title: "Certificate available", message: "Your certificate for " + (certificate.course?.title || "your course") + " is ready.", link: "/certificates" });
  res.status(201).json({certificate});
}

export async function myCertificates(req, res) {
  const user = req.user._id;
  const [certificates, enrollments, progress] = await Promise.all([
    Certificate.find({ user }).populate("course", "title thumbnail").populate("user", "name").sort({ issuedAt: -1 }),
    Enrollment.find({ user, status: { $ne: "cancelled" } }).populate("course", "title thumbnail"),
    Progress.find({ user }),
  ]);
  const courseId = course => String(course?._id || course || "");
  const earnedIds = new Set(certificates.map(item => courseId(item.course)).filter(Boolean));
  const progressByCourse = new Map(progress.map(item => [courseId(item.course), item.percentage]));
  const completedIds = new Set(earnedIds);
  const inProgress = [];
  for (const enrollment of enrollments) {
    if (!enrollment.course) continue;
    const id = courseId(enrollment.course);
    const percentage = enrollment.status === "completed" ? 100 : Math.min(100, Math.max(0, Number(progressByCourse.get(id)) || 0));
    if (enrollment.status === "completed" || percentage === 100) completedIds.add(id);
    if (!earnedIds.has(id)) inProgress.push({ course: enrollment.course, percentage, status: enrollment.status, completedAt: enrollment.completedAt });
  }
  res.json({ certificates, inProgress, summary: { earned: certificates.length, completed: completedIds.size, progress: inProgress.length } });
}

export async function verifyCertificate(req,res){
  const certificate=await Certificate.findOne({certificateId:req.params.certificateId})
    .populate("user","name")
    .populate("course","title");
  if(!certificate) return res.status(404).json({message:"Certificate not found"});
  res.json({valid:true,certificate});
}

export async function adminCertificates(req, res) {
  const certificates = await Certificate.find({})
    .populate("user", "name email")
    .populate("course", "title thumbnail")
    .sort({ issuedAt: -1 });
  res.json({ certificates });
}
