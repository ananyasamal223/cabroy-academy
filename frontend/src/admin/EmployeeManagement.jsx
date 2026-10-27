import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  BarChart3,
  BookOpen,
  Building2,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  GraduationCap,
  Headphones,
  KeyRound,
  LockKeyhole,
  Mail,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Tag,
  Clock3,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import api from "../api/client";
import "./EmployeeManagement.css";

const ALL_PERMISSIONS = [
  "dashboard",
  "reports",
  "courses",
  "revenue",
  "instructors",
  "certificates",
  "employees",
  "sales",
  "sales_manage",
  "instructor_portal",
];

const ROLE_OPTIONS = [
  ["sales", "Sales"],
  ["instructor", "Instructor"],
  ["content_reviewer", "Content Reviewer"],
  ["academic_manager", "Academic Manager"],
  ["analyst", "Analyst"],
  ["support", "Support"],
  ["admin", "Admin"],
];

const DEPARTMENT_OPTIONS = [
  ["", "All Departments"],
  ["sales", "Sales"],
  ["instruction", "Instruction"],
  ["content", "Content"],
  ["operations", "Operations"],
  ["support", "Support"],
  ["management", "Management"],
];

const ACCESS_SEARCH_OPTIONS = [
  ["all", "All Users"],
  ["sales", "Sales"],
  ["instruction", "Instruction"],
  ["content", "Content"],
  ["operations", "Operations"],
  ["support", "Support"],
  ["management", "Management"],
];

const ACCESS_OPTIONS = [
  {
    value: "none",
    label: "No Admin Access",
    description: "Remove all admin access",
    Icon: Shield,
    iconClass: "text-red-500",
  },
  {
    value: "sales",
    label: "Sales Dashboard Only",
    description: "Access to personal sales dashboard",
    Icon: BarChart3,
    iconClass: "text-violet-600",
  },
  {
    value: "instructor",
    label: "Instructor Access",
    description: "Access to instructor dashboard",
    Icon: GraduationCap,
    iconClass: "text-blue-600",
  },
  {
    value: "support",
    label: "Support Access",
    description: "Access to support tools",
    Icon: Headphones,
    iconClass: "text-cyan-600",
  },
  {
    value: "operations",
    label: "Operations Access",
    description: "Access to operations dashboard",
    Icon: Settings,
    iconClass: "text-blue-700",
  },
  {
    value: "management",
    label: "Management Access",
    description: "Access to management reports",
    Icon: Users,
    iconClass: "text-blue-600",
  },
  {
    value: "full",
    label: "Full Admin Access",
    description: "Complete access to all admin features",
    Icon: ShieldCheck,
    iconClass: "text-emerald-600",
  },
];

const makePromo = () => ({ code: "", discountPercent: "10", maxDiscount: "500", isActive: true });

const emptyEmployee = {
  name: "",
  email: "",
  phone: "",
  password: "",
  employeeRole: "sales",
  department: "sales",
  assignedCourses: [],
  promoCodes: [makePromo()],
  accessProfile: "none",
};

const PROFILE_PERMISSIONS = {
  none: [],
  sales: ["sales"],
  instructor: ["instructor_portal"],
  support: ["dashboard", "reports"],
  operations: ["dashboard", "reports", "courses", "revenue"],
  management: ["dashboard", "reports", "revenue", "instructors", "certificates", "employees", "sales_manage"],
  full: ALL_PERMISSIONS,
};

function sortedPermissions(list = []) {
  return [...new Set(list)].sort().join("|");
}

function accessFromEmployee(employee) {
  if (!employee?.adminAccess) return "none";
  const current = sortedPermissions(employee.adminPermissions || []);
  for (const [profile, permissions] of Object.entries(PROFILE_PERMISSIONS)) {
    if (profile !== "none" && current === sortedPermissions(permissions)) return profile;
  }
  if ((employee.adminPermissions || []).length >= 8 || employee.employeeRole === "admin") return "full";
  return "custom";
}

function accessLabel(employee) {
  const type = accessFromEmployee(employee);
  return {
    none: "No Admin Access",
    sales: "Sales Dashboard Only",
    instructor: "Instructor Access",
    support: "Support Access",
    operations: "Operations Access",
    management: "Management Access",
    full: "Full Admin Access",
    custom: "Custom Access",
  }[type];
}

function permissionsFor(profile, employeeRole) {
  if (PROFILE_PERMISSIONS[profile]) return PROFILE_PERMISSIONS[profile];
  if (profile === "role") {
    const defaults = {
      sales: PROFILE_PERMISSIONS.sales,
      instructor: PROFILE_PERMISSIONS.instructor,
      content_reviewer: ["courses"],
      academic_manager: ["dashboard", "reports", "courses", "instructors", "certificates"],
      analyst: ["dashboard", "reports", "revenue"],
      support: PROFILE_PERMISSIONS.support,
      admin: ALL_PERMISSIONS,
    };
    return defaults[employeeRole] || ["dashboard"];
  }
  return [];
}

function cleanPromoCodes(rows = []) {
  return rows
    .map((row) => ({
      code: String(row.code || "").trim().toUpperCase(),
      discountPercent: Number(row.discountPercent || 0),
      maxDiscount: Number(row.maxDiscount || 0),
      isActive: row.isActive !== false,
    }))
    .filter((row) => row.code);
}


function matchesAccessSearch(candidate, scope) {
  if (scope === "all") return true;
  const department = String(candidate?.department || "").trim().toLowerCase();
  const type = String(candidate?.type || "").trim().toLowerCase();
  const role = String(candidate?.employeeRole || "").trim().toLowerCase();

  if (scope === "sales") return department === "sales" || type === "sales" || role === "sales";
  if (scope === "instruction") return department === "instruction" || type === "instructor" || role === "instructor";
  if (scope === "content") return department === "content" || role === "content_reviewer";
  if (scope === "operations") return department === "operations" || role === "operations";
  if (scope === "support") return department === "support" || type === "support" || role === "support";
  if (scope === "management") return department === "management" || role === "academic_manager" || role === "admin" || type === "management";
  return true;
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [accessOpen, setAccessOpen] = useState(false);
  const [form, setForm] = useState(emptyEmployee);
  const [saving, setSaving] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [candidateScope, setCandidateScope] = useState("all");
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [grantProfile, setGrantProfile] = useState("sales");
  const [grantDepartment, setGrantDepartment] = useState("sales");
  const [accessNote, setAccessNote] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/admin/employees", { params: { q: search, role, department, status } });
      setEmployees(data.employees || []);
    } catch (e) {
      setError(e.response?.data?.message || "Could not load employees.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, role, department, status]);

  useEffect(() => {
    api
      .get("/courses", { params: { published: "all" } })
      .then(({ data }) => setCourses(data.courses || []))
      .catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    if (!accessOpen || !candidateSearch.trim() || selectedCandidate) {
      setCandidates([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get("/admin/access-candidates", { params: { q: candidateSearch } });
        setCandidates(data.candidates || []);
      } catch {
        setCandidates([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [candidateSearch, accessOpen, selectedCandidate]);

  const stats = useMemo(
    () => ({
      total: employees.length,
      active: employees.filter((e) => e.isActive).length,
      withAccess: employees.filter((e) => e.adminAccess).length,
      inactive: employees.filter((e) => !e.isActive).length,
    }),
    [employees]
  );

  const rowsPerPage = 6;
  const totalPages = Math.max(1, Math.ceil(employees.length / rowsPerPage));
  const currentEmployees = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * rowsPerPage;
    return employees.slice(start, start + rowsPerPage);
  }, [employees, page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search, role, department, status]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const filteredCandidates = useMemo(() => candidates.filter((candidate) => matchesAccessSearch(candidate, candidateScope)), [candidates, candidateScope]);

  const openAddEmployee = () => {
    setError("");
    setForm({ ...emptyEmployee, promoCodes: [makePromo()] });
    setAddOpen(true);
  };

  const openAdminAccess = () => {
    setError("");
    setCandidateSearch("");
    setCandidateScope("all");
    setCandidates([]);
    setSelectedCandidate(null);
    setGrantProfile("sales");
    setGrantDepartment("sales");
    setAccessNote("");
    setTempPassword("");
    setAccessOpen(true);
  };

  const createEmployee = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const promos = cleanPromoCodes(form.promoCodes);
      if (form.employeeRole === "sales" && !promos.length) {
        throw new Error("Add at least one promo code for a sales employee.");
      }
      const perms = permissionsFor(form.accessProfile, form.employeeRole);
      await api.post("/admin/employees", {
        ...form,
        promoCodes: promos,
        promoCode: promos[0]?.code || "",
        discountPercent: promos[0]?.discountPercent || 0,
        maxDiscount: promos[0]?.maxDiscount || 0,
        adminAccess: form.accessProfile !== "none",
        adminPermissions: perms,
      });
      setAddOpen(false);
      setForm({ ...emptyEmployee, promoCodes: [makePromo()] });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Could not add employee.");
    } finally {
      setSaving(false);
    }
  };

  const updateEmployee = async (payload) => {
    if (!editEmployee) return;
    setSaving(true);
    setError("");
    try {
      await api.patch(`/admin/employees/${editEmployee.id}`, payload);
      if (payload.accessProfile !== undefined) {
        const profile = payload.accessProfile;
        await api.patch(`/admin/employees/${editEmployee.id}/access`, {
          adminAccess: profile !== "none",
          adminPermissions: permissionsFor(profile, payload.employeeRole || editEmployee.employeeRole),
        });
      }
      setEditEmployee(null);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Could not update employee.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (employee) => {
    try {
      await api.patch(`/admin/employees/${employee.id}/status`, { isActive: !employee.isActive });
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Could not change employee status.");
    }
  };

  const removeEmployee = async (employee) => {
    if (!window.confirm(`Remove ${employee.name}? Historical sales and purchase records will be preserved.`)) return;
    try {
      await api.delete(`/admin/employees/${employee.id}`);
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Could not remove employee.");
    }
  };

  const chooseCandidate = (candidate) => {
    setSelectedCandidate(candidate);
    const current = accessFromEmployee({ adminAccess: candidate.adminAccess, adminPermissions: candidate.adminPermissions });
    const suggested = current !== "none" && current !== "custom"
      ? current
      : candidate.type === "Sales"
        ? "sales"
        : candidate.type === "Instructor"
          ? "instructor"
          : "support";
    setGrantProfile(suggested);
    setGrantDepartment(candidate.department || (candidate.type === "Sales" ? "sales" : candidate.type === "Instructor" ? "instruction" : "operations"));
    setAccessNote(candidate.adminAccessNote || "");
  };

  const grant = async () => {
    if (!selectedCandidate) return;
    setSaving(true);
    setError("");
    try {
      await api.post("/admin/grant-access", {
        sourceType: selectedCandidate.sourceType,
        sourceId: selectedCandidate.sourceId,
        accessProfile: grantProfile,
        department: grantDepartment,
        accessNote,
        tempPassword: selectedCandidate.hasLogin ? undefined : tempPassword,
      });
      setAccessOpen(false);
      setSelectedCandidate(null);
      setCandidateSearch("");
      setCandidateScope("all");
      setTempPassword("");
      setAccessNote("");
      setGrantProfile("sales");
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Could not update admin access.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="employee-page mx-auto w-full max-w-[1500px] pb-6">
      <header className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600">People &amp; Permissions</p>
          <h1 className="mt-1.5 text-[28px] font-bold tracking-[-0.02em] text-slate-900">Employee Management</h1>
          <p className="mt-1.5 text-[13px] text-slate-500">Manage employees, assign them to courses, and control access across the platform.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={openAdminAccess}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-blue-200 bg-[#f4f8ff] px-5 text-[13px] font-semibold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
          >
            <KeyRound size={17} /> Add Admin Access
          </button>
          <button
            onClick={openAddEmployee}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(37,99,235,0.16)] transition hover:bg-blue-700"
          >
            <Plus size={18} /> Add Employee
          </button>
        </div>
      </header>

      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Employees"
          value={stats.total}
          Icon={Users}
          iconClass="bg-[#e9f5ff] text-blue-600"
          detail="Live"
          detailClass="text-emerald-600"
          footer="from current records"
        />
        <StatCard
          label="Active Employees"
          value={stats.active}
          Icon={BadgeCheck}
          iconClass="bg-[#e8fbf1] text-emerald-600"
          detail="Live"
          detailClass="text-emerald-600"
          footer="currently active"
        />
        <StatCard
          label="Admins"
          value={stats.withAccess}
          Icon={UserRound}
          iconClass="bg-[#f1eaff] text-violet-600"
          detail="Live"
          detailClass="text-emerald-600"
          footer="access granted"
        />
        <StatCard
          label="Inactive Employees"
          value={stats.inactive}
          Icon={Clock3}
          iconClass="bg-[#fff3df] text-orange-500"
          detail={stats.inactive === 0 ? "No inactive users" : `${stats.inactive} inactive`}
          detailClass={stats.inactive === 0 ? "text-slate-500" : "text-orange-500"}
          footer="from current records"
        />
      </section>

      <section className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.035)]">
        <div className="border-b border-slate-200 bg-white">
          <div
            className="grid w-full items-center gap-2 p-2.5"
            style={{ gridTemplateColumns: "minmax(240px, 1fr) 112px 142px 112px 104px" }}
          >
            <div className="employee-search flex h-10 items-center rounded-[10px] border border-slate-200 bg-white px-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
              <Search size={18} className="mr-2.5 shrink-0 text-slate-500" />
              <input
                aria-label="Search employees"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by employee name, email or ID..."
                className="h-full min-w-0 flex-1 bg-transparent text-[13px] font-medium text-slate-800 outline-none placeholder:font-normal placeholder:text-slate-400"
              />
            </div>
            <FilterSelect value={role} onChange={setRole} options={[["", "All Roles"], ...ROLE_OPTIONS]} />
            <FilterSelect value={department} onChange={setDepartment} options={DEPARTMENT_OPTIONS} />
            <FilterSelect value={status} onChange={setStatus} options={[["", "All Status"], ["active", "Active"], ["inactive", "Inactive"]]} />
            <button
              type="button"
              onClick={load}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[10px] border border-slate-200 bg-white px-2.5 text-[12px] font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition hover:border-slate-300 hover:bg-slate-50"
            >
              <RefreshCw size={17} /> Refresh
            </button>
          </div>
        </div>

        <div className="w-full overflow-x-auto" tabIndex={0} role="region" aria-label="Employee records">
          <table className="w-full min-w-[950px] table-fixed border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-[#f7faff] text-[11px] font-bold uppercase tracking-[0.04em] text-slate-500">
                <th className="w-[20%] px-4 py-3">Employee</th>
                <th className="w-[12%] px-2.5 py-3">Employee ID</th>
                <th className="w-[11%] px-2.5 py-3">Role</th>
                <th className="w-[19%] px-2.5 py-3">Course Assigned</th>
                <th className="w-[17%] px-2.5 py-3">Admin Access</th>
                <th className="w-[10%] px-2.5 py-3">Status</th>
                <th className="w-[11%] px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentEmployees.map((employee) => (
                <tr key={employee.id} className="group transition hover:bg-[#fbfdff]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-blue-100 text-[13px] font-bold text-blue-600">
                        {employee.avatar ? <img src={employee.avatar} alt="" className="h-full w-full object-cover" /> : employee.name?.slice(0, 1)?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-slate-800">{employee.name}</p>
                        <p className="mt-0.5 max-w-[180px] truncate text-[11px] text-slate-400">{employee.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-2.5 py-3 text-[11px] font-semibold text-slate-600">{employee.employeeId || "—"}</td>
                  <td className="px-2.5 py-3 text-[11px] capitalize text-slate-600">{String(employee.employeeRole || "employee").replaceAll("_", " ")}</td>
                  <td className="px-2.5 py-3">
                    <div className="flex items-center gap-1.5 whitespace-nowrap text-[11px] text-slate-600">
                      <BookOpen size={16} className={(employee.assignedCourses || []).length ? "text-blue-500" : "text-slate-400"} />
                      {(employee.assignedCourses || []).length ? `${employee.assignedCourses.length} Course${employee.assignedCourses.length > 1 ? "s" : ""}` : "No course assigned"}
                    </div>
                  </td>
                  <td className="px-2.5 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-semibold ${accessBadgeClass(employee)}`}>{accessLabel(employee)}</span>
                  </td>
                  <td className="px-2.5 py-3">
                    <button
                      onClick={() => toggleStatus(employee)}
                      className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${employee.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}
                    >
                      {employee.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button title="Edit employee" onClick={() => setEditEmployee(employee)} className="rounded-lg p-1.5 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"><Pencil size={17} /></button>
                      <button title="Remove employee" onClick={() => removeEmployee(employee)} className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50"><Trash2 size={17} /></button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && !employees.length && (
                <tr><td colSpan="7" className="px-5 py-16 text-center text-sm text-slate-400">No employees found.</td></tr>
              )}
              {loading && (
                <tr><td colSpan="7" className="px-5 py-16 text-center text-sm text-slate-400">Loading employees...</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-slate-500">
            {employees.length
              ? `Showing ${(Math.min(page, totalPages) - 1) * rowsPerPage + 1} to ${Math.min(Math.min(page, totalPages) * rowsPerPage, employees.length)} of ${employees.length} employees`
              : "Showing 0 employees"}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-lg text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Previous page"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).slice(Math.max(0, page - 3), Math.max(0, page - 3) + 5).map((number) => (
              <button
                type="button"
                key={number}
                onClick={() => setPage(number)}
                className={`grid h-10 min-w-10 place-items-center rounded-xl px-3 text-[13px] font-semibold transition ${number === page ? "bg-blue-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                {number}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-lg text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {addOpen && (
        <Modal onClose={() => setAddOpen(false)} maxWidth="max-w-[1200px]">
          <AddEmployeeForm
            form={form}
            setForm={setForm}
            courses={courses}
            saving={saving}
            onSubmit={createEmployee}
            onCancel={() => setAddOpen(false)}
          />
        </Modal>
      )}

      {editEmployee && (
        <Modal onClose={() => setEditEmployee(null)} maxWidth="max-w-[1050px]">
          <EditEmployee employee={editEmployee} courses={courses} saving={saving} onSave={updateEmployee} onClose={() => setEditEmployee(null)} />
        </Modal>
      )}

      {accessOpen && (
        <Modal onClose={() => setAccessOpen(false)} maxWidth="max-w-[760px]">
          <div className="employee-access">
            <ModalHeading icon={KeyRound} title="Add Admin Access" subtitle="Choose a team member and set the tools they can access." onClose={() => setAccessOpen(false)} />

            <div className="access-steps" aria-label="Access setup progress"><span className={!selectedCandidate ? "is-current" : "is-complete"}><b>{selectedCandidate ? <Check size={13} /> : "1"}</b> Find employee</span><i /><span className={selectedCandidate ? "is-current" : ""}><b>2</b> Configure access</span></div>
            <section className="access-find"><div className="access-section-title"><h3>Find your team member</h3><span>01</span></div><p>Search by name, employee ID, email, or promo code.</p>
              <div className="access-search-row"><label className="access-scope"><span>Department</span><AccessSearchScopeSelect value={candidateScope} onChange={(value) => { setCandidateScope(value); setSelectedCandidate(null); }} /></label><label className="access-query"><span>Search employee</span><div className="employee-search"><Search size={18} /><input autoFocus value={candidateSearch} onChange={(e) => { setCandidateSearch(e.target.value); setSelectedCandidate(null); }} placeholder="Name, email, employee ID…" />{candidateSearch && <button type="button" aria-label="Clear employee search" onClick={() => { setCandidateSearch(""); setSelectedCandidate(null); }}><X size={16} /></button>}</div></label></div>
            </section>
            {!selectedCandidate && !candidateSearch && <div className="access-empty"><span><Users size={25} /></span><h3>Start with a team member</h3><p>Search above, then select a result to review<br /> their profile and choose an access role.</p></div>}

            {!selectedCandidate && candidateSearch && (
              <div className="access-results mt-2 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                {filteredCandidates.map((candidate) => (
                  <button key={`${candidate.sourceType}-${candidate.sourceId}`} type="button" onClick={() => chooseCandidate(candidate)} className="flex w-full items-center justify-between border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-blue-50/40">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={candidate.name} />
                      <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{candidate.name}</p><p className="truncate text-xs text-slate-500">{candidate.email || "No email"}{candidate.employeeId ? ` · ${candidate.employeeId}` : ""}</p></div>
                    </div>
                    <div className="ml-3 flex shrink-0 items-center gap-2">
                      {candidate.department && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold capitalize text-slate-600">{candidate.department}</span>}
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">{candidate.type}</span>
                    </div>
                  </button>
                ))}
                {!filteredCandidates.length && <p className="p-5 text-center text-sm text-slate-400">No matching person found for this filter.</p>}
              </div>
            )}

            {selectedCandidate && (
              <>
                <div className="access-selected mt-5 rounded-2xl border border-blue-100 bg-[#f8fbff] p-4">
                  <div className="flex items-center gap-4">
                    <Avatar name={selectedCandidate.name} large />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold text-slate-900">{selectedCandidate.name}</p>
                      <p className="truncate text-xs text-slate-500">{selectedCandidate.email || "No email"}</p>
                      <p className="mt-1 text-xs font-medium text-slate-500">{selectedCandidate.employeeId || "No employee ID"}</p>
                    </div>
                    <div className="text-right">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Active</span>
                      <p className="mt-3 text-xs text-slate-500">Current Role: <span className="font-semibold text-slate-700">{selectedCandidate.type}</span></p>
                    </div>
                  </div>
                </div>

                <section className="access-configure"><div className="access-section-title"><h3>Choose an access role</h3><span>02</span></div><p>Select the permissions that match this person’s responsibilities.</p><fieldset className="access-role-grid"><legend className="access-visually-hidden">Admin access role</legend>{ACCESS_OPTIONS.map(({ value, label, description, Icon, iconClass }) => <label className={`access-role-card ${grantProfile === value ? "is-selected" : ""}`} key={value}><input type="radio" name="grant-access-role" value={value} checked={grantProfile === value} onChange={() => setGrantProfile(value)} /><span className="access-role-icon"><Icon size={19} className={iconClass} /></span><span className="access-role-copy"><strong>{label}</strong><small>{description}</small></span><span className="access-role-check">{grantProfile === value && <Check size={12} />}</span></label>)}</fieldset><div className="access-department"><LabeledSelect label="Department" value={grantDepartment} onChange={setGrantDepartment} options={DEPARTMENT_OPTIONS.slice(1)} icon={Building2} tall /></div></section>

                {!selectedCandidate.hasLogin && grantProfile !== "none" && (
                  <div className="mt-5">
                    <Field label="Temporary Login Password" type="password" value={tempPassword} onChange={setTempPassword} placeholder="Minimum 6 characters" icon={LockKeyhole} tall />
                  </div>
                )}

                <div className="mt-5">
                  <label className="mb-2 block text-[13px] font-semibold text-slate-800">Access Note <span className="font-normal text-slate-400">(Optional)</span></label>
                  <textarea value={accessNote} onChange={(e) => setAccessNote(e.target.value)} placeholder="Add a note about this access..." rows={3} className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                </div>

                <div className="access-footer mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setAccessOpen(false)} className="h-11 rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
                  <button type="button" disabled={saving || (!selectedCandidate.hasLogin && grantProfile !== "none" && tempPassword.length < 6)} onClick={grant} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                    <KeyRound size={17} /> {saving ? "Saving..." : grantProfile === "none" ? "Remove Access" : "Grant Access"}
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function AddEmployeeForm({ form, setForm, courses, saving, onSubmit, onCancel }) {
  const [showPassword, setShowPassword] = useState(false);
  const changeRole = (employeeRole) => {
    const next = { ...form, employeeRole };
    if (employeeRole === "sales") next.department = "sales";
    if (employeeRole === "instructor") next.department = "instruction";
    if (employeeRole !== "sales") next.promoCodes = form.promoCodes?.length ? form.promoCodes : [makePromo()];
    setForm(next);
  };

  return (
    <form onSubmit={onSubmit} className="p-8">
      <ModalHeading icon={Users} title="Add Employee" subtitle="Create a new employee and assign access, courses and promo codes." onClose={onCancel} />

      <div className="mt-8 grid gap-x-6 gap-y-5 md:grid-cols-2">
        <Field label="Full Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required placeholder="Enter full name" icon={UserRound} tall />
        <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required placeholder="Enter email address" icon={Mail} tall />
        <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="Enter phone number" icon={Phone} tall />
        <PasswordField label="Temporary Password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required placeholder="Enter temporary password" show={showPassword} setShow={setShowPassword} />
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <LabeledSelect label="Role" value={form.employeeRole} onChange={changeRole} options={ROLE_OPTIONS} icon={Users} tall required />
        <LabeledSelect label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} options={DEPARTMENT_OPTIONS.slice(1)} icon={Building2} tall required />
        <div>
          <label className="mb-2 block text-[13px] font-semibold text-slate-800">Admin Access <span className="text-red-500">*</span></label>
          <AccessRoleSelect value={form.accessProfile} onChange={(v) => setForm({ ...form, accessProfile: v })} compact />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-blue-100 bg-[#f8fbff] p-5">
        <div className="mb-4 flex items-center gap-2"><BookOpen size={20} className="text-blue-700" /><h3 className="text-[15px] font-bold text-slate-900">Assigned Courses <span className="font-normal text-slate-500">(Optional)</span></h3></div>
        <CoursePicker courses={courses} selected={form.assignedCourses} onChange={(ids) => setForm({ ...form, assignedCourses: ids })} />
      </div>

      {form.employeeRole === "sales" && (
        <div className="mt-6">
          <PromoCodesEditor rows={form.promoCodes} onChange={(promoCodes) => setForm({ ...form, promoCodes })} />
        </div>
      )}

      <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
        <button type="button" onClick={onCancel} className="h-12 rounded-xl border border-slate-300 bg-white px-7 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
        <button disabled={saving} className="inline-flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-7 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"><Plus size={18} /> {saving ? "Adding..." : "Add Employee"}</button>
      </div>
    </form>
  );
}

function PromoCodesEditor({ rows = [], onChange }) {
  const safeRows = rows.length ? rows : [makePromo()];
  const update = (index, key, value) => {
    const next = safeRows.map((row, i) => i === index ? { ...row, [key]: value } : row);
    onChange(next);
  };
  const add = () => onChange([...safeRows, makePromo()]);
  const remove = (index) => onChange(safeRows.filter((_, i) => i !== index));

  return (
    <section className="overflow-hidden rounded-2xl border border-blue-100 bg-[#f8fbff]">
      <div className="flex flex-col gap-4 border-b border-blue-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Tag size={22} className="mt-0.5 text-blue-600" />
          <div><h3 className="text-[16px] font-bold text-slate-900">Promo Codes</h3><p className="mt-0.5 text-sm text-slate-500">You can create multiple promo codes for this sales person.</p></div>
        </div>
        <button type="button" onClick={add} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"><Plus size={18} /> Add Promo Code</button>
      </div>

      <div className="overflow-x-auto p-4">
        <div className="min-w-[780px] overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid grid-cols-[55px_1.2fr_.8fr_1fr_.7fr_70px] items-center gap-3 bg-slate-50 px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            <span>#</span><span>Promo Code</span><span>Discount %</span><span>Max Discount (₹)</span><span>Status</span><span className="text-center">Actions</span>
          </div>
          {safeRows.map((row, index) => (
            <div key={index} className="grid grid-cols-[55px_1.2fr_.8fr_1fr_.7fr_70px] items-center gap-3 border-t border-slate-100 px-4 py-3">
              <span className="text-sm font-semibold text-slate-600">{index + 1}</span>
              <input value={row.code} onChange={(e) => update(index, "code", e.target.value.toUpperCase().replace(/\s+/g, ""))} required placeholder="SAGAR10" className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold uppercase outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
              <input type="number" min="0" max="100" value={row.discountPercent} onChange={(e) => update(index, "discountPercent", e.target.value)} className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500" />
              <input type="number" min="0" value={row.maxDiscount} onChange={(e) => update(index, "maxDiscount", e.target.value)} className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500" />
              <button type="button" onClick={() => update(index, "isActive", row.isActive === false)} className={`w-fit rounded-full px-4 py-2 text-xs font-semibold ${row.isActive === false ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-700"}`}>{row.isActive === false ? "Inactive" : "Active"}</button>
              <div className="text-center"><button type="button" disabled={safeRows.length === 1} onClick={() => remove(index)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"><Trash2 size={18} /></button></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


function StatCard({ label, value, Icon, iconClass, detail, detailClass, footer }) {
  return (
    <article className="rounded-[16px] border border-slate-200 bg-white p-4 shadow-[0_8px_26px_rgba(15,23,42,0.035)]">
      <div className="flex items-start gap-3">
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${iconClass}`}><Icon size={22} /></div>
        <div className="min-w-0 pt-0.5">
          <p className="text-[12px] font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-[23px] font-bold leading-none text-slate-900">{value}</p>
          <p className={`mt-2.5 text-[11px] font-semibold ${detailClass}`}>↑ {detail}</p>
          <p className="mt-0.5 text-[10px] text-slate-400">{footer}</p>
        </div>
      </div>
    </article>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full appearance-none rounded-[10px] border border-slate-200 bg-white pl-3 pr-8 text-[12px] font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.03)] outline-none transition hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      >
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
    </div>
  );
}

function accessBadgeClass(employee) {
  const type = accessFromEmployee(employee);
  if (type === "sales") return "bg-blue-50 text-blue-600";
  if (type === "full") return "bg-violet-100 text-violet-700";
  if (type === "none") return "bg-slate-100 text-slate-500";
  if (type === "instructor") return "bg-cyan-50 text-cyan-700";
  if (type === "support") return "bg-amber-50 text-amber-700";
  if (type === "operations") return "bg-indigo-50 text-indigo-700";
  if (type === "management") return "bg-purple-50 text-purple-700";
  return "bg-slate-100 text-slate-600";
}

function AccessSearchScopeSelect({ value, onChange }) {
  return <div className="access-scope-control"><select aria-label="Filter employees by department" value={value} onChange={event => onChange(event.target.value)}>{ACCESS_SEARCH_OPTIONS.map(([optionValue, label]) => <option key={optionValue} value={optionValue}>{label}</option>)}</select><ChevronDown size={16} aria-hidden="true" /></div>;
}

function AccessRoleSelect({ value, onChange, compact = false }) {
  const [open, setOpen] = useState(false);
  const selected = ACCESS_OPTIONS.find((item) => item.value === value) || ACCESS_OPTIONS[0];
  const SelectedIcon = selected.Icon;
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} className={`flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-4 text-left outline-none transition hover:border-blue-400 ${compact ? "h-12" : "h-12"}`}>
        <span className="flex min-w-0 items-center gap-3"><SelectedIcon size={19} className={selected.iconClass} /><span className="truncate text-sm font-medium text-slate-700">{selected.label}</span></span>
        <ChevronDown size={17} className={`shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-[260] w-full min-w-[280px] overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl">
          {ACCESS_OPTIONS.map((item) => {
            const Icon = item.Icon;
            return (
              <button key={item.value} type="button" onClick={() => { onChange(item.value); setOpen(false); }} className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50 ${item.value === value ? "bg-blue-50" : ""}`}>
                <Icon size={19} className={`mt-0.5 shrink-0 ${item.iconClass}`} />
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-900">{item.label}</span><span className="mt-0.5 block text-[11px] text-slate-500">{item.description}</span></span>
                {item.value === value && <Check size={16} className="mt-1 shrink-0 text-blue-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Select({ value, onChange, options, icon: Icon, tall = false }) {
  return (
    <div className="relative">
      {Icon && <Icon size={18} className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-500" />}
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${tall ? "h-12" : "h-10"} w-full appearance-none rounded-xl border border-slate-300 bg-white ${Icon ? "pl-11" : "pl-3"} pr-9 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100`}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
    </div>
  );
}

function LabeledSelect({ label, required, ...props }) {
  return <label className="block"><span className="mb-2 block text-[13px] font-semibold text-slate-800">{label}{required && <span className="text-red-500"> *</span>}</span><Select {...props} /></label>;
}

function Field({ label, type = "text", value, onChange, required, placeholder, icon: Icon, tall = false }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-semibold text-slate-800">{label}{required && <span className="text-red-500"> *</span>}</span>
      <div className="relative">
        {Icon && <div className="absolute inset-y-0 left-0 grid w-12 place-items-center border-r border-slate-200 text-slate-500"><Icon size={18} /></div>}
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} className={`${tall ? "h-12" : "h-10"} w-full rounded-xl border border-slate-300 ${Icon ? "pl-14" : "px-3"} pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100`} />
      </div>
    </label>
  );
}

function PasswordField({ label, value, onChange, required, placeholder, show, setShow }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-semibold text-slate-800">{label}{required && <span className="text-red-500"> *</span>}</span>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 grid w-12 place-items-center border-r border-slate-200 text-slate-500"><LockKeyhole size={18} /></div>
        <input type={show ? "text" : "password"} minLength={6} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} className="h-12 w-full rounded-xl border border-slate-300 pl-14 pr-12 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        <button type="button" onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
      </div>
    </label>
  );
}

function ModalHeading({ icon: Icon, title, subtitle, onClose }) {
  return (
    <div className="flex items-start gap-4">
      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><Icon size={24} /></div>
      <div className="min-w-0 flex-1"><h2 className="text-[24px] font-bold tracking-tight text-slate-900">{title}</h2>{subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div>
      <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={24} /></button>
    </div>
  );
}

function Modal({ onClose, children, maxWidth = "max-w-[900px]" }) {
  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-[1.5px]">
      <div className={`max-h-[94vh] w-full overflow-y-auto rounded-[22px] bg-white shadow-2xl ${maxWidth}`}>{children}</div>
    </div>
  );
}

function Avatar({ name, large = false }) {
  return <div className={`grid shrink-0 place-items-center rounded-full bg-blue-100 font-bold text-blue-600 ${large ? "h-14 w-14 text-xl" : "h-10 w-10 text-sm"}`}>{String(name || "?").slice(0, 1).toUpperCase()}</div>;
}

function CoursePicker({ courses, selected, onChange }) {
  const selectedSet = new Set((selected || []).map((v) => (typeof v === "string" ? v : v?._id)));
  return (
    <div className="grid gap-x-10 gap-y-3 md:grid-cols-2">
      {courses.map((course) => (
        <label key={course._id} className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 text-sm text-slate-700">
          <input type="checkbox" checked={selectedSet.has(course._id)} onChange={(e) => { const next = new Set(selectedSet); e.target.checked ? next.add(course._id) : next.delete(course._id); onChange([...next]); }} className="h-5 w-5 rounded border-slate-300 text-blue-600" />
          {course.title}
        </label>
      ))}
      {!courses.length && <p className="text-sm text-slate-400">No courses found.</p>}
    </div>
  );
}

function EditEmployee({ employee, courses, saving, onSave, onClose }) {
  const existingPromos = employee.salesPerson?.promoCodes?.length
    ? employee.salesPerson.promoCodes.map((p) => ({ code: p.code, discountPercent: String(p.discountPercent ?? 10), maxDiscount: String(p.maxDiscount ?? 500), isActive: p.isActive !== false }))
    : employee.salesPerson?.promoCode
      ? [{ code: employee.salesPerson.promoCode, discountPercent: String(employee.salesPerson.discountPercent ?? 10), maxDiscount: String(employee.salesPerson.maxDiscount ?? 500), isActive: employee.salesPerson.isActive !== false }]
      : [makePromo()];

  const [form, setForm] = useState({
    name: employee.name,
    phone: employee.phone || "",
    department: employee.department || "",
    employeeRole: employee.employeeRole || "support",
    assignedCourses: (employee.assignedCourses || []).map((c) => c._id || c),
    accessProfile: accessFromEmployee(employee),
    promoCodes: existingPromos,
  });

  const save = () => {
    const promoCodes = cleanPromoCodes(form.promoCodes);
    onSave({
      ...form,
      promoCodes,
      promoCode: promoCodes[0]?.code,
      discountPercent: promoCodes[0]?.discountPercent,
      maxDiscount: promoCodes[0]?.maxDiscount,
      accessProfile: form.accessProfile === "custom" ? undefined : form.accessProfile,
    });
  };

  return (
    <div className="p-7">
      <ModalHeading icon={Pencil} title={`Manage ${employee.name}`} subtitle={`${employee.employeeId || "Employee"} · ${employee.email}`} onClose={onClose} />
      <div className="mt-7 grid gap-4 md:grid-cols-2">
        <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} icon={UserRound} tall />
        <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} icon={Phone} tall />
        <LabeledSelect label="Role" value={form.employeeRole} onChange={(v) => setForm({ ...form, employeeRole: v })} options={ROLE_OPTIONS} icon={Users} tall />
        <LabeledSelect label="Department" value={form.department} onChange={(v) => setForm({ ...form, department: v })} options={DEPARTMENT_OPTIONS.slice(1)} icon={Building2} tall />
      </div>
      <div className="mt-5"><label className="mb-2 block text-[13px] font-semibold text-slate-800">Admin Access</label><AccessRoleSelect value={form.accessProfile === "custom" ? "none" : form.accessProfile} onChange={(v) => setForm({ ...form, accessProfile: v })} /></div>
      <div className="mt-5 rounded-2xl border border-blue-100 bg-[#f8fbff] p-5"><div className="mb-4 flex items-center gap-2"><BookOpen size={19} className="text-blue-600" /><h3 className="font-bold text-slate-900">Assigned Courses</h3></div><CoursePicker courses={courses} selected={form.assignedCourses} onChange={(ids) => setForm({ ...form, assignedCourses: ids })} /></div>
      {form.employeeRole === "sales" && <div className="mt-5"><PromoCodesEditor rows={form.promoCodes} onChange={(promoCodes) => setForm({ ...form, promoCodes })} /></div>}
      <div className="mt-7 flex justify-end gap-3"><button type="button" onClick={onClose} className="h-11 rounded-xl border border-slate-300 px-6 text-sm font-semibold text-slate-700">Cancel</button><button disabled={saving} onClick={save} className="h-11 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save Changes"}</button></div>
    </div>
  );
}
