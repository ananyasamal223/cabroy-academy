import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, CreditCard, FileText, LockKeyhole, Pencil, ShoppingBag, Tag, UserRound } from "lucide-react";
import { describeCartItem } from "../utils/cart";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

export function CheckoutStepper({ step }) {
  return <ol className="co-stepper" aria-label="Checkout progress">{[[UserRound, "Billing details", "Tell us about yourself"], [CreditCard, "Payment", "Continue with Razorpay"], [CheckCircle2, "Confirmation", "You're ready to learn"]].map(([Icon, title, description], index) => <li key={title} className={step === index + 1 ? "active" : step > index + 1 ? "complete" : ""} aria-current={step === index + 1 ? "step" : undefined}><span className="co-step-icon">{step > index + 1 ? <Check size={21} /> : <Icon size={21} />}</span><div><small>STEP {index + 1}</small><strong>{title}</strong><span>{description}</span></div></li>)}</ol>;
}

export function BillingStep({ form, updateForm, onNext, backTo = "/cart", backLabel = "Back to cart" }) {
  const fields = [
    { key: "name", label: "Full name", placeholder: "Enter your full name", autoComplete: "name", required: true },
    { key: "email", label: "Email address", placeholder: "you@example.com", type: "email", autoComplete: "email", required: true },
    { key: "phone", label: "Phone number", placeholder: "+91 98765 43210", type: "tel", autoComplete: "tel", required: true, pattern: "[+0-9 ()-]{7,20}", title: "Enter a valid phone number with 7 to 20 characters." },
    { key: "country", label: "Country", placeholder: "India", autoComplete: "country-name", required: true },
    { key: "address", label: "Billing address", placeholder: "House number, street and area", autoComplete: "street-address", wide: true },
    { key: "city", label: "City", placeholder: "Your city", autoComplete: "address-level2" },
    { key: "state", label: "State / region", placeholder: "Your state", autoComplete: "address-level1" },
    { key: "pin", label: "Postal code", placeholder: "Postal code", autoComplete: "postal-code", maxLength: 12 },
  ];
  return <form onSubmit={(event) => { event.preventDefault(); onNext(); }}>
    <div className="co-panel-title"><span><UserRound size={23} /></span><div><h2>Billing Information</h2><p>Your details will be used for this enrollment.</p></div></div>
    <p className="co-required-note">Fields marked <span>*</span> are required.</p>
    <div className="co-fields">{fields.map(({ key, label, wide, ...input }) => <label className={wide ? "co-field-wide" : ""} key={key}><span>{label}{input.required ? <b> *</b> : <small> (optional)</small>}</span><input {...input} type={input.type || "text"} name={key} value={form[key]} onChange={(event) => updateForm(key, event.target.value)} /></label>)}</div>
    <div className="co-info"><FileText size={21} /><div><strong>Keep your details handy</strong><p>You can review and edit them before opening Razorpay.</p></div></div>
    <div className="co-actions"><Link className="co-text-link" to={backTo}><ArrowLeft size={16} />{backLabel}</Link><button className="co-primary" type="submit">Continue to Payment <ArrowRight size={17} /></button></div>
  </form>;
}

export function PaymentStep({ form, total, onBack, onPay, paying, promoChecking, payError, verifying }) {
  return <>
    <div className="co-panel-title"><span><CreditCard size={23} /></span><div><h2>Payment</h2><p>Review your details and complete your enrollment.</p></div></div>
    <div className="co-billing-review"><div><h3>Billing details</h3><button disabled={paying || verifying} onClick={onBack}><Pencil size={14} />Edit</button></div><strong>{form.name}</strong><p>{form.email}</p><p>{form.phone}</p><p>{[form.address, form.city, form.state, form.pin, form.country].filter(Boolean).join(", ")}</p></div>
    <h3 className="co-small-heading">Payment provider</h3>
    <div className="co-razorpay" aria-label="Razorpay is the selected payment provider"><span className="co-razorpay-mark" aria-hidden="true">R</span><div><strong>Razorpay</strong><p>Complete your payment in Razorpay’s secure checkout.</p></div><span className="co-selected-check"><Check size={14} /></span></div>
    <div className="co-info"><LockKeyhole size={21} /><div><strong>Your payment is handled by Razorpay</strong><p>The Razorpay window will open when you continue. Payment details are entered there.</p></div></div>
    <div className="co-payment-total"><span>Amount to pay</span><strong>{money(total)}</strong></div>
    {payError && <p className="co-error" role="alert">{payError}</p>}
    <div className="co-actions"><button className="co-secondary" disabled={paying || verifying} onClick={onBack}><ArrowLeft size={16} />Back</button><button className="co-primary" onClick={onPay} disabled={paying || promoChecking}>{paying ? (verifying ? "Verifying payment…" : "Opening Razorpay…") : verifying ? "Retry Verification" : `Pay ${money(total)} with Razorpay`}<ArrowRight size={17} /></button></div>
    <p className="co-fine-print">Your enrollment is confirmed after payment verification.</p>
  </>;
}

export function ConfirmationStep({ receipt, email, plan, billing }) {
  return <div className="co-confirmation"><span className="co-success-icon"><Check size={36} /></span><p className="co-eyebrow">PAYMENT VERIFIED</p><h2>Welcome to your next chapter.</h2><p>{plan ? `Your ${billing} ${plan.name} Plan payment is confirmed and saved to your account.` : "Your payment is confirmed and your courses have been added to your account."}</p><dl className="co-receipt"><div><dt>Amount paid</dt><dd>{money(receipt.total)}</dd></div><div><dt>Payment provider</dt><dd>Razorpay</dd></div><div><dt>Payment ID</dt><dd>{receipt.id}</dd></div><div><dt>Email</dt><dd>{email}</dd></div><div><dt>Status</dt><dd className="co-success-text"><CheckCircle2 size={15} />Confirmed</dd></div></dl><Link className="co-primary" to={plan ? "/dashboard" : "/my-courses"}>{plan ? "Go to Dashboard" : "Start Learning"} <ArrowRight size={18} /></Link><Link className="co-text-link" to="/dashboard">Go to Dashboard</Link></div>;
}

function SummaryImage({ item }) {
  const [failed, setFailed] = useState(false);
  const image = describeCartItem(item).image;
  return <span className="co-summary-image">{image && !failed ? <img src={image} alt="" onError={() => setFailed(true)} /> : <BookOpen size={23} />}</span>;
}

export function CheckoutSummary({ items, price, promo, changePromo, promoInfo, promoError, promoChecking, applyPromo, locked, confirmed }) {
  const isPlan = items[0]?.type === "plan";
  return <aside className="co-summary">
    <div className="co-summary-title"><ShoppingBag size={21} /><h2>{isPlan ? "Your Plan" : confirmed ? "Your Courses" : "Order Summary"}</h2>{!isPlan && <span>{items.length}</span>}</div>
    <div className="co-summary-items">
      {items.map((item) => {
        const detail = describeCartItem(item);
        if (item.type === "plan") return (
          <section className="co-plan-card" key={item.id} aria-label={item.title}>
            <div className="co-plan-overview">
              <span className="co-plan-icon"><BookOpen size={24} aria-hidden="true" /></span>
              <div><h3>{item.title}</h3><span className="co-plan-period">{item.billing === "yearly" ? "Yearly membership" : "Monthly membership"}</span></div>
            </div>
            <div className="co-plan-price"><strong>{money(Number(item.price))}</strong><span>for {item.billing === "yearly" ? "12 months" : "1 month"}</span></div>
            <p className="co-plan-payment-note">One-time payment. No automatic renewal.</p>
            <div className="co-plan-inclusions">
              <h4>What's included</h4>
              <ul>{item.features.map(([feature]) => <li key={feature}><span className="co-plan-check"><Check size={12} strokeWidth={2.7} aria-hidden="true" /></span><span>{feature}</span></li>)}</ul>
            </div>
          </section>
        );
        return <div className="co-summary-item" key={item.id}><SummaryImage item={item} /><div><h3>{item.title}</h3><p>{detail.isBundle ? `${detail.courseCount} courses included` : detail.category}</p><strong>{money(Number(item.price))}</strong></div></div>;
      })}
    </div>
    {!confirmed && <form className="co-promo" onSubmit={applyPromo}><label htmlFor="checkout-promo">Have a promo code?</label><div><span><Tag size={16} /><input id="checkout-promo" value={promo} onChange={(event) => changePromo(event.target.value)} placeholder="Enter promo code" disabled={locked || promoChecking} /></span><button disabled={locked || promoChecking}>{promoChecking ? "Checking…" : "Apply"}</button></div>{promoInfo && <p className="co-promo-success" role="status"><Check size={14} />{promoInfo.promoCode} applied</p>}{promoError && <p className="co-error" role="alert">{promoError}</p>}</form>}
    <dl className="co-price-lines"><div><dt>Subtotal</dt><dd>{money(price.subtotal)}</dd></div>{price.discount > 0 && <div className="co-success-text"><dt>Promo discount</dt><dd>−{money(price.discount)}</dd></div>}</dl><div className="co-summary-total"><span>{confirmed ? "Amount paid" : "Total amount"}</span><strong>{money(price.total)}</strong></div><div className="co-summary-note"><LockKeyhole size={16} /><span>{confirmed ? "Payment verified successfully" : "Payment through Razorpay"}</span></div>
  </aside>;
}
