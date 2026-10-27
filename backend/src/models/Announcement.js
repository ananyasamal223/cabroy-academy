import mongoose from "mongoose";
const schema = new mongoose.Schema({
  title:{type:String,required:true},
  message:{type:String,required:true},
  audience:{type:String,enum:["all","students","instructors"],default:"all"},
  createdBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
  isActive:{type:Boolean,default:true}
},{timestamps:true});
export default mongoose.model("Announcement",schema);
