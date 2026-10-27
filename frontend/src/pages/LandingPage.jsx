import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  CircleCheckBig,
  Download,
  GraduationCap,
  Handshake,
  Lightbulb,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  User,
  Users,
  X,
} from "lucide-react";

import Footer from "../components/Footer";
import ToolIcon from "../components/ToolIcon";
import CounsellingModal from "../components/CounsellingModal";
import "./LandingChess.css";


/* ======================================================
   COURSE DATA
====================================================== */

const courses = [
  {
    title: "Digital Marketing",
    duration: "3 Months Program",

    points: [
      "Master SEO, social media, paid ads, content strategy and analytics",
      "Run ad campaigns and track ROI",
      "Build high-converting content strategies",
      "Work on real brand projects",
      "Learn industry tools and techniques",
      "Ideal for students, job seekers, freelancers & business owners",
    ],

    tools: [
      { name: "Google Ads", text: "Google Ads" },
      { name: "Meta Ads", text: "Meta" },
      { name: "Google Analytics", text: "Analytics" },
      { name: "HubSpot", text: "HubSpot" },
      { name: "Mailchimp", text: "Mailchimp" },
    ],
  },

  {
    title: "Data Analysis",
    duration: "3 Months Program",

    points: [
      "Learn Excel, SQL, Power BI and data visualization",
      "Clean, analyze and interpret data",
      "Build dashboards and reports",
      "Work on real datasets and case studies",
      "Learn data-driven decision making",
      "Ideal for aspiring analysts and working professionals",
    ],

    tools: [
      { name: "Excel", text: "Excel" },
      { name: "SQL", text: "SQL" },
      { name: "Power BI", text: "Power BI" },
      { name: "Tableau", text: "Tableau" },
      { name: "Python", text: "Python" },
    ],
  },

  {
    title: "AI Automation",
    duration: "3 Months Program",

    points: [
      "Learn AI tools, automation and workflow optimization",
      "Automate repetitive tasks and save time",
      "Build intelligent business solutions",
      "Work on AI & automation projects",
      "Learn prompt engineering and API integrations",
      "Ideal for innovators and future-ready professionals",
    ],

    tools: [
      { name: "ChatGPT", text: "ChatGPT" },
      { name: "Zapier", text: "Zapier" },
      { name: "Make", text: "Make" },
      { name: "Python", text: "Python" },
      { name: "n8n", text: "n8n" },
    ],
  },
];


/* ======================================================
   HOME
====================================================== */

export default function LandingPage() {
  const navigate = useNavigate();
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const routeMap = useRef(null);
  const routePath = useRef(null);
  const routeDot = useRef(null);
  const [activeRouteStep, setActiveRouteStep] = useState(-1);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktop = window.matchMedia("(min-width: 761px)");
    let frame;
    let observer;
    let visible = false;
    let stops = [];
    let started = null;
    let lastActive = -1;
    const path = routePath.current;
    const length = path.getTotalLength();
    function measure() {
      const matrix = path.getScreenCTM();
      if (!matrix || !desktop.matches) return;
      stops = [...routeMap.current.querySelectorAll(".learning-route-node")].map(node => {
        const box = node.getBoundingClientRect();
        let closest = 0, distance = Infinity;
        for (let i = 0; i <= 300; i++) {
          const point = path.getPointAtLength(length * i / 300);
          const screen = new DOMPoint(point.x, point.y).matrixTransform(matrix);
          const delta = Math.hypot(screen.x - box.x - box.width / 2, screen.y - box.y - box.height / 2);
          if (delta < distance) { distance = delta; closest = i / 300; }
        }
        return closest;
      });
    }
    function tick(now) {
      if (started === null) started = now;
      if (visible && desktop.matches && !motion.matches) {
        const progress = ((now - started) % 14000) / 14000;
        const point = path.getPointAtLength(progress * length);
        routeDot.current.setAttribute("cx", point.x);
        routeDot.current.setAttribute("cy", point.y);
        const current = stops.findIndex(stop => Math.abs(progress - stop) < .075);
        if (current !== lastActive) { lastActive = current; setActiveRouteStep(current); }
      } else if (lastActive !== -1) { lastActive = -1; setActiveRouteStep(-1); }
      frame = requestAnimationFrame(tick);
    }
    measure();
    observer = new ResizeObserver(measure);
    observer.observe(routeMap.current);
    const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) started = null; });
    visibility.observe(routeMap.current);
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); visibility.disconnect(); };
  }, []);


  const [showCourseForm, setShowCourseForm] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleCourseFormSubmit = (event) => {
    event.preventDefault();
    setFormSubmitted(true);
  };

  const closeCourseForm = () => {
    setShowCourseForm(false);
    setFormSubmitted(false);
  };

  const goToCourses = () => {
    setShowCourseForm(false);
    setFormSubmitted(false);
    navigate("/courses");
  };


  return (
    <div className="min-h-screen bg-white text-[#071936] chess-landing">
      {advisorOpen && <CounsellingModal onClose={() => setAdvisorOpen(false)} />}

      {/* ==================================================
          NAVBAR
      ================================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">

        <div className="mx-auto flex h-[78px] max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-12">

          <Link
            to="/"
            className="text-xl sm:text-[28px] font-extrabold tracking-tight"
          >
            <span className="chess-brand">CABROY<small>SCHOOL OF MARKETING</small></span>
          </Link>


          <div className="flex items-center">
            <Link
              to="/signup"
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Sign up
            </Link>
          </div>

        </div>

      </header>


      {/* ==================================================
          HERO
      ================================================== */}

      <section className="chess-hero" aria-labelledby="chess-hero-title">
        <div className="chess-hero-inner">
          <div className="chess-hero-copy"><span className="chess-eyebrow">CLEARER SKILLS. BRIGHTER POSSIBILITIES.</span><h1 id="chess-hero-title">Think ahead.<br /><span>Move forward.</span></h1><p>Build practical skills in Digital Marketing, Data Analytics and AI Automation. Make your next move with purpose.</p><div className="chess-hero-actions"><Link to="/courses" className="chess-button-primary">Explore Courses <ArrowRight size={17} aria-hidden="true" /></Link><button type="button" onClick={() => setAdvisorOpen(true)}>Talk to an Advisor <ArrowRight size={16} aria-hidden="true" /></button></div><span className="chess-hero-footnote"><span /> YOUR NEXT CHAPTER STARTS WITH A SKILL.</span></div>
          <figure className="chess-hero-visual"><img src="/cabroy-next-move-hero.png" alt="Cobalt blue chess knight on a light chessboard, representing a thoughtful next move" fetchPriority="high"/><span className="chess-visual-annotation">BETTER SKILLS.<br />A BIGGER PERSPECTIVE.</span><figcaption><span>STRATEGY</span><span>INSIGHT</span><span>AUTOMATION</span></figcaption></figure>
          <section className="chess-counselling-section" aria-label="Request a counselling call"><CounsellingModal inline /></section>
        </div>
        <div className="chess-course-strip" aria-label="Explore learning paths">{[["01", "Digital Marketing", "Strategy. Content. Campaigns.", "marketing"], ["02", "Data Analytics", "Data. Insights. Better decisions.", "analytics"], ["03", "AI Automation", "Tools. Workflows. New possibilities.", "automation"]].map(([number, title, description, tone]) => <Link className={`chess-course chess-course-${tone}`} to="/courses" key={number}><span className="chess-course-mark" aria-hidden="true">{tone === "marketing" ? <Target size={28}/> : tone === "analytics" ? <span className="chess-bars"><i/><i/><i/></span> : <Sparkles size={28}/>}</span><div><span className="chess-course-number">{number} / LEARNING PATH</span><h2>{title}</h2><p>{description}</p></div><ArrowRight size={18} aria-hidden="true" /></Link>)}</div>
      </section>


      {/* ==================================================
          HOW IT WORKS
      ================================================== */}

      <section id="how-it-works" className="learning-route" aria-labelledby="learning-route-title">
        <div className="learning-route-heading">
          <span className="chess-eyebrow">HOW IT WORKS</span>
          <h2 id="learning-route-title">A clear path. <span>Your next move.</span></h2>
          <p>Follow the learning route from your first course to real progress.</p>
        </div>
        <div className="learning-route-map" ref={routeMap}>
          <svg className="learning-route-landscape" viewBox="0 0 1200 420" fill="none" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="route-blue"><stop stopColor="#49a7ff"/><stop offset=".5" stopColor="#075dff"/><stop offset="1" stopColor="#092e79"/></linearGradient>
              <linearGradient id="route-bridge" x2="0" y2="1"><stop stopColor="#e8eff9"/><stop offset="1" stopColor="white"/></linearGradient>
            </defs>
            <path d="M-70 260 Q130 300 310 230 T690 260 T1260 120 L1260 155 Q920 370 690 295 T310 265 T-70 295Z" fill="url(#route-bridge)"/>
            {[0,1,2,3,4,5,6,7,8,9].map(i => <path key={i} d={`M${i*140-20} 285 v130 h24 V285`} fill="#edf2f9" opacity=".6"/>)}
            <path d="M-20 120 C45 120 70 90 120 90 C240 90 210 300 400 300 S570 130 660 130 S820 290 930 290 S1060 125 1190 125" stroke="#dbe7fb" strokeWidth="12"/>
            <path ref={routePath} className="learning-route-track" d="M-20 120 C45 120 70 90 120 90 C240 90 210 300 400 300 S570 130 660 130 S820 290 930 290 S1060 125 1190 125" stroke="url(#route-blue)" strokeWidth="5" strokeLinecap="round"/>
            <circle ref={routeDot} className="learning-route-moving-dot" cx="-20" cy="120" r="7" fill="#fff" stroke="#075dff" strokeWidth="3"/>
          </svg>
          <ol className="learning-route-stations">
            {[
              ["Choose your course", "Explore Digital Marketing, Data Analytics or AI Automation. Find the path that fits your goals.", Target],
              ["Complete enrollment", "Create your account and purchase your chosen course to get started.", User],
              ["Open your resources", "Access your purchased course and open the available learning resources.", Download],
              ["Learn and practice", "Work through the material, apply your knowledge and build your skills at your own pace.", GraduationCap],
            ].map(([title, description, Icon], index) => <li className={`learning-route-station learning-route-station-${index+1}${activeRouteStep === index ? " is-route-active" : ""}`} key={title}>
              <span className="learning-route-node" aria-hidden="true"><Icon size={25} strokeWidth={1.6}/></span>
              <div className="learning-route-step"><span className="learning-route-number">0{index+1}</span><div><h3>{title}</h3><p>{description}</p></div></div>
            </li>)}
          </ol>
          <span className="learning-route-finish"><span aria-hidden="true">&#8599;</span>Your next<br/>move starts here.</span>
        </div>
        <Link to="/courses" className="learning-route-cta">Explore Courses <ArrowRight size={17} aria-hidden="true"/></Link>
      </section>


      {/* ==================================================
          COURSES
      ================================================== */}

      <section id="courses" className="course-trail" aria-labelledby="course-trail-title">
        <header className="course-trail-heading">
          <span className="chess-eyebrow">THREE PATHS. NEW POSSIBILITIES.</span>
          <h2 id="course-trail-title">Find your course.<br className="course-trail-mobile-break"/> <span>Build your toolkit.</span></h2>
          <p>From marketing to data to automation, explore the tools that bring each skill to life.</p>
        </header>
        <div className="course-trail-stage">
          <svg className="course-trail-connector" viewBox="0 0 1200 560" fill="none" preserveAspectRatio="none" aria-hidden="true">
            <path d="M200 170 C350 20 520 160 590 275 S830 490 1000 375" stroke="#d8e8ff" strokeWidth="4"/>
            <path className="course-trail-flow" d="M200 170 C350 20 520 160 590 275 S830 490 1000 375" stroke="#327eff" strokeWidth="2" strokeDasharray="8 12"/>
            <circle cx="365" cy="116" r="6" fill="white" stroke="#327eff" strokeWidth="2"/>
            <circle cx="812" cy="413" r="6" fill="white" stroke="#327eff" strokeWidth="2"/>
          </svg>
          <div className="course-trail-cards">
            {[
              {title:"Digital Marketing", description:"Learn to plan, run and measure campaigns that connect with your audience.", Icon:Target, tools:[["Google Ads","google-ads"],["Meta Ads","meta-ads"],["Google Analytics","google-analytics"]]},
              {title:"Data Analytics", description:"Turn data into clear insights, useful dashboards and confident decisions.", Icon:BriefcaseBusiness, tools:[["Excel","excel"],["SQL",null],["Power BI","power-bi"]]},
              {title:"AI Automation", description:"Connect your tools and build smarter workflows that save time.", Icon:Sparkles, tools:[["n8n","n8n"],["ChatGPT",null],["Zapier",null]]},
            ].map(({title,description,Icon},index)=><article className={`course-trail-card course-trail-card-${index+1}`} key={title} style={{"--trail-order":index}}>
              <div className="course-trail-card-top"><span className="course-trail-number">0{index+1}</span><span className="course-trail-sculpture" aria-hidden="true"><Icon size={43} strokeWidth={1.35}/><i/><i/></span></div>
              <span className="course-trail-label">EXPLORE YOUR PATH</span>
              <h3>{title}</h3><p>{description}</p>
              <div className="course-trail-tools-window" role="region" aria-label={`${title} tools`} tabIndex={0}>
                <div className="course-trail-tools-scroll">
                  {[0,1].map(copy=><ul className="course-trail-tools" key={copy} aria-hidden={copy === 1 ? true : undefined}>
                    {courses[index].tools.map(({name,text})=>{
                      const asset={"Google Ads":"google-ads","Meta Ads":"meta-ads","Google Analytics":"google-analytics",Excel:"excel",SQL:"sql","Power BI":"power-bi",Python:"python",n8n:"n8n"}[name];
                      return <li key={name}><span className="course-trail-tool-logo">{asset ? <img src={`/course-icons/${asset}.svg`} alt="" loading="lazy"/> : <ToolIcon name={name} size={29}/>}</span><span>{text}</span></li>;
                    })}
                  </ul>)}
                </div>
              </div>
              <Link to="/courses" className="course-trail-link">Explore Course <ArrowRight size={16} aria-hidden="true"/></Link>
            </article>)}
          </div>
        </div>
        <div className="course-trail-footer"><span>Find the path that fits your goals.</span><button type="button" onClick={() => setShowCourseForm(true)}>View All Courses <ArrowRight size={17} aria-hidden="true"/></button></div>
      </section>


      {/* ==================================================
          ALUMNI
      ================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-10 text-center">

        <p className="text-xs font-bold uppercase tracking-[0.1em] text-blue-600">
          From Rathi Academy to the Industry
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          Our Alumni Work Across Top Brands
        </h2>


        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">

          {[
            "STARBUCKS",
            "CRED",
            "NYKAA",
            "Myntra",
            "zomato",
            "boAt",
            "TCS",
          ].map((brand) => (

            <div
              key={brand}
              className="flex h-[72px] items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              {brand}
            </div>

          ))}

        </div>


        <button
          type="button"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
        >

          View Placement Report

          <ArrowRight size={16} />

        </button>

      </section>


      {/* ==================================================
          DEEP BLUE STATS
      ================================================== */}

      <section className="mx-auto max-w-7xl px-6 py-7">

        <div className="grid overflow-hidden rounded-2xl bg-gradient-to-r from-[#061b46] via-[#073272] to-[#074aa9] shadow-[0_15px_40px_rgba(3,26,66,0.20)] md:grid-cols-4">

          <DeepStat
            icon={<Users size={28} />}
            value="50,000+"
            label="Learners Trained"
          />

          <DeepStat
            icon={<Handshake size={28} />}
            value="500+"
            label="Hiring Partners"
          />

          <DeepStat
            icon={<BriefcaseBusiness size={28} />}
            value="2,000+"
            label="Projects Completed"
          />

          <DeepStat
            icon={<Star size={28} />}
            value="95%"
            label="Learner Success Rate"
          />

        </div>

      </section>


      {/* ==================================================
          TESTIMONIALS
      ================================================== */}

      <section className="mx-auto max-w-7xl px-6 pt-14">

        <div className="text-center">

          <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Success Stories
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            Real Learners. Real Stories.
          </h2>

        </div>


        <div className="mt-8 grid gap-6 md:grid-cols-3">

          <TestimonialCard
            quote="Rathi Academy helped me switch my career to digital marketing. The mentors and projects are amazing!"
            name="Priya Sharma"
            role="Digital Marketing Specialist"
          />

          <TestimonialCard
            quote="The data analytics course simplified complex topics. I landed my dream job as a Data Analyst."
            name="Arjun Patel"
            role="Data Analyst"
          />

          <TestimonialCard
            quote="Hands-on projects and automation lessons gave me the confidence to build AI-powered solutions."
            name="Neha Verma"
            role="AI Automation Engineer"
          />

        </div>

      </section>


      {/* ==================================================
          DOWNLOAD BROCHURE
      ================================================== */}

      <section className="mx-auto max-w-7xl px-6 pt-9">

        <div className="grid items-center gap-6 rounded-2xl bg-gradient-to-r from-[#eef6ff] to-[#f6f9ff] px-8 py-7 md:grid-cols-[1fr_auto] md:px-12">

          <div className="flex items-center gap-5">

            <div className="flex h-[74px] w-[74px] shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">

              <Download
                size={31}
                className="text-blue-600"
              />

            </div>


            <div>

              <h3 className="text-2xl font-bold">
                Download Our Brochure
              </h3>

              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-600">

                Explore programs, curriculum, fees and everything you need to know.

              </p>

            </div>

          </div>


          <button
            type="button"
            className="flex min-w-0 w-full sm:w-auto sm:min-w-[285px] items-center justify-center gap-3 rounded-lg bg-blue-600 px-8 py-4 text-sm font-semibold text-white transition hover:bg-blue-700"
          >

            Download Brochure

            <Download size={18} />

          </button>

        </div>

      </section>


      {/* ==================================================
          ABOUT
      ================================================== */}

      <section
        id="about"
        className="mx-auto max-w-7xl px-6 pt-12"
      >

        <div className="grid items-center gap-10 lg:grid-cols-[0.87fr_1.13fr]">

          <div>

            <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-600">
              About Us
            </p>

            <h2 className="mt-3 text-4xl font-bold leading-[1.18]">

              Shaping Careers in
              <br />

              Digital for a{" "}

              <span className="text-blue-600">
                Better Future
              </span>

            </h2>


            <p className="mt-5 max-w-xl text-[15px] leading-7 text-slate-600">

              Rathi Academy is committed to empowering learners with
              practical skills, real-world experience, and the right guidance
              to thrive in today&apos;s digital world.

            </p>


            {/* PROFESSIONAL ICON FEATURES */}

            <div className="mt-8 grid gap-4 sm:grid-cols-3">

              <AboutFeature
                icon={<Target size={22} />}
                title="Industry-Aligned Curriculum"
                description="Built around current industry needs."
              />

              <AboutFeature
                icon={<Lightbulb size={22} />}
                title="Practical Learning"
                description="Learn by building and applying."
              />

              <AboutFeature
                icon={<ShieldCheck size={22} />}
                title="Career-First Approach"
                description="Skills focused on real outcomes."
              />

            </div>

          </div>


          <img
            src="/about-rathi-academy.jpg"
            alt="Rathi Academy learning environment"
            className="h-[310px] w-full rounded-2xl object-cover shadow-sm"
          />

        </div>

      </section>


      {/* ==================================================
          READY TO BUILD CTA
      ================================================== */}

      <section className="mx-auto max-w-7xl px-6 pt-12">

        <div className="relative overflow-hidden rounded-[24px] border border-blue-100 bg-gradient-to-r from-[#eef6ff] via-white to-[#edf7ff] px-8 py-9 md:px-12">

          <div className="absolute -left-10 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full border border-blue-100" />

          <div className="absolute -left-4 top-1/2 h-28 w-28 -translate-y-1/2 rounded-full border border-blue-100" />

          <div className="relative z-10 grid items-center gap-7 lg:grid-cols-[0.85fr_1fr_auto]">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-600">
                Take the next step
              </p>

              <h2 className="mt-2 text-3xl font-extrabold leading-tight">
                Ready to Build
                <br />
                Your Future?
              </h2>

            </div>


            <div>

              <p className="max-w-md text-[15px] leading-7 text-slate-600">
                Join learners building practical skills, completing
                real projects and preparing for better opportunities.
              </p>

            </div>


            <div className="flex flex-wrap gap-3 lg:justify-end">

              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-4 font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-blue-700"
              >

                Create Free Account

                <ArrowRight size={17} />

              </Link>


              <button
                type="button"
                onClick={() => {
                  document
                    .getElementById("enquire")
                    ?.scrollIntoView({
                      behavior: "smooth",
                    });
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-300 bg-white px-7 py-4 font-bold text-blue-700 transition hover:border-blue-500 hover:bg-blue-50"
              >

                <MessageCircle size={18} />

                Talk to a Mentor

              </button>

            </div>

          </div>

        </div>

      </section>


      {/* ==================================================
          FAQ
      ================================================== */}

      <section
        id="faq"
        className="mx-auto max-w-7xl px-6 pb-12 pt-12"
      >

        <p className="text-xs font-bold uppercase tracking-[0.12em] text-blue-600">
          FAQs
        </p>

        <h2 className="mt-2 text-3xl font-bold">
          Frequently Asked Questions
        </h2>


        <div className="mt-6 grid gap-x-10 gap-y-3 md:grid-cols-2">

          <FaqItem question="Who can join Rathi Academy programs?">
            Our programs are suitable for students, graduates,
            working professionals, freelancers and business owners.
          </FaqItem>


          <FaqItem question="Do you provide placement support?">
            Career support includes resume guidance, portfolio guidance,
            interview preparation and relevant placement assistance.
          </FaqItem>


          <FaqItem question="Are the programs online or offline?">
            Program delivery depends on the selected course and batch.
          </FaqItem>


          <FaqItem question="Can I pay the fees in installments?">
            Installment options can be available depending on the selected program.
          </FaqItem>


          <FaqItem question="Will I get a certificate after completion?">
            Students completing the required modules, project and evaluation
            criteria can receive their certificate.
          </FaqItem>


          <FaqItem question="What if I have more questions?">
            Submit an enquiry and our counsellor can connect with you.
          </FaqItem>

        </div>

      </section>


      <Footer />


      {/* ==================================================
          COURSE FORM MODAL
      ================================================== */}

      {showCourseForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07111f]/60 px-4 py-3 backdrop-blur-md">
          <div className="relative w-full max-w-[590px] overflow-hidden rounded-[24px] border border-white/50 bg-white shadow-[0_30px_90px_rgba(2,12,27,0.38)]">

            <button
              type="button"
              onClick={closeCourseForm}
              className="absolute right-4 top-4 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-black transition hover:bg-black hover:text-white"
            >
              <X size={16} />
            </button>

            {!formSubmitted ? (
              <>
                <div className="px-6 pb-2 pt-5 md:px-7">
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-600">
                    Step 1 of 2
                  </p>

                  <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" />
                  </div>

                  <div className="mt-3 pr-8">
                    <h2 className="text-[22px] font-extrabold leading-[1.12] tracking-[-0.4px] text-slate-950 sm:text-[24px]">
                      Find the right course for you.
                    </h2>

                    <p className="mt-1.5 max-w-[520px] text-[10px] leading-4 text-slate-500">
                      Tell us a little about yourself so we can guide you towards the most relevant learning path.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handleCourseFormSubmit}
                  className="space-y-3 px-6 pb-5 pt-2 md:px-7"
                >
                  <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">
                    <ModalInput
                      icon={<User size={16} />}
                      label="Full Name"
                      placeholder="Enter your name"
                      type="text"
                    />

                    <ModalInput
                      icon={<Phone size={16} />}
                      label="Phone Number"
                      placeholder="+91 98765 43210"
                      type="tel"
                    />
                  </div>

                  <ModalInput
                    icon={<Mail size={16} />}
                    label="Email Address"
                    placeholder="you@example.com"
                    type="email"
                  />

                  <div>
                    <label className="text-[10px] font-bold text-slate-800">
                      What do you want to learn?
                    </label>

                    <div className="mt-1.5 grid grid-cols-3 gap-2">
                      <CourseChoice
                        value="Digital Marketing"
                        icon={<Target size={15} />}
                      />

                      <CourseChoice
                        value="Data Analysis"
                        icon={<BriefcaseBusiness size={15} />}
                      />

                      <CourseChoice
                        value="AI Automation"
                        icon={<Sparkles size={15} />}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-800">
                        Current Status
                      </label>

                      <div className="relative mt-1.5">
                        <select
                          required
                          defaultValue=""
                          className="h-[40px] w-full appearance-none rounded-xl border border-slate-200 bg-[#fbfcfe] px-3 pr-9 text-[11px] text-slate-600 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-50"
                        >
                          <option value="" disabled>
                            Select status
                          </option>
                          <option>Student</option>
                          <option>Pursuing Graduation</option>
                          <option>Graduate</option>
                          <option>Working Professional</option>
                          <option>Freelancer</option>
                          <option>Business Owner</option>
                        </select>

                        <ChevronDown
                          size={15}
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-700"
                        />
                      </div>
                    </div>

                    <ModalInput
                      icon={<MapPin size={16} />}
                      label="City"
                      placeholder="Enter your city"
                      type="text"
                    />
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={closeCourseForm}
                      className="rounded-lg bg-slate-100 px-5 py-2.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-200"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-2.5 text-[11px] font-bold text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)] transition hover:-translate-y-0.5"
                    >
                      Continue
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="px-7 py-10 text-center">
                <div className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full bg-emerald-50">
                  <div className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
                    <CircleCheckBig size={28} strokeWidth={2.6} />
                  </div>
                </div>

                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                  Successfully Submitted
                </p>

                <h2 className="mt-2 text-[26px] font-extrabold tracking-tight text-slate-950">
                  Your form has been submitted!
                </h2>

                <p className="mx-auto mt-3 max-w-md text-[12px] leading-5 text-slate-500">
                  Thanks for sharing your details. Explore all available courses and choose the learning path that matches your goals.
                </p>

                <button
                  type="button"
                  onClick={goToCourses}
                  className="mt-6 inline-flex min-w-[220px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-[12px] font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-700"
                >
                  Explore Courses
                  <ArrowRight size={17} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}


/* ======================================================
   HERO FEATURE
====================================================== */

function HeroFeature({
  icon,
  text,
}) {
  return (
    <div className="flex items-center gap-2.5 text-[13px] font-semibold">

      <span className="text-blue-600">
        {icon}
      </span>

      <span>
        {text}
      </span>

    </div>
  );
}


/* ======================================================
   HERO INPUT
====================================================== */

function HeroInput({
  icon,
  placeholder,
  type,
}) {
  return (
    <div className="group flex h-[56px] items-center rounded-xl border border-slate-200 bg-white px-3 transition-all duration-200 hover:border-slate-300 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-50">

      <div className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f3f4f6] text-black transition-all duration-200 group-focus-within:bg-black group-focus-within:text-white">

        {icon}

      </div>


      <input
        type={type}
        placeholder={placeholder}
        className="h-full w-full bg-transparent text-[14px] font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400"
      />

    </div>
  );
}


/* ======================================================
   MODAL INPUT
====================================================== */

function ModalInput({
  icon,
  label,
  placeholder,
  type,
}) {
  return (
    <div>
      <label className="text-[11px] font-bold text-slate-800">
        {label}
      </label>

      <div className="group mt-1.5 flex h-[40px] items-center rounded-xl border border-slate-200 bg-[#fbfcfe] px-2.5 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-50">
        <span className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600">
          {icon}
        </span>

        <input
          type={type}
          required
          placeholder={placeholder}
          className="h-full w-full bg-transparent text-[12px] text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}

/* ======================================================
   COURSE CHOICE
====================================================== */

function CourseChoice({
  value,
  icon,
}) {
  return (
    <label className="cursor-pointer">

      <input
        type="radio"
        name="courseInterest"
        value={value}
        required
        className="peer sr-only"
      />


      <div className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 text-center text-[10px] font-semibold text-slate-600 transition-all hover:border-blue-300 peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:text-blue-700 peer-checked:ring-2 peer-checked:ring-blue-100">

        <span className="text-blue-600">
          {icon}
        </span>

        {value}

      </div>

    </label>
  );
}


/* ======================================================
   DEEP STAT
====================================================== */

function DeepStat({
  icon,
  value,
  label,
}) {
  return (
    <div className="flex items-center justify-center gap-4 border-b border-white/10 px-6 py-7 text-white last:border-0 md:border-b-0 md:border-r">

      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-blue-100 ring-1 ring-white/10">
        {icon}
      </div>

      <div className="text-left">

        <p className="text-2xl font-extrabold tracking-tight">
          {value}
        </p>

        <p className="mt-1 text-xs font-medium text-blue-100/90">
          {label}
        </p>

      </div>

    </div>
  );
}


/* ======================================================
   TESTIMONIAL
====================================================== */

function TestimonialCard({
  quote,
  name,
  role,
}) {
  return (
    <article className="min-h-[190px] rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-md">

      <div className="text-5xl font-bold leading-none text-blue-600">
        “
      </div>


      <p className="mt-1 text-sm leading-6 text-slate-700">
        {quote}
      </p>


      <div className="mt-6 flex items-center gap-3">

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 font-bold text-blue-700">

          {name
            .split(" ")
            .map((part) => part[0])
            .join("")}

        </div>


        <div>

          <h4 className="font-bold">
            {name}
          </h4>

          <p className="text-sm text-slate-500">
            {role}
          </p>

        </div>

      </div>

    </article>
  );
}


/* ======================================================
   ABOUT FEATURE
====================================================== */

function AboutFeature({
  icon,
  title,
  description,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-md">

      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </div>

      <h3 className="mt-4 text-sm font-bold leading-5">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        {description}
      </p>

    </div>
  );
}


/* ======================================================
   FAQ
====================================================== */

function FaqItem({
  question,
  children,
}) {
  return (
    <details className="group rounded-xl border border-slate-200 bg-white px-5 transition hover:border-blue-200">

      <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-sm font-semibold">

        <span>
          {question}
        </span>

        <span className="ml-4 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-lg transition group-open:rotate-45 group-open:bg-blue-600 group-open:text-white">
          +
        </span>

      </summary>


      <p className="pb-5 text-sm leading-6 text-slate-600">
        {children}
      </p>

    </details>
  );
}