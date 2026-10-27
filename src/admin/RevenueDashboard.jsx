import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  GraduationCap,
  IndianRupee,
  Megaphone,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import api from "../api/client";

function formatINR(amount) {
  return `₹${Math.round(Number(amount || 0)).toLocaleString("en-IN")}`;
}

function formatDateTime(dateString) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function shortDate(dateKey) {
  const d = new Date(`${dateKey}T00:00:00`);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fillDailyRevenue(rows = [], days = 30) {
  const map = new Map(rows.map((row) => [row.date, Number(row.amount || 0)]));
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  return Array.from({ length: days }, (_, index) => {
    const d = new Date(end);
    d.setDate(end.getDate() - (days - 1 - index));
    const key = dateKey(d);
    return { date: key, amount: map.get(key) || 0 };
  });
}

function buildChart(dailyRevenue) {
  if (!dailyRevenue.length) return null;
  const max = Math.max(...dailyRevenue.map((d) => Number(d.amount || 0)), 1);
  const stepX = dailyRevenue.length > 1 ? 900 / (dailyRevenue.length - 1) : 0;
  const points = dailyRevenue.map((d, i) => {
    const x = dailyRevenue.length > 1 ? i * stepX : 450;
    const y = 205 - (Number(d.amount || 0) / max) * 180;
    return { x, y, amount: Number(d.amount || 0), date: d.date };
  });
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x} 215 L0 215 Z`;
  return { points, linePath, areaPath, max };
}

const COURSE_ICONS = [GraduationCap, BarChart3, Megaphone];
const COURSE_TONES = [
  "bg-[#edf4ff] text-[#2563eb]",
  "bg-[#eafaf4] text-[#12a36d]",
  "bg-[#f2edff] text-[#7c3aed]",
];

export default function RevenueDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [range, setRange] = useState("30");
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const { data: response } = await api.get("/admin/revenue");
        if (!cancelled) setData(response);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const chartDays = Number(range) || 30;
  const dailyRevenue = useMemo(
    () => fillDailyRevenue(data?.dailyRevenue || [], Math.min(chartDays, 30)),
    [data, chartDays]
  );
  const chart = useMemo(() => buildChart(dailyRevenue), [dailyRevenue]);
  const hasRevenue = dailyRevenue.some((item) => Number(item.amount || 0) > 0);

  const labelCount = Math.min(8, dailyRevenue.length);
  const xLabels = useMemo(() => {
    if (!dailyRevenue.length) return [];
    const step = (dailyRevenue.length - 1) / Math.max(1, labelCount - 1);
    return Array.from({ length: labelCount }, (_, i) => dailyRevenue[Math.round(i * step)]);
  }, [dailyRevenue, labelCount]);

  const topStats = [
    {
      title: "Total Revenue",
      value: formatINR(data?.totalRevenue),
      icon: IndianRupee,
      tone: "bg-[#e7f4ff] text-[#1683dc]",
      spark: "blue",
      change: Number(data?.revenueGrowthPercent ?? data?.growthPercent ?? 0),
    },
    {
      title: "Total Orders",
      value: Number(data?.totalOrders || 0).toLocaleString("en-IN"),
      icon: ShoppingCart,
      tone: "bg-[#e9fbf3] text-[#16b579]",
      spark: "green",
      change: Number(data?.ordersGrowthPercent ?? 0),
    },
    {
      title: "Students Paid",
      value: Number(data?.totalStudentsPaid || 0).toLocaleString("en-IN"),
      icon: Users,
      tone: "bg-[#f1ecff] text-[#7c4fe9]",
      spark: "violet",
      change: Number(data?.studentsGrowthPercent ?? 0),
    },
    {
      title: "Average Order Value",
      value: formatINR(data?.averageOrderValue),
      icon: BarChart3,
      tone: "bg-[#fff3df] text-[#ed8d18]",
      spark: "sky",
      change: Number(data?.aovGrowthPercent ?? 0),
    },
  ];

  const transactions = data?.recentTransactions || [];
  const visibleTransactions = showAllTransactions ? transactions : transactions.slice(0, 4);

  return (
    <div className="revenue-dashboard-page w-full min-w-0 pb-8">
      <style>{`
        .revenue-top-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }
        .revenue-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 330px;
          gap: 20px;
          align-items: start;
        }
        .revenue-main-left { min-width: 0; }
        .revenue-main-aside { min-width: 0; }
        @media (max-width: 1080px) {
          .revenue-main-grid { grid-template-columns: minmax(0, 1fr) 300px; gap: 16px; }
        }
        @media (max-width: 900px) {
          .revenue-top-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .revenue-main-grid { grid-template-columns: minmax(0, 1fr); }
          .revenue-main-aside { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        }
        @media (max-width: 640px) {
          .revenue-top-stats { grid-template-columns: minmax(0, 1fr); }
          .revenue-main-aside { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
      <div className="mb-[18px] flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="pt-0.5">
          <h1 className="text-[30px] font-bold leading-none tracking-[-0.65px] text-[#111827]">Revenue</h1>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-[#8b95a7]">
            <span className="text-[#9aa4b5]">⌂</span>
            <span>Dashboard</span>
            <span className="text-[#b4bcc9]">›</span>
            <span className="font-semibold text-[#344054]">Revenue</span>
          </div>
        </div>

        <div className="flex min-h-[72px] w-full max-w-[380px] items-center gap-4 rounded-[17px] bg-[#edf7ff] px-5 py-3.5">
          <div className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[14px] bg-[#dff1ff] text-[#1784dd] shadow-[0_4px_12px_rgba(23,132,221,.08)]">
            <TrendingUp size={25} strokeWidth={2} />
          </div>
          <div>
            <p className="text-[11px] font-bold leading-4 text-[#264574]">Track your business growth</p>
            <p className="mt-0.5 text-[9.5px] leading-4 text-[#64748b]">Insights, students and revenue at a glance.</p>
          </div>
        </div>
      </div>

      <section className="revenue-top-stats mb-[18px]">
        {topStats.map((stat) => {
          const Icon = stat.icon;
          const positive = stat.change >= 0;
          return (
            <article
              key={stat.title}
              className="min-h-[136px] rounded-[17px] border border-[#e7ebf2] bg-white px-[18px] py-[17px] shadow-[0_5px_20px_rgba(15,23,42,.035)]"
            >
              <div className="flex items-start gap-[14px]">
                <div className={`grid h-[54px] w-[54px] shrink-0 place-items-center rounded-[14px] ${stat.tone}`}>
                  <Icon size={25} strokeWidth={2.1} />
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="truncate text-[10.5px] font-medium leading-4 text-[#667085]">{stat.title}</p>
                  <p className="mt-[7px] text-[25px] font-bold leading-none tracking-[-0.4px] text-[#172033]">{loading ? "…" : stat.value}</p>
                  <div className="mt-[12px] flex items-center gap-1.5 whitespace-nowrap text-[9px]">
                    <span className={`font-bold ${positive ? "text-[#17b26a]" : "text-[#ef4444]"}`}>
                      {positive ? "↑" : "↓"} {positive ? "+" : ""}{stat.change}%
                    </span>
                    <span className="text-[#98a2b3]">from last month</span>
                  </div>
                </div>

                <div className="mt-[24px] shrink-0">
                  <Sparkline tone={stat.spark} />
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <div className="revenue-main-grid min-w-0">
        <div className="revenue-main-left min-w-0 space-y-5">
          <section className="rounded-[20px] border border-[#e6eaf1] bg-white p-5 shadow-[0_5px_22px_rgba(15,23,42,.035)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-[17px] font-bold text-[#172033]">Revenue Overview</h2>
                <p className="mt-1 text-[10px] text-[#98a2b3]">Successful payment revenue by day</p>
              </div>
              <div className="relative">
                <CalendarDays size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#536078]" />
                <select value={range} onChange={(e) => setRange(e.target.value)} className="h-10 appearance-none rounded-[10px] border border-[#dfe5ee] bg-white pl-9 pr-9 text-[10px] font-semibold text-[#536078] outline-none focus:border-[#2563eb]">
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#667085]" />
              </div>
            </div>

            <div className="relative mt-4 h-[238px] w-full overflow-hidden">
              <div className="absolute inset-x-[54px] top-0 h-[212px]">
                {[0, 1, 2, 3, 4].map((item) => <div key={item} className="absolute left-0 right-0 border-t border-[#edf0f5]" style={{ top: `${item * 25}%` }} />)}
              </div>
              <div className="absolute left-0 top-0 flex h-[212px] w-[50px] flex-col justify-between text-right text-[8px] text-[#778195]">
                <span>{formatINR(chart?.max || 0)}</span>
                <span>{formatINR((chart?.max || 0) * 0.75)}</span>
                <span>{formatINR((chart?.max || 0) * 0.5)}</span>
                <span>{formatINR((chart?.max || 0) * 0.25)}</span>
                <span>₹0</span>
              </div>

              {chart && (
                <div className="absolute bottom-[30px] left-[58px] right-3 h-[190px]">
                  <svg viewBox="0 0 900 215" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                    <defs>
                      <linearGradient id="revArea" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#2f91e9" stopOpacity="0.24" />
                        <stop offset="100%" stopColor="#2f91e9" stopOpacity="0.025" />
                      </linearGradient>
                    </defs>
                    <path d={chart.areaPath} fill="url(#revArea)" />
                    <path d={chart.linePath} fill="none" stroke="#2f91e9" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                    {chart.points.map((point, index) => (
                      <circle key={`${point.date}-${index}`} cx={point.x} cy={point.y} r="3.5" fill="#2f91e9" vectorEffect="non-scaling-stroke" />
                    ))}
                  </svg>
                </div>
              )}

              {!loading && !hasRevenue && <div className="absolute inset-x-[58px] top-[85px] text-center text-[10px] text-[#98a2b3]">No revenue in this period yet.</div>}

              <div className="absolute bottom-0 left-[58px] right-3 flex justify-between text-[8px] text-[#778195]">
                {xLabels.map((item, index) => <span key={`${item.date}-${index}`}>{shortDate(item.date)}</span>)}
              </div>
            </div>
          </section>

          <section className="grid overflow-hidden rounded-[18px] border border-[#e6eaf1] bg-white shadow-[0_5px_20px_rgba(15,23,42,.03)] sm:grid-cols-2 lg:grid-cols-4">
            <PeriodStat icon={CalendarDays} value={formatINR(data?.todayRevenue)} label="Today" />
            <PeriodStat icon={CalendarDays} value={formatINR(data?.weekRevenue)} label="This Week" blue />
            <PeriodStat icon={BarChart3} value={formatINR(data?.monthRevenue)} label="This Month" blue />
            <PeriodStat icon={TrendingUp} value={formatINR(data?.yearRevenue)} label="This Year" orange />
          </section>

          <section className="overflow-hidden rounded-[20px] border border-[#e6eaf1] bg-white shadow-[0_5px_22px_rgba(15,23,42,.035)]">
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-[17px] font-bold text-[#172033]">Recent Transactions</h2>
              {transactions.length > 4 && (
                <button type="button" onClick={() => setShowAllTransactions((v) => !v)} className="text-[10px] font-semibold text-[#2585d9] hover:text-[#1d4ed8]">
                  {showAllTransactions ? "Show Less" : "View All"}
                </button>
              )}
            </div>
            <div className="overflow-x-auto px-4 pb-4">
              <table className="w-full min-w-[840px] border-collapse">
                <thead>
                  <tr className="rounded-lg bg-[#f8fafc] text-left text-[8px] font-semibold text-[#667085]">
                    <th className="px-2 py-3">Transaction ID</th><th className="px-2 py-3">Student</th><th className="px-2 py-3">Course</th><th className="px-2 py-3">Amount</th><th className="px-2 py-3">Payment Method</th><th className="px-2 py-3">Date</th><th className="px-2 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && visibleTransactions.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-[10px] text-[#98a2b3]">No transactions yet.</td></tr>}
                  {visibleTransactions.map((item) => (
                    <tr key={item.id} className="border-b border-[#edf0f5] text-[9px] text-[#536078] last:border-0">
                      <td className="px-2 py-3 font-medium">{String(item.id).slice(-8).toUpperCase()}</td>
                      <td className="px-2 py-3"><div className="flex items-center gap-2"><Initials name={item.name} /><span className="font-medium text-[#475467]">{item.name}</span></div></td>
                      <td className="max-w-[210px] px-2 py-3"><span className="line-clamp-2">{item.course}</span></td>
                      <td className="px-2 py-3 font-semibold text-[#344054]">{formatINR(item.amount)}</td>
                      <td className="px-2 py-3">{paymentLabel(item.method)}</td>
                      <td className="px-2 py-3">{formatDateTime(item.date)}</td>
                      <td className="px-2 py-3"><Status status={item.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="revenue-main-aside min-w-0 space-y-5">
          <section className="rounded-[20px] border border-[#e6eaf1] bg-white p-5 shadow-[0_5px_22px_rgba(15,23,42,.035)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[16px] font-bold text-[#172033]">Top Selling Courses</h2>
              <button type="button" onClick={() => navigate("/admin/course-insights")} className="text-[10px] font-semibold text-[#2585d9] hover:text-[#1d4ed8]">View All</button>
            </div>
            <div className="mt-4 divide-y divide-[#edf0f5]">
              {!loading && !(data?.topSellingCourses || []).length && <p className="py-6 text-center text-[10px] text-[#98a2b3]">No paid enrollments yet.</p>}
              {(data?.topSellingCourses || []).slice(0, 3).map((course, index) => {
                const Icon = COURSE_ICONS[index % COURSE_ICONS.length];
                return (
                  <button key={course.id || course.title} type="button" onClick={() => navigate(`/admin/course-insights${course.id ? `?courseId=${course.id}` : ""}`)} className="flex w-full items-center gap-3 py-3.5 text-left hover:bg-[#fbfcff]">
                    {course.thumbnail ? <img src={course.thumbnail} alt="" className="h-11 w-11 shrink-0 rounded-[12px] object-cover" /> : <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-[12px] ${COURSE_TONES[index % COURSE_TONES.length]}`}><Icon size={20} /></div>}
                    <div className="min-w-0 flex-1"><p className="truncate text-[10px] font-bold text-[#253047]">{course.title}</p><p className="mt-1 text-[9px] text-[#8a94a8]">{course.enrollments} Enrollment{course.enrollments === 1 ? "" : "s"}</p></div>
                    <p className="shrink-0 text-[11px] font-bold text-[#172033]">{formatINR(course.revenue)}</p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[20px] border border-[#e6eaf1] bg-white p-5 shadow-[0_5px_22px_rgba(15,23,42,.035)]">
            <h2 className="text-[16px] font-bold text-[#172033]">Revenue Summary</h2>
            <div className="mt-4 divide-y divide-[#edf0f5]">
              <SummaryRow icon={IndianRupee} label="Average Order Value" value={formatINR(data?.averageOrderValue)} tone="bg-[#e8f4ff] text-[#1580dc]" />
              <SummaryRow icon={ShoppingCart} label="Total Orders" value={Number(data?.totalOrders || 0).toLocaleString("en-IN")} tone="bg-[#e9fbf3] text-[#13a86f]" />
              <SummaryRow icon={Users} label="Total Students Paid" value={Number(data?.totalStudentsPaid || 0).toLocaleString("en-IN")} tone="bg-[#edf4ff] text-[#2563eb]" />
              <SummaryRow icon={BarChart3} label="Conversion Rate" value={`${Number(data?.conversionRate || 0)}%`} tone="bg-[#edf4ff] text-[#2563eb]" />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Sparkline({ tone }) {
  const stroke = {
    blue: "#55aaf0",
    green: "#6ad7ad",
    violet: "#9a7cf4",
    sky: "#67b8ee",
  }[tone] || "#55aaf0";
  return (
    <svg viewBox="0 0 60 31" className="h-[31px] w-[60px] shrink-0" aria-hidden="true">
      <path
        d="M2 25 C9 26 12 21 18 21 C24 21 27 17 33 18 C40 19 43 12 48 13 C53 13 56 7 58 4"
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PeriodStat({ icon: Icon, value, label, blue, orange }) {
  const tone = orange ? "bg-[#fff4df] text-[#e38a14]" : blue ? "bg-[#e8f4ff] text-[#2585d9]" : "bg-[#f4f7fb] text-[#64748b]";
  return (
    <div className="flex items-center gap-3 border-b border-[#edf0f5] px-5 py-5 last:border-0 sm:border-r sm:last:border-r-0 xl:border-b-0">
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-[11px] ${tone}`}><Icon size={18} /></div>
      <div><p className={`text-[16px] font-bold ${blue ? "text-[#2585d9]" : "text-[#172033]"}`}>{value}</p><p className="mt-1 text-[9px] text-[#778195]">{label}</p></div>
    </div>
  );
}

function Initials({ name }) {
  const initials = String(name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#e8f4ff] text-[8px] font-bold text-[#2585d9]">{initials}</div>;
}

function Status({ status }) {
  const completed = String(status).toLowerCase() === "completed";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[8px] font-semibold ${completed ? "bg-[#e9f9f0] text-[#159a67]" : "bg-[#fff0f1] text-[#dc2626]"}`}>{status}</span>;
}

function paymentLabel(type) {
  const labels = { upi: "UPI", card: "Card", netbanking: "Net Banking", wallet: "Wallet", emi: "EMI", unknown: "Unknown" };
  return labels[String(type || "unknown").toLowerCase()] || type || "Unknown";
}

function SummaryRow({ icon: Icon, label, value, tone }) {
  return (
    <div className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] ${tone}`}><Icon size={16} /></div>
      <p className="min-w-0 flex-1 text-[9px] font-medium text-[#667085]">{label}</p>
      <p className="shrink-0 text-[11px] font-bold text-[#172033]">{value}</p>
    </div>
  );
}
