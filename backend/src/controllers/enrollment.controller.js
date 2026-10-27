import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";
import Payment from "../models/Payment.js";
import { enrollUserInCourse } from "../utils/enrollUser.js";

export async function enroll(req, res) {
  const course = await Course.findById(req.params.courseId);

  if (!course || !course.isPublished) {
    return res.status(404).json({
      message: "Course not available",
    });
  }

  if (course.price > 0) {
    const paid = await Payment.findOne({
      user: req.user._id,
      course: course._id,
      status: "paid",
    });

    if (!paid) {
      return res.status(402).json({
        message:
          "Payment required. Create a Razorpay order via /api/payments/create-order first.",
      });
    }
  }

  const enrollment = await enrollUserInCourse(
    req.user._id,
    course._id
  );

  res.status(201).json({ enrollment });
}

export async function myEnrollments(req, res) {
  const enrollments = await Enrollment.find({
    user: req.user._id,
  })
    .populate({
      path: "course",
      populate: {
        path: "instructor",
        select: "name avatar",
      },
    })
    .sort({ createdAt: -1 });

  res.json({ enrollments });
}

export async function allEnrollments(req, res) {
  const enrollments = await Enrollment.find()
    .populate("user", "name email phone")
    .populate("course", "title thumbnail")
    .sort({ createdAt: -1 });

  res.json({ enrollments });
}