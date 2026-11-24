import mongoose from "mongoose";
export const crmStages = ["New", "Contacted", "Interested", "Demo booked", "Enrolled", "Lost"];

const schema = new mongoose.Schema({
  name:{type:String,required:true},
  email:{type:String,required:true},
  phone:{type:String,default:""},
  subject:{type:String,default:""},
  message:{type:String,required:true},
  status:{type:String,enum:["new","read","closed"],default:"new"},
  crmStage: { type: String, enum: [...crmStages, "Counselling Booked", "Closed"] },
  course: { type: String, default: "" },
  city: { type: String, default: "" },
  source: { type: String, default: "" },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  followUpOn: { type: String, default: "" },
  followUpAt: { type: Date, default: null },
  demoAt: { type: Date, default: null },
  enrolledAt: { type: Date, default: null },
  crmNotes: [{
    text: { type: String, required: true, maxlength: 2000 },
    author: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  }],
  crmActivity: [{
    kind: { type: String, enum: ["stage", "assignment", "follow-up", "demo", "note", "call"], required: true },
    text: { type: String, required: true },
    author: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  }],
},{timestamps:true});
export default mongoose.model("Contact",schema);
