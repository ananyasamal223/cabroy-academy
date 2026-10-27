import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Users, Target, Briefcase, GraduationCap } from "lucide-react";
import "./About.css";

const pillars = [
  [BookOpen, "Learn by doing", "Turn ideas into practical skills through structured lessons, projects and real marketing problems."],
  [Users, "Grow with guidance", "Build understanding with mentorship, feedback and conversations with fellow learners."],
  [Briefcase, "Create work that matters", "Bring your learning together in a portfolio that shows your thinking, creativity and problem-solving."],
];

export default function About() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "About CABROY | School of Marketing";
    window.scrollTo(0, 0);
    return () => { document.title = previousTitle; };
  }, []);
  return (
    <div className="about-cabroy">
      <header className="about-header">
        <Link className="about-brand" to="/" aria-label="CABROY home"><img src="/cabroy-logo-original.png" alt="" /><span>CABROY<small>SCHOOL OF MARKETING</small></span></Link>
        <nav aria-label="Main navigation"><Link to="/">Home</Link><Link to="/courses">Courses</Link><Link to="/about" aria-current="page">About Us</Link><Link className="about-button" to="/signup">Get started <ArrowRight aria-hidden="true" /></Link></nav>
      </header>
      <main>
        <section className="about-hero about-shell">
          <div><span className="about-eyebrow">OUR STORY. YOUR NEXT CHAPTER.</span><h1>More than courses.<br /><span>A place to grow.</span></h1><p>CABROY School of Marketing brings learning, practice and community together to help you take your next step with confidence.</p><Link className="about-button" to="/courses">Explore our courses <ArrowRight aria-hidden="true" /></Link></div>
          <div className="about-hero-art"><span className="about-art-label">THE CABROY APPROACH</span><div className="about-art-center"><GraduationCap aria-hidden="true" /><strong>Strategy. Skills.<br />Success.</strong></div><div className="about-art-path"><span>Learn</span><ArrowRight aria-hidden="true" /><span>Apply</span><ArrowRight aria-hidden="true" /><span>Grow</span></div><p>Small steps. Practical skills. New possibilities.</p></div>
        </section>
        <section className="about-story about-shell" aria-labelledby="about-purpose"><div><span className="about-eyebrow">WHY WE EXIST</span><h2 id="about-purpose">Learning should lead<br />to something real.</h2></div><div><p>Knowing a concept is a beginning. Applying it to a project, asking a better question and explaining your decisions are what make that knowledge useful.</p><p>That is the idea behind CABROY: a learning experience that connects structured courses with practice, guidance and a supportive community. Our aim is to help learners build skills they can use and work they can be proud of.</p></div></section>
        <section className="about-values about-shell" aria-labelledby="about-method"><span className="about-eyebrow">HOW WE APPROACH LEARNING</span><h2 id="about-method">Built around your progress.</h2><div className="about-values-grid">{pillars.map(([Icon, title, text]) => <article key={title}><span className="about-icon"><Icon aria-hidden="true" /></span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
        <section className="about-mission about-shell"><span className="about-icon"><Target aria-hidden="true" /></span><div><span className="about-eyebrow">OUR MISSION</span><h2>Make practical marketing education part of your next chapter.</h2><p>Whether you are exploring marketing for the first time, sharpening your skills or building your next project, start where you are and keep moving forward.</p></div></section>
        <section className="about-cta about-shell"><div><h2>Your next step starts here.</h2><p>Find a course that matches what you want to learn.</p></div><Link className="about-button" to="/courses">Find your course <ArrowRight aria-hidden="true" /></Link></section>
      </main>
      <footer className="about-footer about-shell"><span>&copy; {new Date().getFullYear()} CABROY School of Marketing.</span><nav aria-label="Footer navigation"><Link to="/">Home</Link><Link to="/courses">Courses</Link><Link to="/pricing">Pricing</Link></nav></footer>
    </div>
  );
}
