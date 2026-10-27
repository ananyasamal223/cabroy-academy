import Review from "../models/Review.js";
import Enrollment from "../models/Enrollment.js";

export async function listReviews(req,res){
  const reviews=await Review.find({course:req.params.courseId})
    .populate("user","name avatar")
    .sort({createdAt:-1});
  res.json({reviews});
}

export async function upsertReview(req,res){
  const enrolled=await Enrollment.exists({user:req.user._id,course:req.params.courseId});
  if(!enrolled) return res.status(403).json({message:"Enroll before reviewing"});
  const review=await Review.findOneAndUpdate(
    {user:req.user._id,course:req.params.courseId},
    {$set:{rating:req.body.rating,comment:req.body.comment||""}},
    {upsert:true,new:true,runValidators:true}
  );
  res.json({review});
}
