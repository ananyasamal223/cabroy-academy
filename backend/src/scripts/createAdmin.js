import "dotenv/config";
import bcrypt from "bcryptjs";
import {connectDB} from "../config/db.js";
import User from "../models/User.js";


const email=process.env.ADMIN_EMAIL;
const password=process.env.ADMIN_PASSWORD;
if (!email || !password || password.length < 12) throw new Error("Set ADMIN_EMAIL and a unique ADMIN_PASSWORD of at least 12 characters.");
await connectDB();

const hash=await bcrypt.hash(password,12);

const user=await User.findOneAndUpdate(
  {email:email.toLowerCase()},
  {$set:{
    name:"Rathi Academy Admin",
    email:email.toLowerCase(),
    password:hash,
    role:"admin",
    isActive:true
  }},
  {upsert:true,new:true}
);

console.log("Admin ready:",user.email);
process.exit(0);
