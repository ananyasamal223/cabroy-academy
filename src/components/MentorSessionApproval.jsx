import { useState } from "react";
import api from "../api/client";

function istInput(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Date(date.getTime() + 330 * 60000).toISOString().slice(0, 16);
}

export default function MentorSessionApproval({ session, onUpdated }) {
  const [date, setDate] = useState(istInput(session.date));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  if (session.status === "cancelled" || new Date(session.date) < new Date()) return null;
  const save = async (status) => {
    setSaving(true);
    setError("");
    try {
      await api.patch(`/mentor-sessions/${session.id}`, {
        status,
        ...(status === "confirmed" ? { date: new Date(`${date}:00+05:30`).toISOString() } : {}),
      });
      await onUpdated();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update session. Choose a valid date and time.");
    } finally { setSaving(false); }
  };
  return <div className="mt-2 space-y-2 min-w-[200px]">
    <label className="block text-[10px] text-slate-600">Approved date and time (IST)
      <input aria-label={`Approved date and time for ${session.studentName}`} type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} disabled={saving} className="mt-1 block w-full rounded border border-slate-200 p-2 text-xs" />
    </label>
    <div className="flex gap-2">
      <button type="button" disabled={saving || !date} onClick={() => save("confirmed")} className="rounded bg-blue-600 px-3 py-2 text-xs text-white disabled:opacity-50">{saving ? "Saving..." : session.status === "confirmed" ? "Update approval" : "Approve"}</button>
      <button type="button" disabled={saving} onClick={() => save("cancelled")} className="rounded border border-red-200 px-3 py-2 text-xs text-red-600 disabled:opacity-50">Cancel session</button>
    </div>
    {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
  </div>;
}
