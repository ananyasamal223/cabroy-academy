import Progress from "../models/Progress.js";
import Lesson from "../models/Lesson.js";
import Enrollment from "../models/Enrollment.js";

export async function getProgress(req,res){
  const progress=await Progress.findOne({user:req.user._id,course:req.params.courseId})
    .populate("completedLessons","title order");
  res.json({progress:progress||{course:req.params.courseId,completedLessons:[],percentage:0,lastLesson:null}});
}

export async function completeLesson(req,res){
  const {courseId,lessonId}=req.params;
  const enrollment=await Enrollment.findOne({user:req.user._id,course:courseId,status:"active"});
  if(!enrollment) return res.status(403).json({message:"Enroll in this course first"});
  const lesson=await Lesson.findOne({_id:lessonId,course:courseId});
  if(!lesson) return res.status(404).json({message:"Lesson not found"});

  let progress=await Progress.findOne({user:req.user._id,course:courseId});
  if(!progress) progress=await Progress.create({user:req.user._id,course:courseId,completedLessons:[]});

  const exists=progress.completedLessons.some(id=>id.toString()===lessonId);
  if(!exists) progress.completedLessons.push(lesson._id);
  progress.lastLesson=lesson._id;

  const total=await Lesson.countDocuments({course:courseId});
  progress.percentage=total?Math.round((progress.completedLessons.length/total)*100):0;
  await progress.save();

  if(progress.percentage===100){
    enrollment.status="completed";
    enrollment.completedAt=new Date();
    await enrollment.save();
  }

  res.json({progress});
}
