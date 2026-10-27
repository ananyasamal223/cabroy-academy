import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, BookOpen, GraduationCap, LockKeyhole } from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import { courses } from "../data/courses";
import { plans, planAmount } from "../data/plans";
import NotFound from "./NotFound";
import { exploreCourses } from "../data/exploreCourses";
import { readCartItems } from "../utils/cart";
import { createProgramCartItem } from "../utils/courseBundle";
import { checkoutCourseIds, checkoutPricing } from "../utils/checkout";
import { BillingStep, PaymentStep, ConfirmationStep, CheckoutStepper, CheckoutSummary } from "../components/CheckoutSteps";
import "./Checkout.css";

let razorpayLoader;
function UserAccountNotice({ user, mismatch, onSwitch, disabled }) {
  return <div><strong>Purchase account: {user?.name}</strong><p>{user?.email}</p><p>{mismatch ? "The email you entered does not match this account. Switch accounts to buy for that learner." : "Your plan or courses will be added to this signed-in account."}</p><button type="button" className="co-secondary" onClick={onSwitch} disabled={disabled}>Switch account</button></div>;
}
function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve();
  if (razorpayLoader) return razorpayLoader;
  razorpayLoader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timer = setTimeout(() => fail(), 20000);
    const fail = () => { clearTimeout(timer); script.remove(); razorpayLoader = null; reject(new Error("Could not load Razorpay. Check your connection and try again.")); };
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => { clearTimeout(timer); if (window.Razorpay) resolve(); else fail(); };
    script.onerror = fail;
    document.body.appendChild(script);
  });
  return razorpayLoader;
}

export default function Checkout() {
  const { user } = useAuth();
  const { courseId, planId } = useParams();
  const [search] = useSearchParams();
  const billing = search.get("billing") === "yearly" ? "yearly" : "monthly";
  const plan = plans.find((item) => item.id === planId);
  if (planId && !plan) return <NotFound />;
  return <CheckoutFlow key={`${user?._id || user?.id || user?.email}-${planId ? `${planId}-${billing}` : courseId}`} courseId={courseId} plan={plan} billing={billing} />;
}

function CheckoutFlow({ courseId, plan, billing }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [cart] = useState(() => {
    if (plan) return [{ id: plan.id, title: `${plan.name} Plan`, price: planAmount(plan, billing), type: "plan", billing, features: plan.features }];
    const stored = readCartItems();
    if (courseId === "cart") return stored;
    if (courseId === "career-accelerator") return [createProgramCartItem(courses, courses.map((course) => course.id))];
    const existing = stored.find((item) => item.id === courseId);
    const known = [...courses, ...exploreCourses].find((item) => item.id === courseId);
    return existing ? [existing] : known ? [{ ...known, type: "course" }] : [];
  });
  const [realCourse, setRealCourse] = useState(null);
  const [form, setForm] = useState({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "", country: "India", city: "", state: "", pin: "", address: "" });
  const [promo, setPromo] = useState("");
  const [promoInfo, setPromoInfo] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [promoChecking, setPromoChecking] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [preparedOrder, setPreparedOrder] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [verification, setVerification] = useState(null);
  const payLock = useRef(false);
  const promoRequest = useRef(0);
  const headingRef = useRef(null);
  const accountMismatch = form.email.trim().toLowerCase() !== (user?.email || "").toLowerCase();
  const switchAccount = async () => {
    await logout();
    navigate("/login", { state: { from: `${location.pathname}${location.search}` } });
  };
  const items = realCourse ? [{ ...realCourse, id: courseId, type: "course" }] : cart;
  const price = preparedOrder ? {
    subtotal: Number(preparedOrder.pricing?.subtotal ?? preparedOrder.order.amount / 100),
    discount: Number(preparedOrder.pricing?.discount || 0),
    total: preparedOrder.order.amount / 100,
  } : checkoutPricing(items, promoInfo);

  useEffect(() => {
    if (plan || courseId === "cart") return;
    let active = true;
    api.get(`/courses/${courseId}`).then(({ data }) => { if (active && data.course) setRealCourse(data.course); }).catch(() => {});
    return () => { active = false; };
  }, [courseId, plan]);
  useEffect(() => { headingRef.current?.focus(); }, [step]);

  const changePromo = (value) => {
    promoRequest.current += 1;
    setPromo(value.toUpperCase()); setPromoInfo(null); setPromoError(""); setPreparedOrder(null); setPayError(""); setPromoChecking(false);
  };
  const applyPromo = async (event) => {
    event.preventDefault();
    const code = promo.trim().toUpperCase();
    if (!code) { setPromoError("Enter a promo code."); return; }
    const request = ++promoRequest.current;
    setPromoChecking(true); setPromoError("");
    try {
      const { data } = await api.post("/payments/validate-promo", { promoCode: code });
      if (request !== promoRequest.current) return;
      setPromo(data.promoCode); setPromoInfo(data); setPreparedOrder(null);
    } catch (error) {
      if (request === promoRequest.current) { setPromoInfo(null); setPromoError(error.response?.data?.message || "Could not validate this promo code. Please try again."); }
    } finally { if (request === promoRequest.current) setPromoChecking(false); }
  };
  const verify = async (response, order) => {
    setVerification({ response, order });
    try {
      const { data } = await api.post("/payments/verify", response);
      setReceipt({ id: response.razorpay_payment_id, orderId: response.razorpay_order_id, total: Number(data.payment?.amount ?? order.order.amount / 100) });
      setVerification(null); setPayError(""); setStep(3);
      // Remove only purchased entries, retaining anything added in another tab.
      try {
        const purchasedIds = new Set(plan ? [] : items.map((item) => item.id));
        localStorage.setItem("rathi-cart", JSON.stringify(readCartItems().filter((item) => !purchasedIds.has(item.id))));
      } catch { /* Enrollment is verified even if local cart cleanup is unavailable. */ }
    } catch {
      setPayError("We could not confirm the payment yet. Retry verification before making another payment.");
    } finally { payLock.current = false; setPaying(false); }
  };
  const handlePay = async () => {
    if (payLock.current || !items.length || promoChecking) return;
    if (accountMismatch) { setPayError("Sign in with the account matching your checkout email before paying."); return; }
    payLock.current = true; setPaying(true); setPayError("");
    if (verification) { await verify(verification.response, verification.order); return; }
    try {
      let order = preparedOrder;
      if (!order) {
        const { data } = await api.post("/payments/create-order", {
          accountEmail: form.email,
          ...(plan ? { planId: plan.id, billing } : { courseIds: checkoutCourseIds(items) }), ...(promoInfo?.promoCode ? { promoCode: promoInfo.promoCode } : {}),
        });
        order = data;
        setPreparedOrder(data);
        // Show any authoritative price change before the learner opens payment.
        if (Math.abs(data.order.amount / 100 - price.total) > .01) {
          setPayError("Your order total has been updated. Review the amount, then continue with Razorpay.");
          payLock.current = false; setPaying(false); return;
        }
      }
      // Recheck before opening even a previously prepared order (another tab may have switched accounts).
      const { data: currentAccount } = await api.get("/auth/me");
      if (currentAccount.user?.email?.toLowerCase() !== user?.email?.toLowerCase()) {
        setPreparedOrder(null);
        throw new Error("Your signed-in account changed. Reload checkout before paying.");
      }
      await loadRazorpay();
      const gateway = new window.Razorpay({
        key: order.keyId, amount: order.order.amount, currency: order.order.currency, order_id: order.order.id,
        name: "Rathi Academy", description: plan ? `${plan.name} Plan - ${billing}` : `${checkoutCourseIds(items).length} courses`,
        prefill: { name: form.name, email: form.email, contact: form.phone }, theme: { color: "#0861ff" },
        handler: (response) => verify(response, order),
        modal: { ondismiss: () => { payLock.current = false; setPaying(false); } },
      });
      gateway.on("payment.failed", () => { setPayError("Payment was not completed. You can try again with Razorpay."); });
      gateway.open();
    } catch (error) {
      setPayError(error.response?.data?.message || error.message || "Could not open payment. Please try again.");
      payLock.current = false; setPaying(false);
    }
  };

  const backTo = plan ? `/plans/${plan.id}?billing=${billing}` : "/cart";
  const backLabel = plan ? "Back to plan" : "Back to cart";

  return <div className="co-page">
    <header className="co-header"><div className="co-container co-nav"><Link className="co-brand" to="/"><GraduationCap size={34} /><span>rathi<b>academy</b></span></Link><span className="co-nav-note"><LockKeyhole size={15} />Checkout</span><Link className="co-back-link" to={backTo}><ArrowLeft size={16} />{backLabel}</Link></div></header>
    <main className="co-container co-main">
      <div className="co-heading"><p className="co-eyebrow">YOUR NEXT CHAPTER STARTS HERE</p><h1 ref={headingRef} tabIndex={-1}>{step === 3 ? "You're ready to learn." : <>Complete Your <span>{plan ? `${plan.name} Plan` : "Enrollment"}</span></>}</h1><p>{step === 3 ? (plan ? "Your plan payment is verified." : "Your payment is verified. Your courses are waiting for you.") : "Just a few details, and you're one step closer to your next skill."}</p></div>
      <CheckoutStepper step={step} />
      {!items.length ? <section className="co-empty"><BookOpen size={40} /><h2>No courses to check out</h2><p>Add a course to your cart to continue.</p><Link className="co-primary" to="/courses">Explore Courses</Link></section> : <div className="co-layout">
        <section className="co-panel">
          {step !== 3 && <div className="co-info"><UserAccountNotice user={user} mismatch={accountMismatch} onSwitch={switchAccount} disabled={paying || Boolean(verification)} /></div>}
          {step === 1 && <BillingStep backTo={backTo} backLabel={backLabel} form={form} updateForm={(key, value) => { setForm((current) => ({ ...current, [key]: value })); setPayError(""); }} onNext={() => { if (accountMismatch) setPayError("The email entered belongs to a different account. Use Switch account to sign in as that learner."); else setStep(2); }} />}
          {step === 1 && payError && <p className="co-error" role="alert">{payError}</p>}
          {step === 2 && <PaymentStep form={form} total={price.total} onBack={() => setStep(1)} onPay={handlePay} paying={paying} promoChecking={promoChecking} payError={payError} verifying={Boolean(verification)} />}
          {step === 3 && receipt && <ConfirmationStep receipt={receipt} email={form.email} plan={plan} billing={billing} />}
        </section>
        <CheckoutSummary items={items} price={price} promo={promo} changePromo={changePromo} promoInfo={promoInfo} promoError={promoError} promoChecking={promoChecking} applyPromo={applyPromo} locked={paying || Boolean(verification)} confirmed={step === 3} />
      </div>}
    </main>
  </div>;
}
