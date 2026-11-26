import { useRef, useState } from "react";
import { CalendarClock, Plus, Search, SlidersHorizontal } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/client";
import { counselorName, downloadCrmCsv, errorMessage, followUpDate, followUpValue, formatDate,
  isOpenLead, leadCounselors, localDate, parseLeadCsv } from "./crmUtils";

const root = "/admin/crm";
const leadPath = (lead) => `${root}/leads/${lead._id}`;
const addLead = <Link className="crm-primary" to={`${root}/leads/new`}>Add lead</Link>;
const matchSearch = (lead, query) => [lead.name, lead.email, lead.phone, lead.course]
  .some((value) => value?.toLowerCase().includes(query.trim().toLowerCase()));
const due = (lead) => isOpenLead(lead) && followUpDate(lead) && followUpDate(lead) <= localDate();

export function Stage({ name }) {
  return <span className="crm-stage" data-stage={name}>{name}</span>;
}

function Heading({ title, text, children }) {
  return <header className="crm-heading">
    <div><h1>{title}</h1>{text && <p>{text}</p>}</div>
    {children && <div className="crm-actions">{children}</div>}
  </header>;
}

function Metrics({ data }) {
  const today = localDate();
  const monday = new Date();
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const values = [
    ["New leads today", data.leads.filter((lead) => localDate(lead.createdAt) === today).length, "leads"],
    ["Follow-ups due", data.leads.filter(due).length, "follow-ups"],
    ["Demos this week", data.leads.filter((lead) => lead.crmStage === "Demo booked" && lead.demoAt
      && localDate(lead.demoAt) >= localDate(monday) && localDate(lead.demoAt) <= localDate(sunday)).length, "pipeline"],
    ["Enrolled this month", data.leads.filter((lead) => lead.crmStage === "Enrolled"
      && localDate(lead.enrolledAt || lead.updatedAt).slice(0, 7) === today.slice(0, 7)).length, "students"],
  ];
  return <div className="crm-metrics">{values.map(([name, value, path]) => (
    <Link className="crm-panel crm-metric" key={name} to={`${root}/${path}`}><span>{name}</span><strong>{value}</strong></Link>
  ))}</div>;
}

function useFilters(data) {
  const [params, setParams] = useSearchParams();
  const controls = [
    ["stage", "Stage", data.stages.map((value) => [value, value])],
    ["source", "Source", [...new Set(data.leads.map((lead) => lead.source))].sort().map((value) => [value, value])],
    ["course", "Course", [...new Set(data.leads.map((lead) => lead.course).filter(Boolean))].sort().map((value) => [value, value])],
  ];
  if (data.canAssign) {
    controls.push(["counselor", "Counselor", [["unassigned", "Unassigned"], ...data.assignees.map(({ _id, name }) => [_id, name])]]);
  }
  if (data.canManageTeams) controls.push(["team", "Team", [["unassigned", "Unassigned team"], ...data.teams.map(({ _id, name }) => [_id, name])]]);
  const update = (key, value) => setParams((current) => {
    const next = new URLSearchParams(current);
    if (key !== "page") next.delete("page");
    if (value) next.set(key, value);
    else next.delete(key);
    return next;
  }, { replace: key !== "page" });
  const matches = data.leads.filter((lead) => matchSearch(lead, params.get("q") || "")
    && (!params.get("stage") || params.get("stage") === lead.crmStage)
    && (!params.get("source") || params.get("source") === lead.source)
    && (!params.get("course") || params.get("course") === lead.course)
    && (!params.get("counselor") || params.get("counselor") === (lead.assignedTo || "unassigned"))
    && (!params.get("team") || params.get("team") === (lead.teamId || "unassigned")));
  return { controls, matches, params, update };
}

function Filters({ state, showSearch = true }) {
  return <div className="crm-filters">
    {showSearch && <input type="search" aria-label="Search leads" placeholder="Search by name, phone or email" value={state.params.get("q") || ""} onChange={(event) => state.update("q", event.target.value)} />}
    {state.controls.map(([key, label, options]) => (
      <select key={key} aria-label={label} value={state.params.get(key) || ""} onChange={(event) => state.update(key, event.target.value)}>
        <option value="">{label}</option>
        {options.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
      </select>
    ))}
  </div>;
}

function LeadAssignee({ data, lead, save }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const counselors = leadCounselors(data, lead);

  async function assign(event) {
    const assignedTo = event.target.value || null;
    setSaving(true);
    setError("");
    try { await save({ assignedTo }, lead._id); }
    catch (err) { setError(errorMessage(err)); }
    finally { setSaving(false); }
  }

  return <div className="crm-lead-assignee">
    <select aria-label={`Assign counselor for ${lead.name}`} value={lead.assignedTo || ""} disabled={saving} onChange={assign}>
      <option value="">Unassigned</option>
      {lead.assignedTo && !counselors.some(({ _id }) => _id === lead.assignedTo) && <option value={lead.assignedTo}>Counselor unavailable</option>}
      {counselors.map(({ _id, name }) => <option key={_id} value={_id}>{name}</option>)}
    </select>
    {saving && <small role="status">Assigning…</small>}
    {error && <p role="alert">{error}</p>}
  </div>;
}

function LeadTable({ data, leads, action, save }) {
  if (!leads.length) return <p className="crm-panel crm-box">No leads to show.</p>;
  return <div className="crm-panel crm-table-wrap"><table>
    <thead><tr><th>Name</th><th>Phone</th><th>Course</th><th>Source</th><th>Stage</th><th>Counselor</th><th>Next follow-up</th>{action && <th>Action</th>}</tr></thead>
    <tbody>{leads.map((lead) => <tr key={lead._id}>
      <td><Link to={leadPath(lead)}>{lead.name}</Link></td><td>{lead.phone || "—"}</td><td>{lead.course || "—"}</td>
      <td>{lead.source}</td><td><Stage name={lead.crmStage} /></td>
      <td>{data.canAssign && save ? <LeadAssignee data={data} lead={lead} save={save} /> : counselorName(data, lead)}</td>
      <td>{formatDate(followUpValue(lead))}</td>
      {action && <td>{action(lead)}</td>}
    </tr>)}</tbody>
  </table></div>;
}

function exportLeads(data, leads, file = "cabroy-leads.csv") {
  downloadCrmCsv(file, ["Name", "Email", "Phone", "Course", "Source", "Stage", "Counselor", "Next follow-up", "City", "Subject"],
    leads.map((lead) => [lead.name, lead.email, lead.phone, lead.course, lead.source, lead.crmStage,
      counselorName(data, lead), followUpValue(lead), lead.city, lead.subject]));
}

export function LeadsPage({ data, importLeads, save }) {
  const state = useFilters(data);
  const fileInput = useRef(null);
  const [showMetaDemo, setShowMetaDemo] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [pending, setPending] = useState(false);
  const size = data.preferences.pageSize;
  const max = Math.max(1, Math.ceil(state.matches.length / size));
  const page = Math.min(max, Math.max(1, Number.parseInt(state.params.get("page"), 10) || 1));
  const start = (page - 1) * size;
  const rows = state.matches.slice(start, start + size);

  async function importFile(event) {
    const file = event.target.files[0];
    event.target.value = "";
    if (!file) return;
    setFeedback(null);
    setPending(true);
    try {
      if (file.size > 500_000) throw new Error("Choose a CSV file smaller than 500 KB.");
      const count = await importLeads(parseLeadCsv(await file.text()));
      setFeedback({ message: `Imported ${count} ${count === 1 ? "lead" : "leads"}.` });
    } catch (err) { setFeedback({ message: errorMessage(err), error: true }); }
    finally { setPending(false); }
  }

  return <>
    <Heading title="Leads" text="Manage inquiries and their next steps.">
      {data.canAssign && <>
        <button type="button" className="crm-button" aria-expanded={showMetaDemo} onClick={() => setShowMetaDemo(!showMetaDemo)}>
          {showMetaDemo ? "Hide Meta lead demo" : "Meta lead demo"}
        </button>
        <input ref={fileInput} type="file" hidden accept=".csv,text/csv" onChange={importFile} />
        <button className="crm-button" disabled={pending} onClick={() => fileInput.current.click()}>{pending ? "Importing…" : "Import CSV"}</button>
      </>}
      <button className="crm-button" disabled={!state.matches.length} onClick={() => exportLeads(data, state.matches)}>Export</button>
      {addLead}
    </Heading>
    {showMetaDemo && <section className="crm-panel crm-box crm-stack" aria-labelledby="crm-meta-demo-title">
      <div className="crm-heading">
        <div><h2 id="crm-meta-demo-title">Facebook Instant Form demo</h2><p>Sample lead for preview</p></div>
        <Stage name="New" />
      </div>
      <dl className="crm-definition">
        <div><dt>Name</dt><dd>Aditi Sharma (Demo)</dd></div>
        <div><dt>Course</dt><dd>Digital Marketing</dd></div>
        <div><dt>Source</dt><dd>Meta Ads</dd></div>
        <div><dt>Platform</dt><dd>Facebook</dd></div>
      </dl>
      <details>
        <summary>Meta ad attribution</summary>
        <dl className="crm-definition">
          <div><dt>Form ID</dt><dd>100000000001</dd></div>
          <div><dt>Ad ID</dt><dd>100000000002</dd></div>
          <div><dt>Campaign ID</dt><dd>100000000003</dd></div>
        </dl>
      </details>
    </section>}
    {feedback && <p role={feedback.error ? "alert" : "status"}>{feedback.message}</p>}
    <Metrics data={data} /><Filters state={state} /><LeadTable data={data} leads={rows} save={save} />
    <div className="crm-pagination">
      <p>{rows.length ? `Showing ${start + 1} to ${start + rows.length} of ${state.matches.length} leads` : "Showing 0 leads"}</p>
      {max > 1 && <div className="crm-actions">
        <button className="crm-button" disabled={page <= 1} onClick={() => state.update("page", page - 1)}>Previous</button>
        <button className="crm-button" disabled={page >= max} onClick={() => state.update("page", page + 1)}>Next</button>
      </div>}
    </div>
  </>;
}

function PipelineCard({ lead, data, save, canDrag, onDragEnd }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const counselor = counselorName(data, lead);
  const next = followUpValue(lead);

  async function addNote(event) {
    event.preventDefault();
    const note = new FormData(event.currentTarget).get("note").trim();
    if (!note) { setError("Enter a discussion note."); return; }
    setSaving(true);
    setError("");
    try {
      await save({ note }, lead._id);
      setEditing(false);
    } catch (err) { setError(errorMessage(err)); }
    finally { setSaving(false); }
  }

  return <article className="crm-pipeline-card" draggable={canDrag && !editing}
    onDragStart={(event) => {
      if (!canDrag || editing) { event.preventDefault(); return; }
      event.dataTransfer.setData("text/plain", lead._id);
      event.dataTransfer.effectAllowed = "move";
    }}
    onDragEnd={onDragEnd}>
    <span className="crm-card-source">{lead.source}</span>
    <Link className="crm-card-name" to={leadPath(lead)}>{lead.name}</Link>
    {lead.course && <span>{lead.course}</span>}
    <div className="crm-pipeline-meta">
      {data.canAssign ? <LeadAssignee data={data} lead={lead} save={save} />
        : <small><span className="crm-owner-mark" aria-hidden="true">{lead.assignedTo ? counselor.charAt(0) : "–"}</span>{counselor}</small>}
      {next && <small className="crm-card-date"><CalendarClock size={13} aria-hidden="true" />{formatDate(next)}</small>}
    </div>
    <div className="crm-card-discussion" aria-live="polite">
      <strong>Discussion notes</strong>
      <p>{lead.latestDiscussion?.text || "No discussion notes yet."}</p>
    </div>
    {editing ? <form className="crm-form crm-card-note-form" onSubmit={addNote}>
      <textarea name="note" aria-label={`Discussion note for ${lead.name}`} placeholder="What did you discuss?" rows={3} maxLength={2000} required />
      <div className="crm-actions">
        <button className="crm-primary" disabled={saving}>{saving ? "Saving…" : "Save note"}</button>
        <button type="button" className="crm-button" disabled={saving} onClick={() => { setEditing(false); setError(""); }}>Cancel</button>
      </div>
      {error && <p role="alert">{error}</p>}
    </form> : <button type="button" className="crm-button crm-card-note-button" onClick={() => setEditing(true)}>Add note</button>}
  </article>;
}

export function Pipeline({ data, save }) {
  const state = useFilters(data);
  const [showFilters, setShowFilters] = useState(false);
  const [hover, setHover] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function drop(event, stage) {
    event.preventDefault();
    setHover("");
    const lead = data.leads.find((item) => item._id === event.dataTransfer.getData("text/plain"));
    if (!lead || lead.crmStage === stage || pending) return;
    setError("");
    setPending(true);
    try { await save({ crmStage: stage }, lead._id); }
    catch (err) { setError(errorMessage(err)); }
    finally { setPending(false); }
  }
  return <>
    <Heading title="Pipeline" text="Drag a card to change its stage, or open it to update the lead." />
    <div className="crm-board-tools">
      <label className="crm-board-search">
        <Search size={16} aria-hidden="true" />
        <input type="search" aria-label="Search pipeline" placeholder="Search leads" value={state.params.get("q") || ""} onChange={(event) => state.update("q", event.target.value)} />
      </label>
      <button className="crm-button" aria-expanded={showFilters} onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal size={15} aria-hidden="true" />Filters</button>
      <Link className="crm-primary crm-board-add" to={`${root}/leads/new`}><Plus size={16} aria-hidden="true" />Add lead</Link>
    </div>
    {showFilters && <Filters state={state} showSearch={false} />}
    {error && <p role="alert">{error}</p>}
    <div className="crm-board" aria-label="Lead pipeline">{data.stages.map((stage) => {
      const leads = state.matches.filter((lead) => lead.crmStage === stage);
      return <section className="crm-column" key={stage} data-stage={stage} data-over={hover === stage} onDrop={(event) => drop(event, stage)}
        onDragOver={(event) => { event.preventDefault(); setHover(stage); }}>
        <h2><span className="crm-lane-dot" aria-hidden="true" />{stage}<span className="crm-lane-count">{leads.length}</span></h2>
        {leads.length === 0 && <p className="crm-lane-empty">No leads</p>}
        {leads.map((lead) => <PipelineCard key={lead._id} lead={lead} data={data} save={save}
          canDrag={!pending} onDragEnd={() => setHover("")} />)}
      </section>;
    })}</div>
  </>;
}

export function Dashboard({ data }) {
  return <>
    <Heading title="Dashboard" text="Your lead activity at a glance.">{addLead}</Heading><Metrics data={data} />
    <section className="crm-stack"><div className="crm-heading"><h2>Recent leads</h2><Link className="crm-button" to={`${root}/leads`}>View all leads</Link></div>
      <LeadTable data={data} leads={data.leads.slice(0, 6)} /></section>
  </>;
}

export function FollowUps({ data, save }) {
  const [range, setRange] = useState("due");
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const rows = data.leads.filter((lead) => isOpenLead(lead) && followUpValue(lead) && (range === "all" || due(lead)))
    .sort((a, b) => followUpValue(a).localeCompare(followUpValue(b)));
  async function complete(lead) {
    setPending(lead._id);
    setError("");
    try { await save({ followUpAt: null, completeFollowUp: true, expectedFollowUp: followUpValue(lead) }, lead._id); }
    catch (err) { setError(errorMessage(err)); }
    finally { setPending(""); }
  }
  return <>
    <Heading title="Follow-ups" text="Work through due and upcoming follow-ups.">
      <select aria-label="Follow-up range" value={range} onChange={(event) => setRange(event.target.value)}>
        <option value="due">Due today or overdue</option><option value="all">All scheduled</option>
      </select>
    </Heading>
    {error && <p role="alert">{error}</p>}
    <LeadTable data={data} leads={rows} action={(lead) => <button className="crm-button" disabled={Boolean(pending)} onClick={() => complete(lead)}>{pending === lead._id ? "Saving…" : "Mark as done"}</button>} />
  </>;
}

export function Students({ data }) {
  const [query, setQuery] = useState("");
  const enrolled = data.leads.filter((lead) => lead.crmStage === "Enrolled" && matchSearch(lead, query));
  return <>
    <Heading title="Students" text="Leads marked as enrolled in the CRM.">
      <button className="crm-button" disabled={!enrolled.length} onClick={() => exportLeads(data, enrolled, "cabroy-enrolled-leads.csv")}>Export</button>
    </Heading>
    <div className="crm-filters"><input type="search" aria-label="Search students" placeholder="Search students" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
    <LeadTable data={data} leads={enrolled} />
  </>;
}

export function Reports({ data }) {
  const [range, setRange] = useState("30");
  const start = new Date();
  if (range !== "all") start.setDate(start.getDate() - Number(range) + 1);
  const leads = data.leads.filter((lead) => range === "all" || localDate(lead.createdAt) >= localDate(start));
  const stages = data.stages.map((stage) => [stage, leads.filter((lead) => lead.crmStage === stage).length]);
  const sourceCounts = new Map();
  for (const { source } of leads) sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
  const sources = [...sourceCounts].sort((a, b) => b[1] - a[1]);
  const enrolled = stages.find(([stage]) => stage === "Enrolled")[1];
  const conversion = leads.length ? Math.round(enrolled / leads.length * 100) : 0;
  return <>
    <Heading title="Reports" text="Pipeline and source breakdown for leads created in the selected period.">
      <select aria-label="Reporting period" value={range} onChange={(event) => setRange(event.target.value)}>
        <option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="all">All time</option>
      </select>
      <button className="crm-button" disabled={!leads.length} onClick={() => downloadCrmCsv("cabroy-crm-report.csv", ["Breakdown", "Value", "Leads"], [
        ...stages.map(([name, value]) => ["Stage", name, value]), ...sources.map(([name, value]) => ["Source", name, value]),
      ])}>Export report</button>
    </Heading>
    <div className="crm-metrics">{[["Leads", leads.length], ["Enrolled", enrolled], ["Conversion rate", `${conversion}%`]].map(([label, value]) =>
      <div className="crm-panel crm-metric" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    <div className="crm-two-columns">{[["By stage", stages], ["By source", sources]].map(([title, items]) =>
      <section className="crm-panel crm-box crm-stack" key={title}><h2>{title}</h2>
        {items.length ? items.map(([label, value]) => <div className="crm-report-row" key={label}>
          <span>{label}</span><progress aria-label={label} value={value} max={leads.length || 1} /><strong>{value}</strong>
        </div>) : <p>No data for this period.</p>}
      </section>)}</div>
  </>;
}

function TeamEditor({ team, onSave }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function deleteTeam() {
    setPending(true);
    setError("");
    setSaved(false);
    try {
      await api.delete(`/admin/crm/teams/${team._id}`);
      onSave();
    } catch (err) { setError(errorMessage(err)); }
    finally { setPending(false); }
  }
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const teamData = {
      name: values.get("name"),
      courses: values.get("courses").split("\n").map((course) => course.trim()).filter(Boolean),
      active: values.has("active"),
      routingWeight: Number(values.get("routingWeight")),
    };
    setPending(true);
    setError("");
    setSaved(false);
    try {
      if (team) await api.put(`/admin/crm/teams/${team._id}`, teamData);
      else { await api.post("/admin/crm/teams", teamData); form.reset(); }
      setSaved(true);
      onSave();
    } catch (err) { setError(errorMessage(err)); }
    finally { setPending(false); }
  }
  return <form className="crm-panel crm-box crm-form" onSubmit={submit}>
    <h2>{team?.name || "Create team"}</h2>
    <label>Team name<input name="name" maxLength={80} defaultValue={team?.name || ""} required /></label>
    <label>Courses, one per line<textarea name="courses" rows={3} defaultValue={team?.courses.join("\n") || ""} placeholder="Leave blank to handle all courses" /></label>
    <label>Lead routing weight
      <input name="routingWeight" type="number" min={1} max={100} step={1} defaultValue={team?.routingWeight ?? 1} required />
    </label>
    <label><span><input type="checkbox" name="active" defaultChecked={team?.active ?? true} /> Route new leads to this team</span></label>
    <div className="crm-actions">
      <button className="crm-primary" disabled={pending || confirmDelete}>{team ? "Save team" : "Create team"}</button>
      {team && !confirmDelete && <button type="button" className="crm-button" disabled={pending} onClick={() => setConfirmDelete(true)}>Delete team</button>}
    </div>
    {confirmDelete && <div className="crm-stack">
      <p>This team will stop receiving new leads. Existing leads and memberships will stay available for reassignment.</p>
      <div className="crm-actions">
        <button type="button" className="crm-button" disabled={pending} onClick={deleteTeam}>Confirm delete</button>
        <button type="button" className="crm-button" disabled={pending} onClick={() => setConfirmDelete(false)}>Cancel</button>
      </div>
    </div>}
    {saved && <p role="status">Team saved.</p>}
    {error && <p role="alert">{error}</p>}
  </form>;
}

export function Team({ data, refresh }) {
  const { user } = useAuth();
  const people = data.canAssign ? data.assignees.filter((person) => person.role !== "admin") : [{ _id: user._id || user.id, name: user.name }];
  const canManageEmployees = user.role === "admin" || user.adminPermissions?.includes("employees");
  const [pending, setPending] = useState("");
  const [memberships, setMemberships] = useState({});
  const [error, setError] = useState("");
  const teams = (data.teams || []).filter((team) => !team.deletedAt);
  async function setMembership(person, teamId) {
    setPending(person._id);
    setError("");
    try {
      await api.put(`/admin/crm/team-members/${person._id}`, { teamId: teamId || null });
      setMemberships((current) => ({ ...current, [person._id]: teamId }));
      refresh();
    } catch (err) { setError(errorMessage(err)); }
    finally { setPending(""); }
  }
  return <>
    <Heading title="Team" text={data.canAssign ? "Review counselor workloads and open their assigned leads." : "Review your assigned workload."}>
      {canManageEmployees && <Link className="crm-button" to="/admin/employees">Manage employees</Link>}
    </Heading>
    {teams.length > 0 && <div className="crm-metrics">{teams.map((team) => {
      const leads = data.leads.filter((lead) => lead.teamId === team._id);
      return <Link className="crm-panel crm-metric" key={team._id} to={`${root}/leads?team=${team._id}`}>
        <span>{team.name} · {team.active ? `Weight ${team.routingWeight ?? 1}` : "Routing paused"}</span><strong>{leads.length}</strong>
        <small>{leads.filter((lead) => lead.source === "Google Ads").length} Google Ads · {leads.filter((lead) => lead.source === "Meta Ads").length} Meta Ads</small>
      </Link>;
    })}</div>}
    {data.canManageTeams && <div className="crm-two-columns">
      <TeamEditor onSave={refresh} />
      {teams.map((team) => <TeamEditor key={team._id} team={team} onSave={refresh} />)}
    </div>}
    {error && <p role="alert">{error}</p>}
    <div className="crm-panel crm-table-wrap"><table><thead><tr><th>Counselor</th><th>Assigned leads</th><th>Open leads</th><th>Follow-ups due</th>{data.canManageTeams && <th>Team</th>}</tr></thead>
      <tbody>{people.map((person) => {
        const leads = data.canAssign ? data.leads.filter((lead) => lead.assignedTo === person._id) : data.leads;
        return <tr key={person._id}><td><Link to={data.canAssign ? `${root}/leads?counselor=${person._id}` : `${root}/leads`}>{person.name}</Link></td>
          <td>{leads.length}</td><td>{leads.filter(isOpenLead).length}</td><td>{leads.filter(due).length}</td>
          {data.canManageTeams && <td><select aria-label={`Team for ${person.name}`} disabled={Boolean(pending)}
            value={memberships[person._id] ?? person.crmTeamId ?? ""} onChange={(event) => setMembership(person, event.target.value)}>
            <option value="">No team</option>
            {data.teams.filter((team) => !team.deletedAt || team._id === (memberships[person._id] ?? person.crmTeamId))
              .map((team) => <option key={team._id} value={team._id}>{team.name}{team.deletedAt ? " (deleted)" : ""}</option>)}
          </select>{person.adminPermissions?.includes("sales_manage") && <small> Manager</small>}</td>}
        </tr>;
      })}</tbody>
    </table></div>
    {data.canAssign && <div className="crm-actions"><Link className="crm-button" to={`${root}/leads?counselor=unassigned`}>View leads without a counselor</Link>
      {data.canManageTeams && <Link className="crm-button" to={`${root}/leads?team=unassigned`}>View leads without a team</Link>}</div>}
  </>;
}

export function Settings({ data, savePreferences }) {
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState(null);
  async function submit(event) {
    event.preventDefault();
    setPending(true);
    setFeedback(null);
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await savePreferences({ ...values, pageSize: Number(values.pageSize) });
      setFeedback({ message: "Preferences saved." });
    } catch (err) { setFeedback({ message: errorMessage(err), error: true }); }
    finally { setPending(false); }
  }
  return <>
    <Heading title="Settings" text="Customize your CRM defaults." />
    <form className="crm-panel crm-box crm-form crm-create" onSubmit={submit}>
      <label>Leads per page<select name="pageSize" defaultValue={data.preferences.pageSize}><option>10</option><option>25</option><option>50</option></select></label>
      <label>Default follow-up time<input name="followUpTime" type="time" required defaultValue={data.preferences.followUpTime} /></label>
      <label>Default lead source<input name="leadSource" required maxLength={80} defaultValue={data.preferences.leadSource} /></label>
      <button className="crm-primary" disabled={pending}>{pending ? "Saving…" : "Save preferences"}</button>
      {feedback && <p role={feedback.error ? "alert" : "status"}>{feedback.message}</p>}
    </form>
  </>;
}
