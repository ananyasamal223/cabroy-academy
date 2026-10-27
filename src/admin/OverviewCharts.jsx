import { useId, useState } from "react";
import "./OverviewCharts.css";

const money = value => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
const plans = [["starter", "Starter", "#91c4fb"], ["pro", "Pro", "#2877f1"], ["business", "Business", "#24479c"]];
const revenues = [["courseRevenue", "Course Revenue", "#c5defb"], ["subscriptionRevenue", "Subscription Revenue", "#78adf5"], ["totalRevenue", "Total Revenue", "#2468ee"]];
const month = row => row.label?.split(" ")[0] || "";
const value = (row, key) => Math.max(0, Number(row?.[key]) || 0);
const compact = n => n >= 1000000 ? `${+(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${+(n / 1000).toFixed(1)}K` : String(n);
function ceiling(max, integer = false) {
  if (!max) return integer ? 4 : 1000;
  const rough = max / 4;
  const power = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].find(n => n * power >= rough) * power;
  return (integer ? Math.max(1, Math.ceil(step)) : step) * 4;
}
function Legend({ items }) {
  return <div className="ov-reference-legend">{items.map(([key, label, color]) => <span key={key}><i style={{ background: color }} />{label}</span>)}</div>;
}
// Horizontal control points keep each interval within its real endpoint values.
function curve(points) {
  return points.map(([x, y], i) => {
    if (!i) return `M ${x} ${y}`;
    const [px, py] = points[i - 1];
    const middle = (px + x) / 2;
    return `C ${middle} ${py}, ${middle} ${y}, ${x} ${y}`;
  }).join(" ");
}

export function GrowthChart({ series }) {
  const [hovered, setHovered] = useState(null);
  const top = 14, bottom = 109, left = 38, width = 382;
  const max = ceiling(Math.max(0, ...series.map(row => plans.reduce((sum, [key]) => sum + value(row, key), 0))), true);
  const slot = width / Math.max(1, series.length);
  const barWidth = Math.min(31, slot * .47);
  return <div className="ov-growth-chart">
    <svg viewBox="0 0 438 145" className="ov-growth-svg" role="group" aria-label="Subscribers growth by month">
      {[0, 1, 2, 3, 4].map(i => <g key={i}><line x1={left} x2="429" y1={bottom - i * (bottom - top) / 4} y2={bottom - i * (bottom - top) / 4} className="ov-chart-grid" /><text x={left - 12} y={bottom - i * (bottom - top) / 4 + 3} textAnchor="end">{compact(max * i / 4)}</text></g>)}
      <line x1={left} x2={left} y1={top} y2={bottom} className="ov-chart-axis" />
      {series.map((row, index) => {
        const x = left + slot * (index + .5);
        let total = 0;
        return <g key={row.key} tabIndex={0} role="img" aria-label={`${row.label}: ${plans.map(([key, label]) => `${label} ${value(row, key)}`).join(", ")}`} onMouseEnter={() => setHovered(index)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(index)} onBlur={() => setHovered(null)}>
          <rect x={x - slot / 2} y={top} width={slot} height={bottom - top} fill={hovered === index ? "#f2f6fd" : "transparent"} />
          {plans.map(([key, label, color]) => {
            const height = value(row, key) / max * (bottom - top);
            total += height;
            return <rect key={key} x={x - barWidth / 2} y={bottom - total} width={barWidth} height={height} fill={color}><title>{row.label} · {label}: {value(row, key)}</title></rect>;
          })}
          <text x={x} y="130" textAnchor="middle">{month(row)}</text>
        </g>;
      })}
    </svg>
    <Legend items={plans} />
    {hovered !== null && series[hovered] && <div className="ov-growth-tooltip" role="status"><strong>{series[hovered].label}</strong>{plans.map(([key, label]) => <span key={key}>{label}: {value(series[hovered], key)}</span>)}</div>}
  </div>;
}

export function RevenueChart({ series, metric }) {
  const id = useId().replace(/:/g, "");
  const [hovered, setHovered] = useState(null);
  const top = 31, bottom = 172, left = 43, width = 526;
  const items = metric === "totalRevenue" ? revenues : revenues.filter(([key]) => key === metric);
  const max = ceiling(Math.max(0, ...series.map(row => value(row, metric))));
  const xAt = index => left + index * width / Math.max(1, series.length - 1);
  const yAt = (row, key) => bottom - value(row, key) / max * (bottom - top);
  const active = Math.min(hovered ?? series.length - 1, series.length - 1);
  const row = series[active];
  const tooltipX = Math.max(left, Math.min(484, xAt(active) - 45));
  const tooltipY = row ? Math.max(5, yAt(row, metric) - 62) : 5;
  return <div className="ov-revenue-chart">
    <svg className="ov-reference-revenue" viewBox="0 0 590 211" role="group" aria-label="Monthly revenue in rupees" onMouseLeave={() => setHovered(null)}>
      <defs>{revenues.map(([key, , color]) => <linearGradient key={key} id={`${id}-${key}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={color} stopOpacity={key === "totalRevenue" ? ".8" : ".95"} /><stop offset="1" stopColor={color} stopOpacity={key === "totalRevenue" ? ".22" : ".65"} /></linearGradient>)}</defs>
      {[0, 1, 2, 3, 4].map(i => <g key={i}><line x1={left} x2="570" y1={bottom - i * (bottom - top) / 4} y2={bottom - i * (bottom - top) / 4} className="ov-chart-grid" /><text x={left - 10} y={bottom - i * (bottom - top) / 4 + 4} textAnchor="end">{compact(max * i / 4)}</text></g>)}
      <line x1={left} x2={left} y1={top} y2={bottom} className="ov-chart-axis" />
      {[...items].reverse().map(([key]) => {
        const points = series.map((r, i) => [xAt(i), yAt(r, key)]);
        if (!points.length) return null;
        const line = curve(points);
        return <g key={key}><path d={`${line} L ${xAt(series.length - 1)} ${bottom} L ${left} ${bottom} Z`} fill={`url(#${id}-${key})`} /><path d={line} fill="none" stroke={key === metric ? "#2468ee" : "transparent"} strokeWidth="2.3" /></g>;
      })}
      {series.map((r, index) => <g key={r.key} tabIndex={0} role="img" aria-label={`${r.label}: ${items.map(([key, label]) => `${label} ${money(value(r, key))}`).join(", ")}`} onFocus={() => setHovered(index)} onBlur={() => setHovered(null)} onMouseEnter={() => setHovered(index)}>
        <rect x={Math.max(left, xAt(index) - width / Math.max(1, series.length - 1) / 2)} y={top} width={Math.min(width / Math.max(1, series.length - 1), 570 - Math.max(left, xAt(index) - width / Math.max(1, series.length - 1) / 2))} height={bottom - top} fill="transparent" />
        <text x={xAt(index)} y="192" textAnchor="middle">{month(r)}</text>
      </g>)}
      {row && <g className="ov-chart-callout" pointerEvents="none"><line x1={xAt(active)} x2={xAt(active)} y1={yAt(row, metric)} y2={bottom} stroke="#5d9cf6" strokeOpacity=".25" /><circle cx={xAt(active)} cy={yAt(row, metric)} r="5" fill="#2468ee" stroke="white" strokeWidth="2" /><rect x={tooltipX} y={tooltipY} width="94" height="48" rx="8" fill="white" stroke="#e8edf6" /><text x={tooltipX + 12} y={tooltipY + 17} className="ov-callout-month">{row.label}</text><text x={tooltipX + 12} y={tooltipY + 36} className="ov-callout-amount">{money(value(row, metric))}</text></g>}
    </svg>
    <Legend items={items} />
  </div>;
}
