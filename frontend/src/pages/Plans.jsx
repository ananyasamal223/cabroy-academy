import { useEffect } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowRight, ArrowLeft, Check, BookOpen, Play, MessageCircle, Radio, Users, Award, ShieldCheck, Clock3 } from "lucide-react";
import { plans, planAmount, formatPlanPrice } from "../data/plans";
import NotFound from "./NotFound";
import { useAuth } from "../context/AuthContext";
import "./Plans.css";

const icons = { book: BookOpen, play: Play, chat: MessageCircle, radio: Radio, users: Users, award: Award };

function BillingSwitch({ billing, onChange }) {
  return <div className="plans-billing" role="group" aria-label="Billing period">
    {["monthly", "yearly"].map(period => <button key={period} type="button" aria-pressed={billing === period} onClick={() => onChange(period)}>{period === "monthly" ? "Monthly" : "Yearly"}</button>)}
  </div>;
}

function Price({ plan, billing }) {
  return <div className="plans-price" aria-live="polite"><strong>{formatPlanPrice(planAmount(plan, billing))}</strong><span>/ {billing === "yearly" ? "year" : "month"}</span></div>;
}

function FeatureList({ plan }) {
  return <ul className="plans-feature-list">{plan.features.map(([title]) => <li key={title}><Check size={17} aria-hidden="true" /><span>{title}</span></li>)}</ul>;
}

function PlanHeader() {
  return <header className="plans-header"><div className="plans-shell plans-nav">
    <Link to="/" className="plans-brand" aria-label="CABROY home"><img src="/cabroy-logo-original.png" alt="CABROY crest" /><span><b>CABROY</b><small>SCHOOL OF MARKETING</small></span></Link>
    <nav aria-label="Main navigation"><Link to="/">Home</Link><Link to="/courses">Courses</Link><Link to="/plans" aria-current="page">Plans</Link><Link to="/community">Community</Link></nav>
    <Link to="/dashboard" className="plans-button plans-button-outline plans-dashboard">Dashboard <ArrowRight size={16} /></Link>
  </div></header>;
}

function PlanFooter() {
  return <footer className="plans-footer"><div className="plans-shell plans-footer-grid">
    <div className="plans-footer-brand"><img src="/cabroy-logo-original.png" alt="CABROY" /><div><strong>Strategy Creates Tomorrow.</strong><p>Practical marketing education for a brighter tomorrow.</p></div></div>
    <div><h3>Product</h3><Link to="/courses">Courses</Link><Link to="/plans">Plans</Link><Link to="/community">Community</Link></div>
    <div><h3>Company</h3><Link to="/">Home</Link><Link to="/login">Log in</Link><Link to="/signup">Sign up</Link></div>
    <div><h3>Your learning</h3><Link to="/dashboard">Dashboard</Link><Link to="/my-courses">My courses</Link><Link to="/certificates">Certificates</Link></div>
  </div><div className="plans-shell plans-copyright">© {new Date().getFullYear()} CABROY School of Marketing. All rights reserved.</div></footer>;
}

export default function Plans() {
  const { planId } = useParams();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const billing = searchParams.get("billing") === "yearly" ? "yearly" : "monthly";
  const legacyPlan = searchParams.get("plan");
  const plan = plans.find(item => item.id === planId);
  const changeBilling = (period) => setSearchParams(previous => { const next = new URLSearchParams(previous); next.set("billing", period); return next; }, { preventScrollReset: true });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    const previousTitle = document.title;
    document.title = `${plan ? `${plan.name} Plan` : "Plans & Pricing"} | CABROY`;
    return () => { document.title = previousTitle; };
  }, [plan]);

  if (!planId && legacyPlan && plans.some(item => item.id === legacyPlan)) return <Navigate replace to={`/plans/${legacyPlan}?billing=${billing}`} />;
  if (planId && !plan) return <NotFound />;

  return <div className="plans-page"><PlanHeader /><main id="plans-main">
    {plan ? <>
      <section className="plans-hero"><div className="plans-shell">
        <Link className="plans-back" to={`/plans?billing=${billing}`}><ArrowLeft size={15} /> All plans</Link>
        <div className="plans-detail-grid">
          <div className="plans-hero-copy"><p className="plans-eyebrow">CABROY {plan.name.toUpperCase()}</p><h1>{plan.name} Plan<span>.</span></h1><h2>{plan.headline}</h2><p className="plans-description">{plan.description}</p>
            <div className="plans-benefits">{plan.features.map(([title, description, icon]) => { const Icon = icons[icon]; return <div className="plans-benefit" key={title}><span className="plans-icon"><Icon size={22} strokeWidth={1.7} aria-hidden="true" /></span><div><h3>{title}</h3><p>{description}</p></div></div>; })}</div>
            <div className="plans-actions"><a className="plans-button plans-button-primary" href="#plan-enrolment">Get Started <ArrowRight size={17} /></a><Link className="plans-button plans-button-outline" to={`/plans?billing=${billing}`}>Compare Plans</Link></div>
          </div>
          <aside className={`plans-purchase-card ${plan.popular ? "is-popular" : ""}`} id="plan-enrolment" aria-label={`${plan.name} plan enrolment`}>
            {plan.popular && <span className="plans-popular">Most Popular</span>}
            <p className="plans-eyebrow">{plan.name.toUpperCase()} PLAN</p><BillingSwitch billing={billing} onChange={changeBilling} /><Price plan={plan} billing={billing} /><p className="plans-billing-note">{billing === "yearly" ? "Full price for 12 months of learning." : "A focused investment in your next step."}</p>
            <FeatureList plan={plan} />
            <Link className="plans-button plans-button-primary" to={user ? `/plans/${plan.id}/checkout?billing=${billing}` : `/signup?plan=${plan.id}&billing=${billing}`}>Get Started <ArrowRight size={17} /></Link>
            <p className="plans-card-note"><ShieldCheck size={15} /> {user ? "Continue to your plan checkout" : "Start by creating your CABROY account"}</p>
          </aside>
        </div>
      </div></section>
      <section className="plans-reassurance" aria-label="Learning benefits"><div className="plans-shell">{[[BookOpen, "Practical learning", "Build skills you can put to work"], [Clock3, "Flexible learning", "Make time for your next step"], [Users, "Community support", "Grow alongside other learners"], [Award, "Career-focused skills", "Learn with your future in mind"]].map(([Icon, title, copy]) => <div key={title}><Icon size={26} strokeWidth={1.7} aria-hidden="true" /><span><h3>{title}</h3><p>{copy}</p></span></div>)}</div></section>
      <section className="plans-faq plans-shell"><div className="plans-section-heading"><p className="plans-eyebrow">FREQUENTLY ASKED QUESTIONS</p><h2>Questions about {plan.name} Plan?</h2><p>A little clarity for your next big step.</p></div><div className="plans-faq-list">{plan.faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true" className="plans-faq-plus" /></summary><p>{answer}</p></details>)}</div></section>
    </> : <section className="plans-overview plans-shell"><div className="plans-section-heading"><p className="plans-eyebrow">YOUR NEXT CHAPTER STARTS HERE</p><h1>Invest in your <span>potential.</span></h1><p>One goal or a whole new direction. Find the right plan for your journey.</p><BillingSwitch billing={billing} onChange={changeBilling} /></div>
      <div className="plans-comparison">{plans.map(item => <article className={`plans-purchase-card ${item.popular ? "is-popular" : ""}`} key={item.id}>{item.popular && <span className="plans-popular">Most Popular</span>}<p className="plans-eyebrow">CABROY {item.name.toUpperCase()}</p><h2>{item.name}</h2><p className="plans-audience">{item.audience}</p><Price plan={item} billing={billing} /><FeatureList plan={item} /><Link className={`plans-button ${item.popular ? "plans-button-primary" : "plans-button-outline"}`} to={`/plans/${item.id}?billing=${billing}`}>Get Started <ArrowRight size={17} /></Link></article>)}</div>
      <p className="plans-overview-note">All prices in INR. Choose a plan to explore its benefits and frequently asked questions.</p>
    </section>}
  </main><PlanFooter /></div>;
}
