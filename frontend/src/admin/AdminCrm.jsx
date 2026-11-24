import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import api from "../api/client";
import { LeadDetail, NewLead } from "./crm/LeadDetail";
import { Dashboard, FollowUps, LeadsPage, Pipeline, Reports, Settings, Students, Team } from "./crm/CrmPages";
import { crmEndpoint, errorMessage } from "./crm/crmUtils";
import "./AdminCrm.css";

export default function AdminCrm() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    api.get(crmEndpoint, { signal: controller.signal })
      .then(({ data: response }) => { if (!controller.signal.aborted) setData(response); })
      .catch((err) => { if (!controller.signal.aborted) setError(errorMessage(err)); });
    return () => controller.abort();
  }, [retry]);

  async function save(values, id) {
    const { data: { lead } } = id ? await api.patch(`${crmEndpoint}/${id}`, values) : await api.post(crmEndpoint, values);
    setData((previous) => ({ ...previous, leads: id
      ? previous.leads.map((item) => item._id === id ? lead : item) : [lead, ...previous.leads] }));
    return lead;
  }

  async function importLeads(rows) {
    const { data: result } = await api.post(`${crmEndpoint}/import`, { rows });
    setData((previous) => ({ ...previous, leads: [...result.leads.slice().reverse(), ...previous.leads] }));
    return result.leads.length;
  }

  async function savePreferences(values) {
    const { data: { preferences } } = await api.put("/admin/crm/preferences", values);
    setData((previous) => ({ ...previous, preferences }));
  }

  return <main className="crm-page">
    {error && <p role="alert">{error} <button className="crm-button" onClick={() => { setError(""); setRetry((value) => value + 1); }}>Retry</button></p>}
    {!data && !error && <p role="status">Loading CRM…</p>}
    {data && <Routes>
      <Route index element={<Dashboard data={data} />} />
      <Route path="leads" element={<LeadsPage data={data} importLeads={importLeads} />} />
      <Route path="leads/new" element={<NewLead data={data} save={save} />} />
      <Route path="leads/:id" element={<LeadDetail data={data} save={save} />} />
      <Route path="pipeline" element={<Pipeline data={data} save={save} />} />
      <Route path="follow-ups" element={<FollowUps data={data} save={save} />} />
      <Route path="students" element={<Students data={data} />} />
      <Route path="reports" element={<Reports data={data} />} />
      <Route path="team" element={<Team data={data} />} />
      <Route path="settings" element={<Settings data={data} savePreferences={savePreferences} />} />
      <Route path="*" element={<Navigate to="/admin/crm" replace />} />
    </Routes>}
  </main>;
}
