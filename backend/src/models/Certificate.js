import mongoose from "mongoose";
const schema = new mongoose.Schema({
  certificateId:{type:String,required:true,unique:true,index:true},
  user:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
  course:{type:mongoose.Schema.Types.ObjectId,ref:"Course",required:true},
  issuedAt:{type:Date,default:Date.now}
},{timestamps:true});
schema.index({user:1,course:1},{unique:true});
export default mongoose.model("Certificate",schema);
