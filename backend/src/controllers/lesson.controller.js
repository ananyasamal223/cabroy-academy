import Lesson from "../models/Lesson.js";

export async function listLessons(req,res){
  res.json({lessons:await Lesson.find({course:req.params.courseId}).sort({order:1})});
}
export async function createLesson(req,res){
  const lesson=await Lesson.create({...req.body,course:req.params.courseId});
  res.status(201).json({lesson});
}
export async function updateLesson(req,res){
  const lesson=await Lesson.findByIdAndUpdate(req.params.id,{$set:req.body},{new:true,runValidators:true});
  if(!lesson) return res.status(404).json({message:"Lesson not found"});
  res.json({lesson});
}
export async function deleteLesson(req,res){
  const lesson=await Lesson.findByIdAndDelete(req.params.id);
  if(!lesson) return res.status(404).json({message:"Lesson not found"});
  res.json({message:"Lesson deleted"});
}
