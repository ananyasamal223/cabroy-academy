// One-off script to create a dummy instructor for testing.
// Run once from your backend folder: node seedInstructor.js
// Delete this file afterward — it's just for testing, not part of the app.

import mongoose from "mongoose";
import bcrypt from "bcryptjs"; // swap for "bcrypt" if that's what your project uses
import dotenv from "dotenv";
import User from "./src/models/User.js";

dotenv.config();

async function run() {
  if (process.env.NODE_ENV === "production") throw new Error("Dummy instructor seeding is disabled in production.");
  const seedPassword = process.env.SEED_INSTRUCTOR_PASSWORD;
  if (!seedPassword || seedPassword.length < 12) throw new Error("Set SEED_INSTRUCTOR_PASSWORD to a unique password of at least 12 characters.");
  await mongoose.connect(process.env.MONGODB_URI);

  const existing = await User.findOne({ email: "dummy.instructor@rathiacademy.test" });
  if (existing) {
    console.log("Dummy instructor already exists:", existing._id.toString());
    await mongoose.disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash(seedPassword, 10);

  const instructor = await User.create({
    name: "Dummy Instructor",
    email: "dummy.instructor@rathiacademy.test",
    password: hashedPassword,
    role: "instructor",
    bio: "Web Development", // shown as "expertise" on the Instructors page
    instructorStatus: "active",
  });

  console.log("Created dummy instructor:", instructor._id.toString());
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
