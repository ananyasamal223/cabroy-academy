import { useMemo, useState } from "react";
import { Camera, Edit3, Mail, MapPin, Phone, Save, ShieldCheck, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";

const BACKEND_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(
  /\/api\/?$/,
  ""
);

function resolveAvatar(avatar) {
  if (!avatar) return "/admin-profile.jpg";
  if (avatar.startsWith("http") || avatar.startsWith("data:")) return avatar;
  return `${BACKEND_ORIGIN}${avatar}`;
}

export default function AdminProfile() {
  const { user, updateUserInContext } = useAuth();
  const initial = useMemo(
    () => ({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      location: user?.location || "",
      avatar: user?.avatar || "",
      preview: resolveAvatar(user?.avatar),
    }),
    [user]
  );

  const [draft, setDraft] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const startEdit = () => {
    setDraft(initial);
    setFile(null);
    setError("");
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(initial);
    setFile(null);
    setError("");
    setEditing(false);
  };

  const pickImage = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    const reader = new FileReader();
    reader.onload = () => setDraft((current) => ({ ...current, preview: reader.result }));
    reader.readAsDataURL(selected);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      let avatar = draft.avatar;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const { data: upload } = await api.post("/uploads", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        avatar = upload.file.url;
      }

      const { data } = await api.patch("/users/me", {
        name: draft.name.trim(),
        phone: draft.phone.trim(),
        location: draft.location.trim(),
        avatar,
      });
      updateUserInContext(data.user);
      setEditing(false);
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save the admin profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1180px]">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2563eb]">Account</p>
          <h1 className="mt-1 text-[26px] font-bold text-[#172033]">My Profile</h1>
          <p className="mt-1 text-[12px] text-[#7b879c]">Manage your administrator profile information.</p>
        </div>
        {!editing && (
          <button
            onClick={startEdit}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#2563eb] px-4 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8]"
          >
            <Edit3 size={15} /> Edit Profile
          </button>
        )}
      </div>

      <section className="overflow-hidden rounded-[22px] border border-[#e6eaf1] bg-white shadow-[0_6px_24px_rgba(15,23,42,.04)]">
        <div className="bg-gradient-to-r from-[#eff5ff] via-[#f6f8ff] to-white px-6 py-7 md:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative shrink-0">
              <img
                src={editing ? draft.preview : resolveAvatar(user?.avatar)}
                alt={user?.name || "Admin"}
                className="h-[96px] w-[96px] rounded-full border-4 border-white bg-[#eef2f7] object-cover shadow-md"
                onError={(event) => {
                  event.currentTarget.src = "/admin-profile.jpg";
                }}
              />
              {editing && (
                <label className="absolute bottom-0 right-0 grid h-9 w-9 cursor-pointer place-items-center rounded-full border-2 border-white bg-[#2563eb] text-white shadow-md">
                  <Camera size={15} />
                  <input type="file" accept="image/*" onChange={pickImage} className="hidden" />
                </label>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-[23px] font-bold text-[#172033]">{user?.name || "Rathi Admin"}</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf2ff] px-2.5 py-1 text-[10px] font-bold text-[#2563eb]">
                  <ShieldCheck size={12} /> Administrator
                </span>
              </div>
              <p className="mt-1 text-[12px] text-[#7b879c]">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2 md:p-8">
          <Field
            icon={Mail}
            label="Email Address"
            value={draft.email}
            disabled
          />
          <Field
            icon={Phone}
            label="Phone Number"
            value={editing ? draft.phone : user?.phone || "Not added"}
            editing={editing}
            onChange={(value) => setDraft((current) => ({ ...current, phone: value }))}
            placeholder="Enter phone number"
          />
          <Field
            icon={MapPin}
            label="Location"
            value={editing ? draft.location : user?.location || "Not added"}
            editing={editing}
            onChange={(value) => setDraft((current) => ({ ...current, location: value }))}
            placeholder="Enter location"
          />
          <Field
            icon={ShieldCheck}
            label="Account Role"
            value="Administrator"
            disabled
          />
          {editing && (
            <div className="md:col-span-2">
              <label className="mb-2 block text-[11px] font-semibold text-[#536078]">Full Name</label>
              <input
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                className="h-11 w-full rounded-[10px] border border-[#dfe5ee] px-4 text-[12px] outline-none focus:border-[#2563eb]"
              />
            </div>
          )}
        </div>

        {editing && (
          <div className="flex flex-col gap-3 border-t border-[#edf0f5] px-6 py-5 sm:flex-row sm:items-center sm:justify-between md:px-8">
            <p className="text-[11px] font-medium text-red-600">{error}</p>
            <div className="flex gap-2">
              <button
                onClick={cancelEdit}
                className="inline-flex h-10 items-center gap-2 rounded-[9px] border border-[#dfe5ee] px-4 text-[11px] font-semibold text-[#536078]"
              >
                <X size={14} /> Cancel
              </button>
              <button
                onClick={save}
                disabled={saving || !draft.name.trim()}
                className="inline-flex h-10 items-center gap-2 rounded-[9px] bg-[#2563eb] px-4 text-[11px] font-semibold text-white disabled:opacity-50"
              >
                <Save size={14} /> {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ icon: Icon, label, value, editing, onChange, placeholder, disabled }) {
  return (
    <div>
      <label className="mb-2 block text-[11px] font-semibold text-[#536078]">{label}</label>
      {editing && !disabled ? (
        <div className="relative">
          <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a94a8]" />
          <input
            value={value === "Not added" ? "" : value || ""}
            onChange={(event) => onChange?.(event.target.value)}
            placeholder={placeholder}
            className="h-11 w-full rounded-[10px] border border-[#dfe5ee] pl-10 pr-4 text-[12px] outline-none focus:border-[#2563eb]"
          />
        </div>
      ) : (
        <div className="flex h-11 items-center gap-3 rounded-[10px] border border-[#edf0f5] bg-[#fafbfe] px-4 text-[12px] font-medium text-[#344054]">
          <Icon size={15} className="text-[#7b879c]" />
          <span className="truncate">{value || "—"}</span>
        </div>
      )}
    </div>
  );
}
