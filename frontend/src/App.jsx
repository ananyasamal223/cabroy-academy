import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

// ==============================
// PUBLIC PAGES
// ==============================

import Home from "./pages/Home";
import About from "./pages/About";
import Plans from "./pages/Plans";
import LandingPage from "./pages/LandingPage";
import Courses from "./pages/Courses";
import CourseDetails from "./pages/CourseDetails";
import SubscriptionManagement from "./admin/SubscriptionManagement";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import NotFound from "./pages/NotFound";
import PolicyPage from "./pages/PolicyPage";

// ==============================
// STUDENT PAGES
// ==============================

/* ============================
   STUDENT
============================ */

import StudentLayout from "./student/StudentLayout";

import Dashboard from "./student/Dashboard";
import MyCourses from "./student/MyCourses";
import Projects from "./student/Projects";
import Community from "./student/Community";


import Certificates from "./student/Certificates";

import Settings from "./student/Settings";
import Profile from "./student/Profile";

import Assignment from "./student/Assignment";
import CourseJourney from "./student/CourseJourney";
// ==============================
// ADMIN PAGES
// ==============================

import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/Overview";
import UserOverview from "./admin/UserReports";
import AdminCourses from "./admin/Courses";
import RevenueDashboard from "./admin/RevenuePage";
import Instructors from "./admin/InstructorManagement";
import InstructorOverview from "./admin/InstructorOverview";
import AdminCertificates from "./admin/Certificates";
import SalesDashboard from "./admin/SalesDashboard";
import AdminProfile from "./admin/AdminProfile";
import CourseInsights from "./admin/CourseInsights";
import EmployeeManagement from "./admin/EmployeeManagement";
import PersonalInstructorDashboard from "./admin/PersonalInstructorDashboard";
import StudentFeedback from "./admin/StudentFeedback";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/terms" element={<PolicyPage />} />
        <Route path="/privacy" element={<PolicyPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/plans/:planId" element={<Plans />} />
        <Route path="/pricing" element={<Plans />} />

        {/* ============================== */}
        {/* PUBLIC WEBSITE */}
        {/* ============================== */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/landing"
          element={<LandingPage />}
        />

        <Route
          path="/courses"
          element={<Courses />}
        />

        <Route
          path="/courses/:courseId"
          element={<CourseDetails />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/cart"
          element={<Cart />}
        />

        <Route element={<ProtectedRoute />}>
          <Route path="/checkout/:courseId" element={<Checkout />} />
          <Route path="/plans/:planId/checkout" element={<Checkout />} />
        </Route>

        <Route
          path="/payment-success"
          element={<PaymentSuccess />}
        />

        <Route
          path="/payment-failed"
          element={<PaymentFailed />}
        />


        {/* ============================== */}
        {/* STUDENT PAGES */}
        {/* ============================== */}

        {/* ======================================
    STUDENT AREA
====================================== */}

        <Route element={<ProtectedRoute />}>
        <Route element={<StudentLayout />}>

          {/* SIDEBAR PAGES */}

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/my-courses"
            element={<MyCourses />}
          />

          <Route
            path="/projects"
            element={<Projects />}
          />

          <Route
            path="/community"
            element={<Community />}
          />

          <Route path="/certificates" element={<Certificates />} />




          {/* PROFILE DROPDOWN PAGES */}

          <Route
            path="/profile"
            element={<Profile />}
          />

          <Route
            path="/settings"
            element={<Settings />}
          />


          {/* INTERNAL COURSE PAGES */}

          <Route
            path="/course-journey/:courseId"
            element={<CourseJourney />}
          />

          <Route
            path="/assignment/:courseId"
            element={<Assignment />}
          />



        </Route>
        </Route>

        {/* ============================== */}
        {/* ADMIN PANEL */}
        {/* ============================== */}

        <Route element={<ProtectedRoute role="admin" />}>
        <Route
          path="/admin"
          element={<AdminLayout />}
        >

          {/* DASHBOARD */}
          <Route
            index
            element={<AdminDashboard />}
          />

          {/* USER REPORTS */}
          <Route
            path="user-overview"
            element={<UserOverview />}
          />

          {/* COURSE CREATION */}
          <Route
            path="courses"
            element={<AdminCourses />}
          />

          <Route
            path="employees"
            element={<EmployeeManagement />}
          />

          {/* REVENUE */}
          <Route
            path="revenue"
            element={<RevenueDashboard />}
          />

          <Route
            path="course-insights"
            element={<CourseInsights />}
          />

          {/* INSTRUCTORS */}
          <Route path="subscriptions" element={<SubscriptionManagement />} />
          <Route
            path="instructors"
            element={<Instructors />}
          />

          <Route
            path="instructors/:id"
            element={<InstructorOverview />}
          />

          {/* CERTIFICATES */}
          <Route
            path="certificates"
            element={<AdminCertificates />}
          />

          {/* STUDENT FEEDBACK */}
          <Route
            path="feedback"
            element={<StudentFeedback />}
          />

          <Route
            path="instructor-dashboard"
            element={<PersonalInstructorDashboard />}
          />

          {/* ADMIN PROFILE DROPDOWN PAGES */}
          <Route
            path="profile"
            element={<AdminProfile />}
          />

          <Route
            path="sales"
            element={<SalesDashboard />}
          />

        </Route>
        </Route>


        {/* ============================== */}
        {/* 404 */}
        {/* ============================== */}

        <Route
          path="*"
          element={<NotFound />}
        />

      </Routes>
    </BrowserRouter>
  );
}
