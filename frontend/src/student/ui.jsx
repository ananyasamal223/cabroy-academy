import React from "react";

export const Card = ({ children, className = "" }) => (
  <div className={`min-w-0 rounded-[18px] border border-[#edf0f6] bg-white shadow-[0_5px_22px_rgba(16,24,40,.035)] ${className}`}>
    {children}
  </div>
);

export const PageHeader = ({ title, subtitle }) => (
  <div className="mb-5">
    <h1 className="text-[24px] font-bold tracking-[-0.5px] text-[#152238]">{title}</h1>
    {subtitle && <p className="mt-1 text-[12px] text-[#7b879c]">{subtitle}</p>}
  </div>
);

export const ProgressBar = ({ value }) => (
  <div className="h-2 w-full overflow-hidden rounded-full bg-[#e9edf5]">
    <div className="h-full rounded-full bg-[#2563eb]" style={{ width: `${value}%` }} />
  </div>
);
