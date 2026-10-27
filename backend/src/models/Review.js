import mongoose from "mongoose";
const schema = new mongoose.Schema({
  user:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
  course:{type:mongoose.Schema.Types.ObjectId,ref:"Course",required:true},
  rating:{type:Number,required:true,min:1,max:5},
  comment:{type:String,default:""}
},{timestamps:true});
schema.index({user:1,course:1},{unique:true});
export default mongoose.model("Review",schema);
