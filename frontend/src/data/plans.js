export const plans = [
  {
    id: "starter", name: "Starter", price: 999, audience: "Perfect for beginners",
    headline: "Your first step towards a brighter career.",
    description: "Build a strong foundation with selected courses, flexible learning and a community that grows with you.",
    features: [
      ["Access to selected courses", "Build your foundation, one skill at a time.", "book"],
      ["Self-paced learning", "Make progress around your schedule.", "play"],
      ["Community access", "Connect, share and learn together.", "users"],
      ["Course certificates", "Showcase the skills you have learned.", "award"],
    ],
    faqs: [
      ["What is included in the Starter Plan?", "Starter includes access to selected courses, self-paced learning, community access and course certificates."],
      ["Can I upgrade later?", "You can explore Pro whenever you need more course access or mentor support. Confirm the available upgrade and billing options before purchasing."],
      ["Will I get certificates?", "Course certificates are included. Complete the required learning and assessments for each eligible course to earn yours."],
      ["How does billing work?", "Choose monthly or yearly pricing. Yearly pricing covers 12 months and is shown as the full annual amount."],
    ],
  },
  {
    id: "pro", name: "Pro", price: 1999, audience: "For serious learners", popular: true,
    headline: "For serious learners. Built for real careers.",
    description: "Get full course access with mentorship, live doubt clearing, practical projects and community support in one focused learning experience.",
    features: [
      ["Access to all courses", "Learn across the complete course catalogue.", "play"],
      ["1:1 mentor sessions (limited)", "Get personalised guidance from mentors.", "chat"],
      ["Live sessions & doubt clearing", "Ask questions and learn live.", "radio"],
      ["Projects & certifications", "Build a portfolio that matters.", "award"],
      ["Discord community access", "Network, collaborate and stay inspired.", "users"],
    ],
    faqs: [
      ["What is included in the Pro Plan?", "Pro includes all courses, limited 1:1 mentor sessions, live sessions and doubt clearing, projects and certifications, and Discord community access."],
      ["How do 1:1 mentor sessions work?", "The plan includes a limited number of personalised mentor sessions. Session availability and scheduling are confirmed during enrolment."],
      ["Can I move from monthly to yearly?", "Both billing options are available. Confirm how a billing change applies to your current membership before switching."],
      ["Will I get a certificate?", "Yes. Complete the required course work, projects and assessments to earn the applicable course certificate."],
    ],
  },
  {
    id: "business", name: "Business", price: 6000, audience: "For teams & organizations",
    headline: "Build stronger skills. Grow a stronger team.",
    description: "Bring your team together with dedicated mentorship, custom learning paths and practical support for your organisation's goals.",
    features: [
      ["Manage multiple students & courses", "Keep your team's learning together.", "users"],
      ["Dedicated mentor support", "Give your team focused guidance.", "chat"],
      ["Live sessions & private doubt clearing", "Make space for your team's questions.", "radio"],
      ["Custom learning paths", "Align learning with your team's goals.", "book"],
      ["Priority support & onboarding", "Help your team get started smoothly.", "award"],
    ],
    faqs: [
      ["What is included in the Business Plan?", "Business includes management of multiple students and courses, dedicated mentor support, live sessions and private doubt clearing, custom learning paths, and priority support and onboarding."],
      ["Can we customise our learning path?", "Yes. Custom learning paths are part of Business, so your team can focus on skills relevant to its goals."],
      ["How many team members can join?", "Confirm your team size and course requirements during onboarding so the appropriate access and arrangements can be agreed."],
      ["Is yearly billing available?", "Yes. Switch to Yearly to see the full annual price. Team requirements and onboarding details should be confirmed before purchasing."],
    ],
  },
];

export const planAmount = (plan, billing) => plan.price * (billing === "yearly" ? 12 : 1);
export const formatPlanPrice = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
