import { useEffect, useRef, useState } from "react";
import { Check, Download, X } from "lucide-react";
import api from "../api/client";
import { createCourseBrochure, brochureFilename } from "../utils/courseBrochure";

export default function BrochureModal({ courses, loading, onClose }) {
  const dialog = useRef(null);
  const pending = useRef(false);
  const mounted = useRef(false);
  const enquiry = useRef(null);
  const saving = useRef(false);
  const [status, setStatus] = useState("idle");
  const [download, setDownload] = useState(null);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState("idle");

  useEffect(() => {
    mounted.current = true;
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current.showModal();
    return () => { mounted.current = false; document.body.style.overflow = overflow; previousFocus?.focus(); };
  }, []);

  useEffect(() => () => { if (download) URL.revokeObjectURL(download.url); }, [download]);

  async function saveDetails() {
    if (saving.current || !enquiry.current) return;
    saving.current = true;
    setSaveStatus("saving");
    try {
      await api.post("/contact", enquiry.current, { timeout: 15000 });
      if (mounted.current) setSaveStatus("saved");
    } catch {
      if (mounted.current) setSaveStatus("error");
    } finally { saving.current = false; }
  }

  async function submit(event) {
    event.preventDefault();
    if (pending.current) return;
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const course = courses.find(item => String(item._id || item.id || item.slug) === data.course);
    if (!course) { setError("Please select an available course."); return; }
    pending.current = true;
    setStatus("sending");
    setError("");
    try {
      // A contact-service outage must never block the locally generated brochure.
      const pdf = createCourseBrochure(course).output("blob");
      enquiry.current = {
        name: data.name.trim(), email: data.email.trim(), phone: data.phone.trim(),
        subject: `Brochure request: ${course.title}`,
        message: `Course of interest: ${course.title}\nCourse ID: ${data.course}\nCity: ${data.city?.trim() || "Not specified"}\nLearning goals: ${data.message?.trim() || "Not specified"}\nConsent: Agreed to be contacted about this course and brochure request.`,
      };
      if (!mounted.current) return;
      setDownload({ url: URL.createObjectURL(pdf), filename: brochureFilename(course), title: course.title });
      setStatus("success");
      void saveDetails();
    } catch {
      setStatus("error");
      setError("The PDF could not be generated. Please try again. Your details are still here.");
    } finally { pending.current = false; }
  }

  return (
    <dialog ref={dialog} className={`cab-counselling${download ? " cab-brochure-ready" : ""}`} aria-labelledby="brochure-title" onCancel={onClose} onClick={event => { if (event.target === dialog.current) onClose(); }}>
      <div className="cab-counselling-content">
        <button type="button" className="cab-counselling-close" aria-label="Close brochure form" onClick={onClose}><X size={20} aria-hidden="true" /></button>
        <div className="cab-eyebrow">YOUR NEXT STEP STARTS HERE</div>
        <h2 id="brochure-title">Download course brochure</h2>
        {download ? <div className="cab-brochure-success" role="status">
          <span className="cab-brochure-success-icon" aria-hidden="true"><Check size={28} strokeWidth={2.5} /></span>
          <h3>Your brochure is ready</h3>
          <p>Thank you! Download the {download.title} brochure to explore the course details and curriculum.</p>
          <a className="cab-btn" href={download.url} download={download.filename}><Download size={19} aria-hidden="true" /> Download PDF brochure</a>
          {saveStatus === "saving" && <p>Saving your enquiry. You can download your brochure now.</p>}
          {saveStatus === "saved" && <p className="cab-brochure-received"><Check size={15} aria-hidden="true" />Your enquiry has been received.</p>}
          {saveStatus === "error" && <p>Your brochure is ready, but your contact details weren't saved. <button type="button" onClick={saveDetails} style={{ background: "none", border: 0, padding: 0, color: "#176fe5", textDecoration: "underline", font: "inherit" }}>Retry saving details</button></p>}
        </div> : <>
          <p>Tell us a little about yourself and choose a course to get its PDF brochure.</p>
          <form onSubmit={submit} className="cab-counselling-form" aria-busy={status === "sending"}>
            <label>Full name *<input name="name" autoComplete="name" required maxLength={100} pattern={".*\\S.*"} placeholder="Your full name" autoFocus /></label>
            <label>Email address *<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" /></label>
            <label>Phone number *<input name="phone" type="tel" autoComplete="tel" required pattern={"\\+?[0-9](?:[0-9 \\(\\)\\-]*[0-9])?"} minLength={10} maxLength={20} title="Enter a phone number with at least 10 digits, optionally starting with +." onInput={event => event.currentTarget.setCustomValidity(event.currentTarget.value.replace(/\D/g, "").length < 10 ? "Please enter at least 10 digits." : "")} placeholder="+91 98765 43210" /></label>
            <label>City (optional)<input name="city" autoComplete="address-level2" maxLength={100} placeholder="Your city" /></label>
            <label className="cab-form-wide">Course of interest *<select name="course" required defaultValue="" disabled={loading || !courses.length || status === "sending"}><option value="" disabled>{loading ? "Loading courses..." : "Select a course"}</option>{courses.map(course => <option key={course._id || course.id || course.slug} value={course._id || course.id || course.slug}>{course.title}</option>)}</select></label>
            {!loading && !courses.length && <p className="cab-form-wide" role="status">Course brochures are currently unavailable. Please try again later.</p>}
            <label className="cab-form-wide">Learning goals (optional)<textarea name="message" rows={3} maxLength={2000} placeholder="What would you like to learn or achieve?" /></label>
            <label className="cab-form-consent cab-form-wide"><input type="checkbox" required /> <span>I agree to be contacted about this course and my brochure request. *</span></label>
            {error && <p className="cab-form-error cab-form-wide" role="alert">{error}</p>}
            <button className="cab-btn cab-form-wide" type="submit" disabled={status === "sending" || loading || !courses.length}>{status === "sending" ? "Preparing your brochure..." : "Submit & get brochure"}<Download size={19} aria-hidden="true" /></button>
          </form>
        </>}
      </div>
    </dialog>
  );
}
