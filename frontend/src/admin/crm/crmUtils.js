const root = "/admin/crm";
export const crmNavigation = [
  { label: "Dashboard", path: root, end: true },
  { label: "Leads", path: `${root}/leads` },
  { label: "Pipeline", path: `${root}/pipeline` },
  { label: "Follow-ups", path: `${root}/follow-ups` },
  { label: "Students", path: `${root}/students` },
  { label: "Reports", path: `${root}/reports` },
  { label: "Team", path: `${root}/team` },
  { label: "Settings", path: `${root}/settings` },
];

export const crmEndpoint = "/admin/crm/leads";
export const errorMessage = (error) => error.response?.data?.message || error.message || "Something went wrong. Try again.";
export const localDate = (value = new Date()) => {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
export const formatDate = (value) => value
  ? new Date(value.length === 10 ? `${value}T00:00:00` : value).toLocaleString(undefined,
    value.length === 10 ? { dateStyle: "medium" } : { dateStyle: "medium", timeStyle: "short" })
  : "—";
export const followUpDate = (lead) => lead.followUpAt ? localDate(lead.followUpAt) : lead.followUpOn;
export const followUpValue = (lead) => lead.followUpAt || lead.followUpOn || "";
export const isOpenLead = (lead) => !["Enrolled", "Lost"].includes(lead.crmStage);
export const counselorName = (data, lead) => data.assignees.find(({ _id }) => _id === lead.assignedTo)?.name
  || (lead.assignedTo ? data.canAssign ? "Inactive counselor" : "You" : "Unassigned");

export function downloadCrmCsv(filename, headers, rows) {
  const escape = (value) => {
    const text = String(value ?? "");
    const safe = /^[\s\uFEFF]*[=+@-]|^[\t\r\n]/.test(text) ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const contents = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", contents], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function parseLeadCsv(text) {
  text = text.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  let closedQuote = false;
  for (let index = 0; index <= text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === undefined) throw new Error("The CSV contains an unclosed quote.");
      if (char === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (char === '"') { quoted = false; closedQuote = true; }
      else field += char;
    } else if (char === '"' && !field && !closedQuote) {
      quoted = true;
    } else if ([",", "\r", "\n", undefined].includes(char)) {
      row.push(field);
      field = "";
      closedQuote = false;
      if (char !== ",") {
        if (row.some((item) => item.trim())) rows.push(row);
        row = [];
        if (char === "\r" && text[index + 1] === "\n") index += 1;
      }
    } else {
      if (closedQuote || char === '"') throw new Error("The CSV contains a misplaced quote.");
      field += char;
    }
  }
  const headers = rows.shift()?.map((key) => key.trim().toLowerCase()) || [];
  if (!headers.includes("name") || !headers.includes("email")) throw new Error("The CSV needs name and email columns.");
  if (new Set(headers).size !== headers.length) throw new Error("CSV column names must be unique.");
  if (!rows.length || rows.length > 200) throw new Error("Import between 1 and 200 leads at a time.");
  const fields = ["name", "email", "phone", "course", "source", "city", "subject", "message"];
  return rows.map((values, index) => {
    if (values.length !== headers.length) throw new Error(`CSV row ${index + 2} has the wrong number of columns.`);
    return Object.fromEntries(fields.filter((fieldName) => headers.includes(fieldName))
      .map((fieldName) => [fieldName, values[headers.indexOf(fieldName)]]));
  });
}
