import Announcement from "../models/Announcement.js";

export async function listAnnouncements(req,res){
  const filter={isActive:true};
  if(req.user?.role==="student") filter.audience={$in:["all","students"]};
  if(req.user?.role==="instructor") filter.audience={$in:["all","instructors"]};
  const announcements=await Announcement.find(filter).sort({createdAt:-1});
  res.json({announcements});
}
export async function createAnnouncement(req,res){
  const announcement=await Announcement.create({...req.body,createdBy:req.user._id});
  res.status(201).json({announcement});
}
export async function updateAnnouncement(req,res){
  const announcement=await Announcement.findByIdAndUpdate(req.params.id,{$set:req.body},{new:true,runValidators:true});
  if(!announcement) return res.status(404).json({message:"Announcement not found"});
  res.json({announcement});
}
