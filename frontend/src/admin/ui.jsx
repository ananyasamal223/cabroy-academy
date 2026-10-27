import React from "react";

export const Card = ({ children, className = "" }) => (
  <div className={`min-w-0 rounded-[18px] border border-[#edf0f6] bg-white shadow-[0_5px_22px_rgba(16,24,40,.035)] ${className}`}>
    {children}
  </div>
);

export const StatCard = ({ icon: Icon, label, value, change, bg, color, down = false }) => (
  <Card className="p-4">
    <div className={`grid h-10 w-10 place-items-center rounded-xl ${bg}`}>
      <Icon size={19} className={color} />
    </div>
    <div className="mt-4 text-[12px] font-medium text-[#596579]">{label}</div>
    <div className="mt-1 text-[22px] font-bold tracking-[-0.4px] text-[#162033]">{value}</div>
    {change && (
      <div className={`mt-2 text-[10px] font-semibold ${down ? "text-red-500" : "text-emerald-500"}`}>
        {down ? "↓" : "↑"} {change} <span className="font-normal text-[#98a2b3]">from last month</span>
      </div>
    )}
  </Card>
);

export const Pill = ({ children, tone = "green" }) => {
  const map = {
    green: "bg-[#e8faf2] text-[#16a66b]",
    red: "bg-[#fff0f1] text-[#ef4444]",
    orange: "bg-[#fff5df] text-[#e79a1b]",
    blue: "bg-[#eef3ff] text-[#2563eb]",
    purple: "bg-[#f3eeff] text-[#7c3aed]",
  };
  return <span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-medium ${map[tone]}`}>{children}</span>;
};

export const PageHeader = ({ title, crumb }) => (
  <div className="mb-5">
    <h1 className="text-[24px] font-bold tracking-[-0.5px] text-[#152238]">{title}</h1>
    <div className="mt-1 text-[11px] text-[#7b879c]">
      Dashboard <span className="mx-2">›</span> {crumb || title}
    </div>
  </div>
);

export const Donut = ({
  value,
  label,
  colors = "conic-gradient(#2563eb 0 78%, #7c3aed 78% 92%, #f59e0b 92% 100%)"
}) => (
  <div className="relative h-28 w-28 shrink-0 rounded-full" style={{ background: colors }}>
    <div className="absolute inset-[14px] grid place-items-center rounded-full bg-white text-center">
      <div>
        <div className="text-base font-bold text-[#172033]">{value}</div>
        <div className="text-[10px] text-[#94a3b8]">{label}</div>
      </div>
    </div>
  </div>
);

export const MiniLineChart = () => (
  <svg viewBox="0 0 600 220" className="h-[180px] w-full">
    <defs>
      <linearGradient id="fillChart" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#2563eb" stopOpacity=".18" />
        <stop offset="100%" stopColor="#2563eb" stopOpacity=".02" />
      </linearGradient>
    </defs>
    {[45, 90, 135, 180].map((y) => <line key={y} x1="35" y1={y} x2="580" y2={y} stroke="#eef2f7" strokeWidth="1" />)}
    <path d="M35 170 C70 145,90 145,120 130 S180 115,210 120 S270 80,320 90 S380 105,420 85 S480 70,530 72 S560 62,580 58 L580 200 L35 200 Z" fill="url(#fillChart)" />
    <path d="M35 170 C70 145,90 145,120 130 S180 115,210 120 S270 80,320 90 S380 105,420 85 S480 70,530 72 S560 62,580 58" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
    <circle cx="580" cy="58" r="5" fill="#fff" stroke="#2563eb" strokeWidth="3" />
  </svg>
);
