import { LockKeyhole, ShoppingCart, Crown, Sparkles, Building2 } from "lucide-react";
import "./CourseAccess.css";

const options = [
  { id: "individual", title: "Individual Purchase", description: "Students can buy this course individually", icon: ShoppingCart, tone: "blue" },
  { id: "starter", title: "Starter Plan", description: "Included in Starter subscription plans", icon: Crown, tone: "amber" },
  { id: "pro", title: "Pro Plan", description: "Included in Pro subscription plans", icon: Sparkles, tone: "orange" },
  { id: "business", title: "Business Plan", description: "Included in Business subscription plans", icon: Building2, tone: "purple" },
];
export default function CourseAccess({ value, onChange, stepNumber = "05" }) {
  return <section className="ce-card ce-access" id="course-access" aria-labelledby="course-access-title">
    <h2 id="course-access-title"><span>{stepNumber}</span><LockKeyhole size={21} /> Course Access</h2>
    <p className="ce-section-description">Select where this course will be available. You can choose multiple options.</p>
    <div className="ce-access-options">{options.map(({ id, title, description, icon: Icon, tone }) => <label key={id} className={`ce-access-option ${tone} ${value.includes(id) ? "selected" : ""}`}>
      <input type="checkbox" checked={value.includes(id)} onChange={event => onChange(event.target.checked ? [...value, id] : value.filter(item => item !== id))} />
      <span className="ce-access-icon"><Icon size={23} /></span><span className="ce-access-copy"><strong>{title}</strong><small>{description}</small></span>
    </label>)}</div>
    {!value.length && <p className="ce-access-warning" role="status">Select at least one access option before saving.</p>}
  </section>;
}
