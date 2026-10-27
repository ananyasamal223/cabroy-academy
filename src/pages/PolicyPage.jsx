import { Link, useLocation } from "react-router-dom";
const privacy = [
  ["Information used by your account", "The academy uses account details such as your name, email address and phone number, along with profile information you choose to add. Course purchases, enrollment records, mentor bookings, project submissions and course feedback may also be associated with your account."],
  ["Sign-in and payment providers", "If you choose Google sign-in, Google supplies verified account information. Payments are handled through Razorpay. Their own policies apply to information processed by those services."],
  ["Browser storage", "The site stores a sign-in token in local storage when you select Remember me, or in session storage otherwise. Shopping-cart items and some preferences are also stored in your browser. Signing out removes the site's stored sign-in token."],
  ["How information is used", "Account information supports sign-in, course access, customer support, payment verification and learning services. Password-reset messages use the configured email service. Passwords are stored as hashes rather than readable text."],
  ["Questions and requests", "Contact the academy through the enquiry form on the home page for questions about your account or personal information. The academy must finalize retention periods, applicable request procedures and its business contact details before publishing this policy."],
];
const terms = [
  ["Your account", "Use accurate information when creating your account and keep your sign-in details private. You are responsible for activity through your account. Contact the academy if you believe someone else has accessed it."],
  ["Courses and enrollment", "Review the course description, plan benefits, billing period and checkout total before purchasing. Access depends on successful payment verification and the applicable enrollment or subscription."],
  ["Learning materials and conduct", "Use academy materials for your own learning. Do not redistribute materials without permission, impersonate another learner, or submit work that misrepresents your own contribution. Treat learners and instructors respectfully."],
  ["Payments and support", "Payments are processed through Razorpay. For questions about a transaction or access to a purchased course, contact the academy through the home-page enquiry form. Refund, cancellation and renewal terms must be finalized by the academy before this draft is published."],
  ["Learning outcomes", "Courses provide educational resources. Completion and certification depend on the requirements communicated for each course. Any employment, placement or other outcome commitments must be explicitly agreed by the academy."],
];
export default function PolicyPage() {
  const isPrivacy = useLocation().pathname === "/privacy";
  const title = isPrivacy ? "Privacy Policy" : "Terms of Service";
  return <main className="min-h-screen bg-slate-50 px-5 py-10 text-slate-800">
    <article className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm sm:p-10">
      <Link to="/" className="text-sm font-semibold text-blue-600">Back to home</Link>
      <h1 className="mt-6 text-3xl font-bold">{title}</h1>
      <p role="note" className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Draft for academy review. This text has not yet been approved as the academy's final policy.</p>
      {(isPrivacy ? privacy : terms).map(([heading, text]) => <section key={heading} className="mt-7"><h2 className="text-lg font-semibold">{heading}</h2><p className="mt-2 text-sm leading-7 text-slate-600">{text}</p></section>)}
      <nav aria-label="Account and policy navigation" className="mt-9 flex flex-wrap gap-5 border-t pt-5 text-sm font-semibold text-blue-600"><Link to="/signup">Create account</Link><Link to="/login">Log in</Link><Link to={isPrivacy ? "/terms" : "/privacy"}>{isPrivacy ? "Terms of Service" : "Privacy Policy"}</Link></nav>
    </article>
  </main>;
}
