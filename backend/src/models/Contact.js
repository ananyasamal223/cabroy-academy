import mongoose from "mongoose";
const schema = new mongoose.Schema({
  name:{type:String,required:true},
  email:{type:String,required:true},
  phone:{type:String,default:""},
  subject:{type:String,default:""},
  message:{type:String,required:true},
  status:{type:String,enum:["new","read","closed"],default:"new"}
},{timestamps:true});
export default mongoose.model("Contact",schema);
