import { useEffect, useMemo, useState } from "react";
import { BadgeIndianRupee, Copy, Search, ShoppingBag, TicketPercent, Users } from "lucide-react";
import api from "../api/client";

const money = (n) => `₹${Math.round(Number(n || 0)).toLocaleString("en-IN")}`;
const date = (d) => d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

export default function PersonalSalesDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get("/admin/sales/me")
      .then(({ data }) => setData(data))
      .catch((e) => setError(e.response?.data?.message || "Could not load your sales dashboard."))
      .finally(() => setLoading(false));
  }, []);

  const purchases = useMemo(() => {
    const q = search.toLowerCase().trim();
    const rows = data?.recentPurchases || [];
    if (!q) return rows;
    return rows.filter((p) => [p.studentName, p.studentEmail, p.promoCode, ...(p.courses || [])].join(" ").toLowerCase().includes(q));
  }, [data, search]);

  if (loading) return <div className="p-8 text-sm text-slate-500">Loading your sales dashboard...</div>;
  if (error) return <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{error}</div>;

  const p = data?.salesPerson || {};
  const s = data?.stats || {};
  const cards = [
    ["My Revenue", money(s.revenue), BadgeIndianRupee, "bg-emerald-50 text-emerald-600"],
    ["Students Purchased", s.studentsPurchased || 0, Users, "bg-blue-50 text-blue-600"],
    ["Paid Orders", s.paidOrders || 0, ShoppingBag, "bg-amber-50 text-amber-600"],
    ["Courses Sold", s.coursesSold || 0, TicketPercent, "bg-violet-50 text-violet-600"],
  ];

  return (
    <div className="mx-auto max-w-[1450px] space-y-5">
      <section className="overflow-hidden rounded-[22px] border border-[#e6eaf1] bg-white shadow-sm">
        <div className="bg-gradient-to-r from-[#172554] to-[#2563eb] px-6 py-7 text-white md:flex md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-blue-100">Personal Sales Dashboard</p>
            <h1 className="mt-2 text-2xl font-bold">Welcome, {p.name}</h1>
            <p className="mt-1 text-sm text-blue-100">Only your own promo-code sales and students are shown here.</p>
          </div>
          <div className="mt-4 rounded-2xl bg-white/10 p-4 backdrop-blur md:mt-0 md:min-w-[270px]">
            <p className="text-[11px] uppercase tracking-wider text-blue-100">Your Promo Code</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <span className="text-xl font-black tracking-wider">{p.promoCode || "—"}</span>
              <button onClick={async () => { await navigator.clipboard.writeText(p.promoCode || ""); setCopied(true); setTimeout(() => setCopied(false), 1200); }} className="rounded-lg bg-white/15 p-2 hover:bg-white/20"><Copy size={16} /></button>
            </div>
            <p className="mt-2 text-xs text-blue-100">{p.discountPercent || 0}% discount · max {money(p.maxDiscount)}</p>
            {copied && <p className="mt-1 text-[10px] text-emerald-200">Promo code copied</p>}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, Icon, tone]) => <article key={label} className="rounded-[18px] border border-[#e6eaf1] bg-white p-5 shadow-sm"><div className={`grid h-11 w-11 place-items-center rounded-xl ${tone}`}><Icon size={20}/></div><p className="mt-4 text-xs text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold text-slate-900">{value}</p></article>)}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="rounded-[20px] border border-[#e6eaf1] bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
            <div><h2 className="text-lg font-bold text-slate-900">My Students & Sales</h2><p className="text-xs text-slate-500">Students who completed payment using your promo code.</p></div>
            <div className="relative w-full md:w-[300px]"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search student, course..." className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-blue-400"/></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Student</th><th className="px-5 py-3">Course</th><th className="px-5 py-3">Paid</th><th className="px-5 py-3">Discount</th><th className="px-5 py-3">Date</th></tr></thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {purchases.map((row) => <tr key={row.id} className="hover:bg-slate-50/60"><td className="px-5 py-4"><p className="font-semibold text-slate-800">{row.studentName}</p><p className="mt-1 text-[10px] text-slate-400">{row.studentEmail}</p></td><td className="px-5 py-4 text-slate-600">{(row.courses||[]).join(", ") || "Course"}</td><td className="px-5 py-4 font-semibold text-emerald-600">{money(row.amount)}</td><td className="px-5 py-4 text-slate-600">{money(row.discount)}</td><td className="px-5 py-4 text-slate-500">{date(row.date)}</td></tr>)}
                {!purchases.length && <tr><td colSpan="5" className="px-5 py-12 text-center text-sm text-slate-400">No paid sales found yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="rounded-[20px] border border-[#e6eaf1] bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">Top Courses</h2>
          <p className="mt-1 text-xs text-slate-500">Your best-selling courses by paid orders.</p>
          <div className="mt-5 space-y-3">
            {(data?.topCourses || []).map((course, index) => <div key={course.title} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3"><div className="flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700">{index + 1}</span><span className="text-xs font-semibold text-slate-700">{course.title}</span></div><span className="text-xs font-bold text-slate-900">{course.sales}</span></div>)}
            {!(data?.topCourses || []).length && <p className="py-8 text-center text-xs text-slate-400">No course sales yet.</p>}
          </div>
        </aside>
      </section>
    </div>
  );
}
