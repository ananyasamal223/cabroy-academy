import { serveUpload } from "./utils/uploadStorage.js";
import "express-async-errors"; // lets async controller errors reach errorHandler instead of hanging
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import courseRoutes from "./routes/course.routes.js";
import lessonRoutes from "./routes/lesson.routes.js";
import enrollmentRoutes from "./routes/enrollment.routes.js";
import certificateRoutes from "./routes/certificate.routes.js";
import projectRoutes from "./routes/project.routes.js";
import contactRoutes from "./routes/contact.routes.js";
import announcementRoutes from "./routes/announcement.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import mentorSessionRoutes from "./routes/mentorSession.routes.js";
import feedbackRoutes from "./routes/feedback.routes.js";

import {notFound,errorHandler} from "./middleware/error.js";

const app=express();
// One trusted reverse-proxy hop when explicitly enabled by the host.
if (process.env.TRUST_PROXY_HOPS) {
 const hops=Number(process.env.TRUST_PROXY_HOPS);
 if (!Number.isInteger(hops) || hops < 1 || hops > 5) throw new Error("TRUST_PROXY_HOPS must be between 1 and 5.");
 app.set("trust proxy", hops);
}

app.use(helmet({crossOriginResourcePolicy:{policy:"cross-origin"}}));
app.use(cors({
  origin:(process.env.CLIENT_URL||"http://localhost:5173").split(",").map(origin => origin.trim()).filter(Boolean),
  credentials:true
}));
app.use(express.json({limit:"2mb"}));
app.use(express.urlencoded({extended:true}));
app.use(morgan(process.env.NODE_ENV==="production"?"combined":"dev"));
app.use(rateLimit({windowMs:15*60*1000,max:300,standardHeaders:true,legacyHeaders:false}));

app.get("/uploads/:filename", serveUpload);
app.use("/uploads",express.static(path.resolve("uploads")));

app.get("/api/health",(req,res)=>res.json({ok:true,service:"rathi-academy-backend"}));

app.use("/api/auth",authRoutes);
app.use("/api/users",userRoutes);
app.use("/api/courses",courseRoutes);
app.use("/api/lessons",lessonRoutes);
app.use("/api/enrollments",enrollmentRoutes);
app.use("/api/certificates",certificateRoutes);
app.use("/api/projects",projectRoutes);
app.use("/api/contact",contactRoutes);
app.use("/api/announcements",announcementRoutes);
app.use("/api/admin",adminRoutes);
app.use("/api/uploads",uploadRoutes);
app.use("/api/payments",paymentRoutes);
app.use("/api/mentor-sessions",mentorSessionRoutes);
app.use("/api/feedback",feedbackRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
