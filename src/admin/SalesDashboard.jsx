import { useEffect, useState } from "react";
import {
  BadgeIndianRupee,
  BarChart3,
  Check,
  Copy,
  Plus,
  ShoppingBag,
  TicketPercent,
  Trash2,
  Users,
  X,
} from "lucide-react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import PersonalSalesDashboard from "./PersonalSalesDashboard";

function formatINR(value) {
  return `₹${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;
}

function formatDate(value) {
  if (!value) return "No sale yet";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  promoCode: "",
  discountPercent: "10",
  maxDiscount: "500",
};

export default function SalesDashboard() {
  const { user } = useAuth();
  const permissions = user?.adminPermissions || [];
  const isPersonalSales = user?.role !== "admin" && permissions.includes("sales") && !permissions.includes("sales_manage");
  return isPersonalSales ? <PersonalSalesDashboard /> : <CompanySalesDashboard />;
}

function CompanySalesDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data: response } = await api.get("/admin/sales");
      setData(response);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load sales dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    api.get("/admin/sales")
      .then(({ data: response }) => {
        if (!cancelled) setData(response);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || "Could not load sales dashboard.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const createSalesPerson = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/admin/sales", {
        ...form,
        promoCode: form.promoCode.trim().toUpperCase(),
        discountPercent: Number(form.discountPercent || 0),
        maxDiscount: Number(form.maxDiscount || 0),
      });
      setForm(emptyForm);
      setShowAdd(false);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not add sales person.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (person) => {
    try {
      await api.patch(`/admin/sales/${person.id}`, { isActive: !person.isActive });
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update sales person.");
    }
  };

  const removeSalesPerson = async (person) => {
    const confirmed = window.confirm(
      `Remove ${person.name} from the sales team? Their promo code will stop working, but past sales history will be preserved.`
    );
    if (!confirmed) return;

    setDeletingId(person.id);
    setError("");
    try {
      await api.delete(`/admin/sales/${person.id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not remove sales person.");
    } finally {
      setDeletingId("");
    }
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      window.setTimeout(() => setCopied(""), 1400);
    } catch {
      setCopied("");
    }
  };

  const summary = data?.summary || {};
  const people = data?.salesPeople || [];
  const purchases = data?.recentPurchases || [];

  const cards = [
    {
      label: "Sales Revenue",
      value: formatINR(summary.totalRevenue),
      icon: BadgeIndianRupee,
      tone: "bg-[#eef4ff] text-[#2563eb]",
    },
    {
      label: "Students via Promo",
      value: Number(summary.totalStudents || 0).toLocaleString("en-IN"),
      icon: Users,
      tone: "bg-[#eafaf4] text-[#16a674]",
    },
    {
      label: "Paid Promo Orders",
      value: Number(summary.totalPaidOrders || 0).toLocaleString("en-IN"),
      icon: ShoppingBag,
      tone: "bg-[#fff5e8] text-[#e59013]",
    },
    {
      label: "Active Sales People",
      value: Number(summary.activeSalesPeople || 0).toLocaleString("en-IN"),
      icon: BarChart3,
      tone: "bg-[#f3eeff] text-[#7c3aed]",
    },
  ];

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2563eb]">Promo attribution</p>
          <h1 className="mt-1 text-[26px] font-bold text-[#172033]">Sales Dashboard</h1>
          <p className="mt-1 max-w-2xl text-[12px] text-[#7b879c]">
            See exactly how many students purchased using each sales team member&apos;s promo code.
            Only successfully paid orders are counted.
          </p>
        </div>
        <button
          onClick={() => {
            setError("");
            setShowAdd(true);
          }}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#2563eb] px-4 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8]"
        >
          <Plus size={16} /> Add Sales Person
        </button>
      </div>

      {error && !showAdd && (
        <div className="mb-5 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[11px] font-medium text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <article key={label} className="rounded-[18px] border border-[#e6eaf1] bg-white p-5 shadow-[0_4px_18px_rgba(15,23,42,.035)]">
            <div className={`grid h-11 w-11 place-items-center rounded-[12px] ${tone}`}>
              <Icon size={20} />
            </div>
            <p className="mt-4 text-[11px] font-medium text-[#667085]">{label}</p>
            <h2 className="mt-1 text-[24px] font-bold text-[#172033]">{loading ? "…" : value}</h2>
          </article>
        ))}
      </section>

      <section className="mt-5 overflow-hidden rounded-[20px] border border-[#e6eaf1] bg-white shadow-[0_4px_20px_rgba(15,23,42,.035)]">
        <div className="flex items-center justify-between px-5 py-5">
          <div>
            <h2 className="text-[17px] font-bold text-[#172033]">Sales Team Promo Performance</h2>
            <p className="mt-1 text-[10px] text-[#8a94a8]">Unique student count, paid orders and revenue by promo code.</p>
          </div>
          <TicketPercent size={20} className="text-[#2563eb]" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse">
            <thead>
              <tr className="bg-[#fafbfe] text-left text-[9px] font-semibold uppercase tracking-wide text-[#778195]">
                <th className="px-5 py-4">Sales Person</th>
                <th className="px-5 py-4">Promo Code</th>
                <th className="px-5 py-4">Offer</th>
                <th className="px-5 py-4">Students Purchased</th>
                <th className="px-5 py-4">Paid Orders</th>
                <th className="px-5 py-4">Courses Sold</th>
                <th className="px-5 py-4">Revenue</th>
                <th className="px-5 py-4">Last Sale</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {!loading && people.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#eef4ff] text-[#2563eb]">
                      <TicketPercent size={21} />
                    </div>
                    <p className="mt-3 text-[12px] font-bold text-[#344054]">No sales promo codes yet</p>
                    <p className="mt-1 text-[10px] text-[#8a94a8]">Add Rahul Sharma or any other sales team member and assign a unique promo code.</p>
                  </td>
                </tr>
              )}
              {people.map((person) => (
                <tr key={person.id} className="border-t border-[#edf0f5] text-[10px] text-[#536078]">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-[#253047]">{person.name}</div>
                    <div className="mt-1 text-[9px] text-[#8a94a8]">{person.email || person.phone || "Sales team"}</div>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => copyCode(person.promoCode)}
                      className="inline-flex items-center gap-2 rounded-[8px] bg-[#eef4ff] px-3 py-2 font-bold tracking-[0.08em] text-[#2563eb]"
                      title="Copy promo code"
                    >
                      {person.promoCode}
                      {copied === person.promoCode ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    {person.discountPercent}% off
                    {Number(person.maxDiscount) > 0 && <div className="mt-1 text-[9px] text-[#8a94a8]">Max {formatINR(person.maxDiscount)}</div>}
                  </td>
                  <td className="px-5 py-4 text-[13px] font-bold text-[#172033]">{person.studentsPurchased}</td>
                  <td className="px-5 py-4 font-semibold text-[#344054]">{person.paidOrders}</td>
                  <td className="px-5 py-4 font-semibold text-[#344054]">{person.coursesSold}</td>
                  <td className="px-5 py-4 font-bold text-emerald-600">{formatINR(person.revenue)}</td>
                  <td className="px-5 py-4 text-[9px]">{formatDate(person.lastSaleAt)}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggleActive(person)}
                      className={`rounded-full px-3 py-1.5 text-[9px] font-bold ${
                        person.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {person.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => removeSalesPerson(person)}
                      disabled={deletingId === person.id}
                      className="inline-flex items-center gap-1.5 rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-[9px] font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      title={`Remove ${person.name}`}
                    >
                      <Trash2 size={13} />
                      {deletingId === person.id ? "Removing..." : "Remove"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-[20px] border border-[#e6eaf1] bg-white shadow-[0_4px_20px_rgba(15,23,42,.035)]">
        <div className="px-5 py-5">
          <h2 className="text-[17px] font-bold text-[#172033]">Recent Promo Purchases</h2>
          <p className="mt-1 text-[10px] text-[#8a94a8]">The latest successful payments attributed to your sales team.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr className="bg-[#fafbfe] text-left text-[9px] font-semibold uppercase tracking-wide text-[#778195]">
                <th className="px-5 py-4">Student</th>
                <th className="px-5 py-4">Sales Person</th>
                <th className="px-5 py-4">Promo Code</th>
                <th className="px-5 py-4">Course</th>
                <th className="px-5 py-4">Discount</th>
                <th className="px-5 py-4">Paid</th>
                <th className="px-5 py-4">Date</th>
              </tr>
            </thead>
            <tbody>
              {!loading && purchases.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-[10px] text-[#8a94a8]">
                    No paid promo-code purchases yet.
                  </td>
                </tr>
              )}
              {purchases.map((item) => (
                <tr key={item.id} className="border-t border-[#edf0f5] text-[10px] text-[#536078]">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-[#344054]">{item.studentName}</div>
                    <div className="mt-1 text-[9px] text-[#8a94a8]">{item.studentEmail}</div>
                  </td>
                  <td className="px-5 py-4 font-semibold text-[#344054]">{item.salesPersonName}</td>
                  <td className="px-5 py-4"><span className="rounded bg-[#eef4ff] px-2 py-1 font-bold text-[#2563eb]">{item.promoCode}</span></td>
                  <td className="max-w-[260px] truncate px-5 py-4">{item.courses.join(", ") || "Course"}</td>
                  <td className="px-5 py-4 text-emerald-600">-{formatINR(item.discount)}</td>
                  <td className="px-5 py-4 font-bold text-[#172033]">{formatINR(item.amount)}</td>
                  <td className="px-5 py-4 text-[9px]">{formatDate(item.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showAdd && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
          <form onSubmit={createSalesPerson} className="w-full max-w-[560px] rounded-[20px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[18px] font-bold text-[#172033]">Add Sales Person</h2>
                <p className="mt-1 text-[10px] text-[#8a94a8]">Give each person a unique promo code so paid purchases can be attributed correctly.</p>
              </div>
              <button type="button" onClick={() => setShowAdd(false)} className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500">
                <X size={15} />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Input label="Sales Person Name" required value={form.name} placeholder="Rahul Sharma" onChange={(value) => setForm((f) => ({ ...f, name: value }))} />
              <Input label="Promo Code" required value={form.promoCode} placeholder="RAHUL10" onChange={(value) => setForm((f) => ({ ...f, promoCode: value.toUpperCase() }))} />
              <Input label="Email (optional)" value={form.email} placeholder="rahul@example.com" onChange={(value) => setForm((f) => ({ ...f, email: value }))} />
              <Input label="Phone (optional)" value={form.phone} placeholder="9876543210" onChange={(value) => setForm((f) => ({ ...f, phone: value }))} />
              <Input label="Discount %" type="number" min="0" max="100" value={form.discountPercent} onChange={(value) => setForm((f) => ({ ...f, discountPercent: value }))} />
              <Input label="Maximum Discount (₹)" type="number" min="0" value={form.maxDiscount} onChange={(value) => setForm((f) => ({ ...f, maxDiscount: value }))} />
            </div>

            {error && <p className="mt-4 rounded-[9px] bg-red-50 px-3 py-2 text-[10px] font-medium text-red-700">{error}</p>}

            <div className="mt-6 flex justify-end gap-2 border-t border-[#edf0f5] pt-5">
              <button type="button" onClick={() => setShowAdd(false)} className="h-10 rounded-[9px] border border-[#dfe5ee] px-4 text-[11px] font-semibold text-[#536078]">Cancel</button>
              <button disabled={saving} className="h-10 rounded-[9px] bg-[#2563eb] px-5 text-[11px] font-semibold text-white disabled:opacity-50">
                {saving ? "Adding..." : "Add Sales Person"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange, placeholder, required, type = "text", min, max }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-semibold text-[#536078]">{label}</span>
      <input
        type={type}
        required={required}
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-[10px] border border-[#dfe5ee] px-3.5 text-[11px] outline-none focus:border-[#2563eb]"
      />
    </label>
  );
}
