import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, GraduationCap, Layers3, ShoppingBag, ShoppingCart, Tag, Trash2 } from "lucide-react";
import { describeCartItem, getCartTotals, readCartItems } from "../utils/cart";
import "./Cart.css";

const money = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
function CartImage({ src, title }) {
  const [failed, setFailed] = useState(false);
  return !src || failed ? <BookOpen size={40} aria-hidden="true" /> : <img src={src} alt={title} onError={() => setFailed(true)} />;
}

export default function Cart() {
  const navigate = useNavigate();
  const [items, setItems] = useState(readCartItems);
  const [removed, setRemoved] = useState(null);
  const [error, setError] = useState("");
  const { total, savings, originalTotal, courseCount } = getCartTotals(items);
  useEffect(() => {
    const refresh = (event) => {
      if (event.key === "rathi-cart" || event.key === null) { setItems(readCartItems()); setRemoved(null); }
    };
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);
  const save = (next) => {
    try {
      localStorage.setItem("rathi-cart", JSON.stringify(next));
      setItems(next); setError(""); return true;
    } catch { setError("Your cart could not be updated. Please try again."); return false; }
  };
  const remove = (item) => {
    const current = readCartItems();
    const index = current.findIndex((entry) => entry.id === item.id);
    if (save(current.filter((entry) => entry.id !== item.id))) setRemoved({ item, index });
  };
  const undo = () => {
    if (!removed) return;
    const next = readCartItems();
    if (!next.some((item) => item.id === removed.item.id)) next.splice(Math.max(0, removed.index), 0, removed.item);
    if (save(next)) setRemoved(null);
  };
  return <div className="rc-page">
    <header className="rc-header"><div className="rc-container rc-nav">
      <Link className="rc-brand" to="/" aria-label="Rathi Academy home"><GraduationCap size={34} /><span>rathi<b>academy</b></span></Link>
      <nav aria-label="Cart navigation"><Link to="/courses">Explore Courses</Link><span className="rc-cart-indicator"><ShoppingCart size={18} />Your Cart <b>{items.length}</b></span></nav>
      <Link className="rc-continue" to="/courses"><ArrowLeft size={16} />Continue shopping</Link>
    </div></header>
    <main className="rc-container rc-main">
      <nav className="rc-breadcrumb" aria-label="Breadcrumb"><Link to="/courses">Courses</Link><ChevronRight size={14} /><span aria-current="page">Your cart</span></nav>
      <div className="rc-page-heading"><div><p className="rc-eyebrow">YOUR NEXT CHAPTER STARTS HERE</p><h1>Your Learning <span>Cart</span></h1><p>Great skills. New possibilities. Review your courses and take the next step.</p></div>
        <ol className="rc-steps" aria-label="Checkout progress"><li aria-current="step"><span>1</span>Cart</li><li><span>2</span>Checkout</li><li><span>3</span>Start learning</li></ol>
      </div>
      {error && <p className="rc-error" role="alert">{error}</p>}
      {removed && <div className="rc-notice" role="status"><Check size={17} /><span>{removed.item.title} removed from your cart.</span><button onClick={undo}>Undo</button></div>}
      <div className="rc-layout">
        <section className="rc-items" aria-labelledby="cart-items-title">
          <div className="rc-section-heading"><h2 id="cart-items-title">Selected courses <span>{items.length}</span></h2><span>{courseCount} {courseCount === 1 ? "course" : "courses"} in your learning plan</span></div>
          {items.length ? <div className="rc-item-list">{items.map((item) => {
            const detail = describeCartItem(item);
            return <article className={`rc-item ${detail.isBundle ? "rc-bundle" : ""}`} key={item.id}>
              <Link className={`rc-image ${detail.isBundle ? "rc-image-bundle" : ""}`} to={detail.href} aria-label={`View ${item.title}`}><CartImage src={detail.image} title={item.title} /></Link>
              <div className="rc-item-info"><div className="rc-item-kicker"><span>{detail.isBundle ? "COMBO PROGRAM" : detail.category}</span>{detail.savings > 0 && <span className="rc-save-badge">Save {money(detail.savings)}</span>}</div>
                <h3><Link to={detail.href}>{item.title}</Link></h3>
                <div className="rc-item-meta"><span><BookOpen size={14} />{detail.isBundle ? `${detail.courseCount} courses included` : detail.level}</span>{detail.modules > 0 && <span><Layers3 size={14} />{detail.modules} modules</span>}</div>
                <div className="rc-item-tags">{detail.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                <div className="rc-item-links"><Link to={detail.href}>{detail.isBundle ? "View your combo" : "View course details"}<ArrowRight size={14} /></Link><button onClick={() => remove(item)} aria-label={`Remove ${item.title} from cart`}><Trash2 size={14} />Remove</button></div>
              </div>
              <div className="rc-item-price"><strong>{money(Number(item.price))}</strong>{detail.savings > 0 && <del>{money(detail.originalPrice)}</del>}<small>One-time payment</small></div>
            </article>;
          })}</div> : <div className="rc-empty"><span><ShoppingBag size={38} /></span><h2>Your next skill is waiting</h2><p>Your cart is empty. Explore our courses and find the right learning path for you.</p><Link className="rc-primary" to="/courses">Explore Courses <ArrowRight size={18} /></Link></div>}
          <Link className="rc-add-more" to="/courses"><span className="rc-add-more-icon"><BookOpen size={24} /></span><span><strong>Keep building your learning path</strong><small>Explore more courses and find your next skill.</small></span><ArrowRight size={20} /></Link>
        </section>
        <aside className="rc-summary" aria-labelledby="order-summary-title">
          <div className="rc-summary-heading"><span><ShoppingBag size={21} /></span><h2 id="order-summary-title">Order Summary</h2></div>
          <p className="rc-summary-description">Your next step towards something bigger.</p>
          <dl className="rc-totals"><div><dt>Subtotal <span>({items.length} {items.length === 1 ? "item" : "items"})</span></dt><dd>{money(originalTotal)}</dd></div>{savings > 0 && <div className="rc-discount"><dt>Bundle savings</dt><dd>−{money(savings)}</dd></div>}</dl>
          {savings > 0 && <div className="rc-savings"><Tag size={18} /><span>You’re saving <strong>{money(savings)}</strong> with your combo.</span></div>}
          <div className="rc-total" aria-live="polite"><span>Total amount<small>{courseCount} {courseCount === 1 ? "course" : "courses"} selected</small></span><strong>{money(total)}</strong></div>
          <button className="rc-primary rc-checkout" disabled={!items.length} onClick={() => navigate("/checkout/cart")}>Proceed to Checkout <ArrowRight size={18} /></button>
          <p className="rc-checkout-note">Review your payment details at checkout.</p>
          <div className="rc-promo"><span><Tag size={18} /></span><div><strong>Have a promo code?</strong><p>You can apply it at checkout.</p></div></div>
          <div className="rc-summary-footer"><BookOpen size={18} /><span>A learning path built around your goals.</span></div>
        </aside>
      </div>
    </main>
  </div>;
}
