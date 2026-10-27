import { useEffect, useId, useRef, useState } from "react";
import api from "../api/client";
import { X } from "lucide-react";

export default function CounsellingModal({ onClose, inline = false }) {
  const dialog = useRef(null);
  const titleId = useId();
  const Container = inline ? "div" : "dialog";
  const [status, setStatus] = useState("idle");
  useEffect(() => {
    if (inline) return;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current.showModal();
    return () => {
      document.body.style.overflow = overflow;
      previousFocus?.focus();
    };
  }, [inline]);

  async function submit(event) {
    event.preventDefault();
    if (status === "sending") return;
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setStatus("sending");
    try {
      await api.post("/contact", {
        name: data.name.trim(), email: data.email.trim(), phone: data.phone.trim(),
        subject: `Counselling enquiry: ${data.course}`,
        message: `Course of interest: ${data.course}\nCity: ${data.city.trim()}\nPreferred call time: ${data.time}\nLearning goals: ${data.message.trim() || "Not specified"}`,
      }, { timeout: 15000 });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <Container ref={dialog} className={inline ? "cab-counselling-inline" : "cab-counselling"} aria-labelledby={titleId} onCancel={inline ? undefined : onClose} onClick={inline ? undefined : event => { if (event.target === dialog.current) onClose(); }}>
      <div className="cab-counselling-content">
        {!inline && <button type="button" className="cab-counselling-close" aria-label="Close counselling form" onClick={onClose}><X size={20} aria-hidden="true" /></button>}
        <div className="cab-eyebrow">LET’S PLAN YOUR NEXT STEP</div>
        <h2 id={titleId}>Book a free counselling call</h2>
        {status === "success" ? <div role="status">
          <h3>Thank you! Your enquiry is received.</h3>
          <p>Our team will contact you to arrange your counselling call.</p>
          {!inline && <button type="button" className="cab-btn" onClick={onClose}>Done</button>}
        </div> : <>
          <p>Tell us a little about yourself. We’ll help you choose the right course for your goals.</p>
          <form onSubmit={submit} className="cab-counselling-form">
            <label>Full name *<input name="name" autoComplete="name" required maxLength={100} pattern=".*\S.*" placeholder="Your full name" autoFocus={!inline} /></label>
            <label>Email address *<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" /></label>
            <label>Phone number *<input name="phone" type="tel" autoComplete="tel" required pattern="[+0-9()\s-]{10,20}" title="Enter a phone number with 10–20 characters, including country code if needed." placeholder="+91 98765 43210" /></label>
            <label>City *<input name="city" autoComplete="address-level2" required pattern=".*\S.*" maxLength={100} placeholder="Your city" /></label>
            <label>Course of interest *<select name="course" required defaultValue=""><option value="" disabled>Select a course</option><option>Digital Marketing</option><option>Data Analytics</option><option>AI Automation</option><option>Help me choose</option></select></label>
            <label>Preferred call time (IST)<select name="time" defaultValue="Any time"><option>Any time</option><option>Morning: 9 am – 12 pm</option><option>Afternoon: 12 pm – 5 pm</option><option>Evening: 5 pm – 8 pm</option></select></label>
            <label className="cab-form-wide">Your learning goals (optional)<textarea name="message" rows={3} maxLength={2000} placeholder="What would you like to learn or achieve?" /></label>
            <label className="cab-form-consent cab-form-wide"><input type="checkbox" required /> <span>I agree to be contacted about my counselling enquiry. *</span></label>
            {status === "error" && <p className="cab-form-error cab-form-wide" role="alert">We couldn’t submit your enquiry. Please try again. Your details are still here.</p>}
            <button className="cab-btn cab-form-wide" type="submit" disabled={status === "sending"}>{status === "sending" ? "Submitting…" : "Request a counselling call"}</button>
          </form>
        </>}
      </div>
    </Container>
  );
}
