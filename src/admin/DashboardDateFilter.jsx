import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import "./DashboardDateFilter.css";

const format = value => new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

export default function DashboardDateFilter({ range, onChange }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(range);
  const root = useRef(null);
  const trigger = useRef(null);
  const panelId = useId();
  const close = () => { setOpen(false); trigger.current?.focus(); };
  useEffect(() => {
    if (!open) return;
    const outside = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    const escape = event => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  const label = range.from && range.to ? `${format(range.from)} - ${format(range.to)}` : range.from ? `From ${format(range.from)}` : range.to ? `Until ${format(range.to)}` : "All time";
  const apply = value => { onChange(value); close(); };
  const preset = days => {
    const end = new Date();
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - days + 1);
    apply({ from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) });
  };
  return <div className="ov-date-filter" ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button ref={trigger} type="button" className="ov-date-trigger" aria-expanded={open} aria-controls={panelId} aria-label={`Date range: ${label}`} onClick={() => { setDraft(range); setOpen(!open); }}>
      <CalendarDays size={17} aria-hidden="true" /><span>{label}</span><ChevronDown size={14} className={open ? "is-open" : ""} aria-hidden="true" />
    </button>
    {open && <div id={panelId} className="ov-date-popover" role="group" aria-label="Filter dashboard by date">
      <h3>Date range</h3>
      <div className="ov-date-presets"><button type="button" onClick={() => preset(7)}>Last 7 days</button><button type="button" onClick={() => preset(30)}>Last 30 days</button><button type="button" onClick={() => apply({ from: "", to: "" })}>All time</button></div>
      <form onSubmit={event => { event.preventDefault(); apply(draft); }}>
        <div className="ov-date-fields"><label>Start date<input type="date" value={draft.from} max={draft.to || undefined} onChange={event => setDraft({ ...draft, from: event.target.value })} /></label><label>End date<input type="date" value={draft.to} min={draft.from || undefined} onChange={event => setDraft({ ...draft, to: event.target.value })} /></label></div>
        <div className="ov-date-actions"><button type="button" onClick={close}>Cancel</button><button type="submit" className="ov-date-apply" disabled={Boolean(draft.from && draft.to && draft.from > draft.to)}>Apply range</button></div>
      </form>
    </div>}
  </div>;
}
