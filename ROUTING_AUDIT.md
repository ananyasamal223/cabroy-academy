# Page and routing audit

Checked 2026-10-08. Source review and React Router route matching; no authenticated browser or live backend validation.

## Route inventory (40 page route entries plus 404 fallback)

| URL | Page component | Access | Source |
| --- | --- | --- | --- |
| /about | About | Public | src/pages/About.jsx |
| /terms | PolicyPage | Public; draft | src/pages/PolicyPage.jsx |
| /privacy | PolicyPage | Public; draft | src/pages/PolicyPage.jsx |
| /plans | Plans | Public | src/pages/Plans.jsx |
| /plans/:planId | Plans | Public | src/pages/Plans.jsx |
| /pricing | Plans | Public | src/pages/Plans.jsx |
| / | Home | Public | src/pages/Home.jsx |
| /landing | LandingPage | Public | src/pages/LandingPage.jsx |
| /courses | Courses | Public | src/pages/Courses.jsx |
| /courses/:courseId | CourseDetails | Public | src/pages/CourseDetails.jsx |
| /login | Login | Public | src/pages/Login.jsx |
| /signup | Signup | Public | src/pages/Signup.jsx |
| /cart | Cart | Public | src/pages/Cart.jsx |
| /checkout/:courseId | Checkout | Signed in | src/pages/Checkout.jsx |
| /plans/:planId/checkout | Checkout | Signed in | src/pages/Checkout.jsx |
| /payment-success | PaymentSuccess | Public | src/pages/PaymentSuccess.jsx |
| /payment-failed | PaymentFailed | Public | src/pages/PaymentFailed.jsx |
| /dashboard | Dashboard | Signed in | src/student/Dashboard.jsx |
| /my-courses | MyCourses | Signed in | src/student/MyCourses.jsx |
| /projects | Projects | Signed in | src/student/Projects.jsx |
| /community | Community | Signed in | src/student/Community.jsx |
| /certificates | Certificates | Signed in | src/student/Certificates.jsx |
| /profile | Profile | Signed in | src/student/Profile.jsx |
| /settings | Settings | Signed in | src/student/Settings.jsx |
| /course-journey/:courseId | CourseJourney | Signed in | src/student/CourseJourney.jsx |
| /assignment/:courseId | Assignment | Signed in | src/student/Assignment.jsx |
| /admin | AdminDashboard | Admin / permitted staff | src/admin/Overview.jsx |
| /admin/user-overview | UserOverview | Admin / permitted staff | src/admin/UserReports.jsx |
| /admin/courses | AdminCourses | Admin / permitted staff | src/admin/Courses.jsx |
| /admin/employees | EmployeeManagement | Admin / permitted staff | src/admin/EmployeeManagement.jsx |
| /admin/revenue | RevenueDashboard | Admin / permitted staff | src/admin/RevenuePage.jsx |
| /admin/course-insights | CourseInsights | Admin / permitted staff | src/admin/CourseInsights.jsx |
| /admin/subscriptions | SubscriptionManagement | Admin / permitted staff | src/admin/SubscriptionManagement.jsx |
| /admin/instructors | Instructors | Admin / permitted staff | src/admin/InstructorManagement.jsx |
| /admin/instructors/:id | InstructorOverview | Admin / permitted staff | src/admin/InstructorOverview.jsx |
| /admin/certificates | AdminCertificates | Admin / permitted staff | src/admin/Certificates.jsx |
| /admin/feedback | StudentFeedback | Admin / permitted staff | src/admin/StudentFeedback.jsx |
| /admin/instructor-dashboard | PersonalInstructorDashboard | Admin / permitted staff | src/admin/PersonalInstructorDashboard.jsx |
| /admin/profile | AdminProfile | Admin / permitted staff | src/admin/AdminProfile.jsx |
| /admin/sales | SalesDashboard | Admin / permitted staff | src/admin/SalesDashboard.jsx |
| * | NotFound | Public | src/pages/NotFound.jsx |

## Findings

1. Broken active footer link: /careers has no route. /privacy and /terms now have working draft policy pages added during the authentication update.
2. Missing /contact destination: the active Home.jsx newsletter form submits to /contact, which has no route. An unreferenced alternate CourseExperience.jsx also links there.
3. Staff permission mismatch: AdminLayout exposes /admin/subscriptions for revenue permission and /admin/feedback for reports permission, but ProtectedRoute does not map either path. Non-admin staff are redirected away despite seeing the links.
4. /community is linked from public navigation but requires login. This is valid routing; visitors are redirected to /login and returned to the requested page after signing in as students.
5. /pricing and /plans render the same Plans component. This works, but there is no canonical redirect for the pricing alias.
6. Payment result pages are publicly accessible and display fixed status text without verifying a payment. The active Checkout flow uses its own verified confirmation step; direct result URLs do not prove payment status.
7. BrowserRouter requires the production host to serve index.html for application deep links. No frontend hosting rewrite configuration was found in the project root; live-host refresh behavior was not verified.
8. Broken certificate action: src/student/Certificates.jsx navigates to /certificate/${certificate.id}, but App.jsx has no /certificate/:id route.
9. Course detail data mismatch: Home.jsx links backend courses by slug or ID, and MyCourses.jsx links enrolled courses by identifier, while CourseDetails.jsx looks up only local courses/exploreCourses arrays (plus career-accelerator). Backend-only course identifiers can therefore show "Course not found" despite being valid backend courses. This requires real backend data to reproduce.
10. public/sitemap.xml and public/robots.txt still contain https://example.com. Replace it with the deployment origin. The sitemap lists only five public routes; concrete plan/course detail URLs can be added once published IDs and the real domain are confirmed.

## Literal navigation checks (151 occurrences)

Checks include all source files; inactive files are distinguished below. Dynamic URLs are reviewed separately and require real IDs for runtime validation.

- Inactive: /contact ? src\pages\CourseExperience.jsx:30
- Active: /privacy ? src\pages\Home.jsx:1242
- Active: /terms ? src\pages\Home.jsx:1243
- Active: /careers ? src\pages\Home.jsx:1244

## Components not reachable through the current import graph

These are unreferenced JSX files, not necessarily missing routes; some are alternate designs or old components.

- src\admin\Dashboard.jsx
- src\admin\Instructors.jsx
- src\admin\RevenueDashboard.jsx
- src\admin\ui.jsx
- src\admin\UserOverview.jsx
- src\pages\CourseExperience.jsx
- src\pages\Payment Failed.jsx
- src\student\ui.jsx

## Verified routing structure

- Admin child routes resolve under /admin and AdminLayout renders Outlet.
- Student routes use StudentLayout and ProtectedRoute.
- Both course checkout and plan checkout routes are protected.
- Unknown routes render NotFound.
- /checkout/cart and /checkout/career-accelerator are intentionally handled by Checkout.
- Invalid plan IDs render NotFound.
- Login/signup preserve destination state and query parameters for student checkout redirects.

## Validation

- Existing src/utils/authRedirect.test.js: 4 tests passed, 0 failed.
- Prior production build passed after adding sitemap.xml and robots.txt. Application code was not changed during this audit.
- Checked all 38 route entries with React Router matching and reviewed dynamic navigation source.
- Authenticated browser rendering, API-driven course IDs, payment processing and deployed deep-link refresh behavior remain unverified.

## All page-area JSX files

- src/pages/About.jsx ? Route: /about
- src/pages/Cart.jsx ? Route: /cart
- src/pages/Checkout.jsx ? Route: /checkout/:courseId, /plans/:planId/checkout
- src/pages/CourseDetailReference.jsx ? Imported layout or supporting component
- src/pages/CourseDetails.jsx ? Route: /courses/:courseId
- src/pages/CourseExperience.jsx ? Not referenced by the current app import graph
- src/pages/Courses.jsx ? Route: /courses
- src/pages/Home.jsx ? Route: /
- src/pages/LandingPage.jsx ? Route: /landing
- src/pages/Login.jsx ? Route: /login
- src/pages/NotFound.jsx ? Route: *
- src/pages/Payment Failed.jsx ? Not referenced by the current app import graph
- src/pages/PaymentFailed.jsx ? Route: /payment-failed
- src/pages/PaymentSuccess.jsx ? Route: /payment-success
- src/pages/Plans.jsx ? Route: /plans, /plans/:planId, /pricing
- src/pages/Signup.jsx ? Route: /signup
- src/student/Assignment.jsx ? Route: /assignment/:courseId
- src/student/Certificates.jsx ? Route: /certificates
- src/student/Community.jsx ? Route: /community
- src/student/CourseJourney.jsx ? Route: /course-journey/:courseId
- src/student/CourseJourneyView.jsx ? Imported layout or supporting component
- src/student/Dashboard.jsx ? Route: /dashboard
- src/student/MyCourses.jsx ? Route: /my-courses
- src/student/Profile.jsx ? Route: /profile
- src/student/Projects.jsx ? Route: /projects
- src/student/Settings.jsx ? Route: /settings
- src/student/StudentLayout.jsx ? Imported layout or supporting component
- src/student/ui.jsx ? Not referenced by the current app import graph
- src/admin/AdminLayout.jsx ? Imported layout or supporting component
- src/admin/AdminProfile.jsx ? Route: /admin/profile
- src/admin/Certificates.jsx ? Route: /admin/certificates
- src/admin/CourseAccess.jsx ? Imported layout or supporting component
- src/admin/CourseInsights.jsx ? Route: /admin/course-insights
- src/admin/Courses.jsx ? Route: /admin/courses
- src/admin/Dashboard.jsx ? Not referenced by the current app import graph
- src/admin/DashboardDateFilter.jsx ? Imported layout or supporting component
- src/admin/EmployeeManagement.jsx ? Route: /admin/employees
- src/admin/InstructorManagement.jsx ? Route: /admin/instructors
- src/admin/InstructorOverview.jsx ? Route: /admin/instructors/:id
- src/admin/Instructors.jsx ? Not referenced by the current app import graph
- src/admin/Overview.jsx ? Route: /admin
- src/admin/OverviewCharts.jsx ? Imported layout or supporting component
- src/admin/PersonalInstructorDashboard.jsx ? Route: /admin/instructor-dashboard
- src/admin/PersonalSalesDashboard.jsx ? Imported layout or supporting component
- src/admin/PlansBenefits.jsx ? Imported layout or supporting component
- src/admin/RevenueDashboard.jsx ? Not referenced by the current app import graph
- src/admin/RevenuePage.jsx ? Route: /admin/revenue
- src/admin/SalesDashboard.jsx ? Route: /admin/sales
- src/admin/StudentFeedback.jsx ? Route: /admin/feedback
- src/admin/SubscriptionManagement.jsx ? Route: /admin/subscriptions
- src/admin/ui.jsx ? Not referenced by the current app import graph
- src/admin/UserOverview.jsx ? Not referenced by the current app import graph
- src/admin/UserReports.jsx ? Route: /admin/user-overview

