# Rathi Academy Backend

Complete LMS backend using Node.js, Express, MongoDB and JWT — built to match the Rathi Academy React frontend.

## Features
- Signup / login / current-user auth (JWT, bcrypt password hashing)
- Forgot-password OTP flow (email via nodemailer, dev-mode OTP echo)
- User & admin management
- Courses + lessons (CRUD, publish flag, text search)
- Enrollment (free courses instantly, paid courses gated behind payment)
- **Razorpay payments** — create order, verify signature, auto-enroll on success
- Progress tracking per lesson/course
- Reviews (one per enrolled user per course)
- Certificates (auto-issued at 100% progress, publicly verifiable by ID)
- Student project submissions + instructor/admin review
- Contact form + admin inbox
- Announcements (audience-targeted)
- Admin dashboard stats
- Local file uploads (multer)
- Security: helmet, cors, rate-limiting
- Async errors from any controller are caught and returned as clean JSON (via `express-async-errors`)

## Setup

```bash
npm install
```

Your `.env` already has working values for `MONGODB_URI`, `JWT_SECRET`, `SMTP_*`, and `ADMIN_EMAIL`/`ADMIN_PASSWORD`.
Fill in `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (get test keys free from the Razorpay dashboard) before using the payment routes — every other route works without them.

```bash
npm run create-admin   # seeds/updates the admin user from .env
npm run seed           # loads the 3 demo courses from the frontend into MongoDB
npm run dev            # starts the API on http://localhost:5000
```

Base URL: `http://localhost:5000/api`

## Endpoint map

| Area | Routes |
|---|---|
| Auth | `POST /auth/signup`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`, `POST /auth/forgot-password/send-otp`, `POST /auth/forgot-password/verify-otp`, `POST /auth/forgot-password/reset` |
| Users | `PATCH /users/me`, `GET /users` (admin), `GET/PATCH /users/:id` (admin) |
| Courses | `GET /courses`, `GET /courses/:id`, `POST/PATCH/DELETE /courses/:id` (admin/instructor), `GET/POST /courses/:courseId/lessons`, `GET/POST /courses/:courseId/reviews`, `POST /courses/:courseId/enroll` (free only), `GET /courses/:courseId/progress`, `POST /courses/:courseId/certificate`, `POST /courses/:courseId/projects` |
| Lessons | `PATCH/DELETE /lessons/:id`, `POST /lessons/:courseId/:lessonId/complete` |
| Payments | `POST /payments/create-order`, `POST /payments/verify`, `GET /payments/me` |
| Enrollments | `GET /enrollments/me`, `GET /enrollments` (admin) |
| Certificates | `GET /certificates/me`, `GET /certificates/verify/:certificateId` (public) |
| Projects | `GET /projects/me`, `GET /projects` (admin/instructor), `PATCH /projects/:id/review` |
| Contact | `POST /contact`, `GET /contact` (admin), `PATCH /contact/:id` (admin) |
| Announcements | `GET /announcements`, `POST /announcements` (admin), `PATCH /announcements/:id` (admin) |
| Admin | `GET /admin/stats` |
| Uploads | `POST /uploads` (multipart `file` field) |

All protected routes need `Authorization: Bearer <token>`.

## Payment flow (Razorpay)

1. Frontend calls `POST /payments/create-order { courseId }` -> gets back a Razorpay `order` + `keyId`.
2. Frontend opens Razorpay Checkout with that order.
3. On success, frontend calls `POST /payments/verify { razorpay_order_id, razorpay_payment_id, razorpay_signature }`.
4. Backend verifies the HMAC signature server-side and, only then, creates the `Enrollment`.

Free courses (`price: 0`) skip this entirely — `POST /courses/:courseId/enroll` enrolls immediately.

## Notes
- `getCourse` accepts either a Mongo `_id` or the course `slug` in `:id` — matches the frontend's `/courses/:courseId` route using slugs like `digital-marketing`.
- Set `NODE_ENV=development` to get `devOtp` echoed back in the forgot-password response (skips needing real SMTP while testing).
