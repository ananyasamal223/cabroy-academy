import { useEffect, useId, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";
import { Stage } from "./CrmPages";
import { counselorName, crmEndpoint, errorMessage, followUpValue, formatDate, localDate } from "./crmUtils";

const leadsPath = "/admin/crm/leads";
const fieldDefinitions = [
  ["name", "Name", "text", 120], ["email", "Email", "email", 254], ["phone", "Phone", "tel", 50],
  ["city", "City", "text", 100], ["course", "Course", "text", 160], ["source", "Source", "text", 80],
  ["subject", "Subject", "text", 200],
];

function LeadFields({ lead, courses }) {
  const listId = useId();
  return <>
    {fieldDefinitions.map(([name, label, type, maxLength]) => (
      <label key={name}>{label}
        <input name={name} type={type} maxLength={maxLength} defaultValue={lead[name] || ""}
          required={name === "name"} list={name === "course" ? listId : undefined} />
      </label>
    ))}
    <datalist id={listId}>{courses.map((name) => <option key={name} value={name} />)}</datalist>
    <label>Inquiry details<textarea name="message" rows={4} maxLength={4000} defaultValue={lead.message || ""} /></label>
  </>;
}

export function NewLead({ data, save }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const lead = await save(Object.fromEntries(new FormData(event.currentTarget)));
      navigate(`${leadsPath}/${lead._id}`);
    } catch (err) { setError(errorMessage(err)); setSaving(false); }
  }
  return <>
    <Link className="crm-back" to={leadsPath}>Leads / Add lead</Link>
    <header className="crm-heading"><h1>Add lead</h1></header>
    <form className="crm-panel crm-box crm-form crm-create" onSubmit={submit}>
      <LeadFields courses={data.courses} lead={{ source: data.preferences.leadSource }} />
      {error && <p role="alert">{error}</p>}
      <div className="crm-actions"><button className="crm-primary" disabled={saving}>{saving ? "Saving…" : "Create lead"}</button>
        <Link className="crm-button" to={leadsPath}>Cancel</Link></div>
    </form>
  </>;
}

function Payments({ id }) {
  const [result, setResult] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    api.get(`${crmEndpoint}/${id}/payments`, { signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setResult(data); })
      .catch((err) => { if (!controller.signal.aborted) setResult({ error: errorMessage(err) }); });
    return () => controller.abort();
  }, [id]);
  if (!result) return <p role="status">Loading payments…</p>;
  if (result.error) return <p role="alert">{result.error}</p>;
  if (!result.payments.length) return <p>No completed payments found for this email.</p>;
  return <ul className="crm-activity">{result.payments.map((payment) => (
    <li key={payment._id}><strong>{new Intl.NumberFormat(undefined, { style: "currency", currency: payment.currency || "INR" }).format(payment.amount)}</strong>
      <p>{[...(payment.courses || []).map(({ title }) => title), payment.planName].filter(Boolean).join(", ") || "Course payment"}</p>
      <small>{formatDate(payment.paidAt || payment.createdAt)}</small>
    </li>
  ))}</ul>;
}

const activityTitles = { note: "Note added", call: "Call logged", stage: "Stage changed", assignment: "Counselor changed", "follow-up": "Follow-up", demo: "Demo booked" };

function Activity({ lead, notesOnly }) {
  const history = [
    ...(lead.crmActivity || []),
    ...(lead.crmNotes || []).map((note) => ({ ...note, kind: "note" })),
    { _id: "capture", kind: "capture", text: lead.subject || `Source: ${lead.source}`, createdAt: lead.createdAt },
  ].filter(({ kind }) => !notesOnly || kind === "note").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (!history.length) return <p>No notes yet.</p>;
  return <ul className="crm-activity">{history.map((entry) => {
    const timestamp = /\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.exec(entry.text)?.[0];
    const text = timestamp && ["follow-up", "demo"].includes(entry.kind)
      ? entry.text.replace(timestamp, formatDate(timestamp)) : entry.text;
    return <li key={entry._id}><strong>{activityTitles[entry.kind] || "Lead captured"}</strong>
      <p className="crm-message">{text}</p>
      <small>{[entry.author, formatDate(entry.createdAt)].filter(Boolean).join(" · ")}</small>
    </li>;
  })}</ul>;
}

function dateInputValue(value, defaultTime) {
  if (!value) return `${localDate()}T${defaultTime}`;
  if (value.length === 10) return `${value}T${defaultTime}`;
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function LeadWorkspace({ initialLead, data, save }) {
  const [lead, setLead] = useState(initialLead);
  const [tab, setTab] = useState("Activity");
  const [editor, setEditor] = useState("");
  const [entry, setEntry] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const followUp = followUpValue(lead);
  const phone = (lead.phone || "").trim().replace(/[^0-9+]/g, "");
  const digits = phone.replace(/\D/g, "");
  const whatsappDigits = !phone.startsWith("+") && digits.length === 10 ? `91${digits}` : digits;
  const tabs = data.canAssign ? ["Activity", "Notes", "Payments"] : ["Activity", "Notes"];

  async function update(changes, confirmation = "Changes saved.") {
    setSaving(true);
    setError("");
    setFeedback("");
    try {
      setLead(await save(changes, lead._id));
      setEditor("");
      setFeedback(confirmation);
      return true;
    } catch (err) { setError(errorMessage(err)); return false; }
    finally { setSaving(false); }
  }

  async function addEntry(kind) {
    if (await update({ [kind]: entry }, kind === "call" ? "Call logged." : "Note added.")) setEntry("");
  }

  function move(stage) {
    if (stage !== lead.crmStage) update({ crmStage: stage }, `Moved to ${stage}.`);
    else setEditor("");
  }

  function schedule(event, kind) {
    event.preventDefault();
    const date = new Date(new FormData(event.currentTarget).get("schedule"));
    if (!Number.isFinite(date.getTime())) { setError("Choose a valid date and time."); return; }
    const time = date.toISOString();
    update(kind === "demo" ? { demoAt: time, crmStage: "Demo booked" } : { followUpAt: time }, kind === "demo" ? "Demo booked." : "Follow-up scheduled.");
  }

  return <>
    <div className="crm-heading">
      <div>
        <Link className="crm-back" to={leadsPath}>Leads / {lead.name}</Link>
        <div className="crm-title-line"><h1>{lead.name}</h1><Stage name={lead.crmStage} /></div>
      </div>
      <div className="crm-actions">
        {digits && <><a className="crm-button" href={`tel:${phone}`}>Call</a>
          <a className="crm-button" href={`https://wa.me/${whatsappDigits}`} target="_blank" rel="noreferrer">WhatsApp</a></>}
        {lead.email && <a className="crm-button" href={`mailto:${encodeURIComponent(lead.email)}`}>Email</a>}
        <button className="crm-primary" disabled={saving} onClick={() => setEditor(editor === "stage" ? "" : "stage")}>Change stage</button>
      </div>
    </div>
    {editor === "stage" && <form className="crm-panel crm-box crm-actions" onSubmit={(event) => {
      event.preventDefault(); move(new FormData(event.currentTarget).get("stage"));
    }}>
      <label>New stage <select name="stage" defaultValue={lead.crmStage}>{data.stages.map((stage) => <option key={stage}>{stage}</option>)}</select></label>
      <button className="crm-primary" disabled={saving}>Save stage</button>
    </form>}
    {error && <p role="alert">{error}</p>}
    {feedback && <p role="status">{feedback}</p>}
    <div className="crm-detail-layout">
      <section className="crm-panel crm-box crm-stack">
        <div className="crm-actions" aria-label="Lead history views">{tabs.map((name) => (
          <button className={tab === name ? "crm-primary" : "crm-button"} key={name} aria-pressed={tab === name} onClick={() => setTab(name)}>{name}</button>
        ))}</div>
        {tab === "Payments" ? <Payments key={lead.email} id={lead._id} /> : <>
          <textarea aria-label="Note or call details" placeholder="Add a note or log a call" rows={3} maxLength={2000} value={entry} onChange={(event) => setEntry(event.target.value)} />
          <div className="crm-actions"><button className="crm-primary" disabled={saving || !entry.trim()} onClick={() => addEntry("note")}>Add note</button>
            {tab === "Activity" && <button className="crm-button" disabled={saving || !entry.trim()} onClick={() => addEntry("call")}>Log call</button>}</div>
          <Activity lead={lead} notesOnly={tab === "Notes"} />
        </>}
      </section>
      <div className="crm-stack">
        <section className="crm-panel crm-box crm-stack">
          <div className="crm-heading"><h2>Details</h2><button className="crm-button" disabled={saving} onClick={() => setEditor(editor === "details" ? "" : "details")}>{editor === "details" ? "Cancel" : "Edit"}</button></div>
          {editor === "details" ? <form className="crm-form" onSubmit={(event) => {
            event.preventDefault(); update({ details: Object.fromEntries(new FormData(event.currentTarget)) });
          }}>
            <LeadFields lead={lead} courses={data.courses} /><button className="crm-primary" disabled={saving}>Save details</button>
          </form> : <>
            <dl className="crm-definition">{[
              ["Phone", lead.phone], ["Email", lead.email], ["City", lead.city], ["Course", lead.course],
              ["Source", lead.source], ["Counselor", counselorName(data, lead)],
            ].map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value || "—"}</dd></div>)}</dl>
            {lead.message && <p className="crm-message">{lead.message}</p>}
            {lead.meta && <details>
              <summary>Meta ad attribution</summary>
              <dl className="crm-definition">{[
                ["Form ID", lead.meta.formId], ["Ad ID", lead.meta.adId], ["Campaign ID", lead.meta.campaignId],
                ["Platform", { fb: "Facebook", ig: "Instagram", facebook: "Facebook", instagram: "Instagram" }[lead.meta.platform]],
                ["Submitted", lead.meta.submittedAt && formatDate(lead.meta.submittedAt)],
              ].filter(([, value]) => value).map(([name, value]) => (
                <div key={name}><dt>{name}</dt><dd>{value}</dd></div>
              ))}</dl>
            </details>}
            {data.canAssign && <label className="crm-form">Assign counselor
              <select value={lead.assignedTo || ""} disabled={saving} onChange={(event) => update({ assignedTo: event.target.value || null }, "Counselor updated.")}>
                <option value="">Unassigned</option>
                {lead.assignedTo && !data.assignees.some(({ _id }) => _id === lead.assignedTo) && <option value={lead.assignedTo}>Inactive counselor</option>}
                {data.assignees.map(({ _id, name }) => <option key={_id} value={_id}>{name}</option>)}
              </select>
            </label>}
          </>}
        </section>
        <section className="crm-panel crm-box crm-stack">
          <h2>Next follow-up</h2><p>{followUp ? formatDate(followUp) : "No follow-up scheduled"}</p>
          <div className="crm-actions">
            <button className="crm-button" disabled={saving} onClick={() => setEditor(editor === "follow-up" ? "" : "follow-up")}>{followUp ? "Reschedule" : "Schedule"}</button>
            {followUp && <button className="crm-primary" disabled={saving} onClick={() => update({
              followUpAt: null, completeFollowUp: true, expectedFollowUp: followUp,
            }, "Follow-up completed.")}>Mark as done</button>}
          </div>
          {editor === "follow-up" && <form className="crm-form" onSubmit={(event) => schedule(event, "follow-up")}>
            <label>Date and time<input name="schedule" type="datetime-local" required defaultValue={dateInputValue(followUp, data.preferences.followUpTime)} /></label>
            <button className="crm-primary" disabled={saving}>Save follow-up</button>
          </form>}
        </section>
        <section className="crm-panel crm-box crm-stack">
          <h2>Move this lead</h2>
          {lead.crmStage === "Demo booked" && lead.demoAt && <p>Demo: {formatDate(lead.demoAt)}</p>}
          <div className="crm-actions">
            <button className="crm-button" disabled={saving} onClick={() => setEditor(editor === "demo" ? "" : "demo")}>Book demo</button>
            <button className="crm-button" disabled={saving || lead.crmStage === "Enrolled"} onClick={() => move("Enrolled")}>Mark as enrolled</button>
            <button className="crm-button" disabled={saving || lead.crmStage === "Lost"} onClick={() => move("Lost")}>Mark as lost</button>
          </div>
          {editor === "demo" && <form className="crm-form" onSubmit={(event) => schedule(event, "demo")}>
            <label>Demo date and time<input name="schedule" type="datetime-local" required defaultValue={dateInputValue(lead.demoAt, data.preferences.followUpTime)} /></label>
            <button className="crm-primary" disabled={saving}>Save demo</button>
          </form>}
        </section>
      </div>
    </div>
  </>;
}

function LeadLoader({ id, data, save }) {
  const [result, setResult] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    api.get(`${crmEndpoint}/${id}`, { signal: controller.signal })
      .then(({ data: response }) => { if (!controller.signal.aborted) setResult(response); })
      .catch((err) => { if (!controller.signal.aborted) setResult({ error: errorMessage(err) }); });
    return () => controller.abort();
  }, [id]);
  if (!result) return <p role="status">Loading lead…</p>;
  if (result.error) return <><Link className="crm-back" to={leadsPath}>Back to leads</Link><p role="alert">{result.error}</p></>;
  return <LeadWorkspace initialLead={result.lead} data={data} save={save} />;
}

export function LeadDetail({ data, save }) {
  const { id } = useParams();
  return <LeadLoader key={id} id={id} data={data} save={save} />;
}
