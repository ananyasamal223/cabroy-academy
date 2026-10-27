import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
const links = [["Home", "/"], ["Courses", "/courses"], ["Community", "/community"], ["About Us", "/about"], ["FAQs", "/#faq"]];
export default function Navbar() {
 const [open, setOpen] = useState(false);
 const toggle = useRef(null);
 useEffect(() => {
  const escape = event => { if (event.key === "Escape" && open) { setOpen(false); toggle.current?.focus(); } };
  document.addEventListener("keydown", escape);
  return () => document.removeEventListener("keydown", escape);
 }, [open]);
 return <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
  <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
   <Link to="/" className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">rathi<span className="text-blue-600">academy</span></Link>
   <nav aria-label="Main navigation" className="hidden items-center gap-6 text-sm font-semibold lg:flex">{links.map(([label, path]) => <Link key={path} to={path} className="hover:text-blue-600">{label}</Link>)}</nav>
   <div className="ml-auto flex items-center gap-2 sm:gap-4">
    <Link to="/login" className="hidden min-h-11 items-center text-sm font-medium hover:text-blue-600 sm:inline-flex">Log in</Link>
    <Link to="/signup" className="inline-flex min-h-11 items-center rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white hover:bg-blue-700 sm:px-5 sm:text-sm">Sign up</Link>
    <button ref={toggle} type="button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="public-mobile-navigation" onClick={() => setOpen(value => !value)} className="grid h-11 w-11 place-items-center rounded-lg border border-slate-200 lg:hidden">{open ? <X size={20} /> : <Menu size={20} />}</button>
   </div>
   {open && <nav id="public-mobile-navigation" aria-label="Mobile navigation" className="grid w-full gap-1 border-t border-slate-100 pt-3 lg:hidden">{[...links, ["Log in", "/login"]].map(([label,path]) => <Link key={path} to={path} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-sm font-semibold hover:bg-blue-50">{label}</Link>)}</nav>}
  </div>
 </header>;
}
