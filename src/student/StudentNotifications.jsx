import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, RefreshCw, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

export default function StudentNotifications() {
 const navigate = useNavigate();
 const [open, setOpen] = useState(false);
 const [data, setData] = useState({ notifications: [], unreadCount: 0 });
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");
 const [busy, setBusy] = useState(false);
 const wrapper = useRef(null);
 const button = useRef(null);
 const alive = useRef(false);
 const fetching = useRef(false);
 const load = useCallback(async () => {
  if (fetching.current) return;
  fetching.current = true;
  try {
   const result = await api.get("/users/me/notifications");
   if (alive.current) { setData(result.data); setError(""); }
  } catch (err) { if (alive.current) setError(err.response?.data?.message || "Could not load notifications."); }
  finally { fetching.current = false; if (alive.current) setLoading(false); }
 }, []);
 useEffect(() => {
  alive.current = true;
  const initial = setTimeout(load, 0);
  const interval = setInterval(() => { if (!document.hidden) load(); }, 30000);
  const focus = () => load();
  const outside = event => { if (!wrapper.current?.contains(event.target)) setOpen(false); };
  const escape = event => { if (event.key === "Escape" && wrapper.current?.querySelector("#student-notification-panel")) { setOpen(false); button.current?.focus(); } };
  window.addEventListener("focus", focus);
  document.addEventListener("mousedown", outside);
  document.addEventListener("keydown", escape);
  return () => { alive.current = false; clearTimeout(initial); clearInterval(interval); window.removeEventListener("focus", focus); document.removeEventListener("mousedown", outside); document.removeEventListener("keydown", escape); };
 }, [load]);
 const markRead = async (notification) => {
  if (busy) return;
  setBusy(true);
  try {
   await api.patch("/users/me/notifications/read", notification ? { ids: [notification.id] } : { all: true });
   if (!alive.current) return;
   if (notification) { setOpen(false); navigate(notification.link); }
   await load();
  } catch (err) { if (alive.current) setError(err.response?.data?.message || "Could not mark notifications as read."); }
  finally { if (alive.current) setBusy(false); }
 };
 return <div ref={wrapper} className="relative">
  <button ref={button} type="button" aria-label={error ? "Notifications unavailable" : `Notifications, ${data.unreadCount} unread`} aria-expanded={open} aria-controls="student-notification-panel" onClick={() => { setOpen(value => !value); load(); }} className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-600 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-500">
   <Bell size={21} />
   {error ? <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-500" /> : data.unreadCount > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1 text-center text-[10px] font-bold leading-5 text-white">{data.unreadCount > 99 ? "99+" : data.unreadCount}</span>}
  </button>
  {open && <section id="student-notification-panel" aria-label="Student notifications" className="absolute right-0 top-14 z-50 w-[min(380px,calc(100vw-110px))] max-h-[calc(100dvh-100px)] overflow-y-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
   <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><h2 className="text-sm font-bold">Notifications</h2><button type="button" aria-label="Close notifications" onClick={() => { setOpen(false); button.current?.focus(); }}><X size={18} /></button></div>
   <div className="flex items-center justify-between px-4 py-2 text-xs text-slate-500"><span>{data.unreadCount} unread</span><button type="button" disabled={busy || !data.unreadCount || loading} onClick={() => markRead()} className="flex items-center gap-1 text-blue-600 disabled:opacity-40"><CheckCheck size={15} />Mark all read</button></div>
   {error && <div role="alert" className="mx-3 mb-2 rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}<button type="button" onClick={load} className="ml-2 inline-flex items-center gap-1 font-semibold"><RefreshCw size={12} />Retry</button></div>}
   <div className="max-h-[420px] overflow-y-auto">
    {loading ? <p role="status" className="p-6 text-sm text-slate-500">Loading notifications...</p> : !data.notifications.length && !error ? <p className="p-6 text-sm text-slate-500">No notifications yet.</p> : data.notifications.map(notification => <button key={notification.id} type="button" disabled={busy} onClick={() => markRead(notification)} className={`block w-full border-t border-slate-100 px-4 py-3 text-left hover:bg-blue-50 disabled:opacity-60 ${notification.read ? "bg-white" : "bg-blue-50/60"}`}>
     <div className="flex items-center gap-2"><span className="text-xs font-semibold text-slate-800">{notification.title}</span>{!notification.read && <span className="h-2 w-2 rounded-full bg-blue-500" aria-label="Unread" />}</div>
     <p className="mt-1 break-words text-xs leading-5 text-slate-600">{notification.message}</p><time dateTime={notification.createdAt} className="mt-1 block text-[10px] text-slate-400">{new Date(notification.createdAt).toLocaleString()}</time>
    </button>)}
   </div><p className="border-t border-slate-100 px-4 py-2 text-[10px] text-slate-400">Latest 50 alerts · Refreshes every 30 seconds</p>
  </section>}
 </div>;
}
