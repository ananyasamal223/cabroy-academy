import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";
import Lesson from "../models/Lesson.js";

export async function listCourses(req,res){
  const {q,category,level,published="true"}=req.query;
  const filter={};
  if(published!=="all") filter.isPublished=published==="true";
  if(category) filter.category=category;
  if(level) filter.level=level;
  if(q) filter.$text={$search:q};
  const courses=await Course.find(filter).populate("instructor","name avatar bio").sort({createdAt:-1});
  res.json({courses});
}

export async function getCourse(req,res){
  const isObjectId=/^[0-9a-fA-F]{24}$/.test(req.params.id);
  const query=isObjectId?{_id:req.params.id}:{slug:req.params.id};
  const course=await Course.findOne(query).populate("instructor","name avatar bio");
  if(!course) return res.status(404).json({message:"Course not found"});
  const lessons=await Lesson.find({course:course._id}).sort({order:1});
  res.json({course,lessons});
}

export async function createCourse(req,res){
  const course=await Course.create({...req.body,instructor:req.body.instructor||req.user._id});
  res.status(201).json({course});
}

export async function updateCourse(req,res){
  const course=await Course.findByIdAndUpdate(req.params.id,{$set:req.body},{new:true,runValidators:true});
  if(!course) return res.status(404).json({message:"Course not found"});
  res.json({course});
}

export async function deleteCourse(req,res){
  const course=await Course.findByIdAndDelete(req.params.id);
  if(!course) return res.status(404).json({message:"Course not found"});
  await Lesson.deleteMany({course:course._id});
  res.json({message:"Course deleted"});
}

export async function getCourseMaterials(req, res) {
  const course = await Course.findById(req.params.id).select("+materialUrl");
  if (!course) return res.status(404).json({ message: "Course not found" });
  const manages = req.user.role === "admin" || String(course.instructor) === String(req.user._id);
  const enrolled = manages || await Enrollment.exists({ user: req.user._id, course: course._id, status: { $ne: "cancelled" } });
  if (!enrolled) return res.status(403).json({ message: "Enroll in this course to access its materials." });
  res.json({ url: course.materialUrl || "" });
}