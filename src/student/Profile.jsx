import React, { useEffect, useState } from "react";
import {
    Mail,
    Phone,
    MapPin,
    CalendarDays,
    GraduationCap,
    Edit3,
    X,
    Save,
    Camera,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";

const FALLBACK_IMAGE = "/student-profile.jpg";

// Backend static uploads (e.g. /uploads/abc.jpg) are served from the
// API server's root, not under /api - so build the right absolute URL.
const BACKEND_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(
    /\/api\/?$/,
    ""
);

function resolveImage(avatar) {
    if (!avatar) return FALLBACK_IMAGE;
    if (avatar.startsWith("http") || avatar.startsWith("data:")) return avatar;
    return `${BACKEND_ORIGIN}${avatar}`;
}

function formatJoined(dateString) {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });
}

export default function Profile() {
    const { user, updateUserInContext } = useAuth();

    const [profile, setProfile] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        location: user?.location || "",
        joined: formatJoined(user?.createdAt),
        course: "Loading...",
        image: resolveImage(user?.avatar),
    });
    const [draft, setDraft] = useState(profile);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [uploadedFile, setUploadedFile] = useState(null);

    /* =========================================================
       LOAD CURRENT COURSE FROM REAL ENROLLMENTS
    ========================================================= */
    useEffect(() => {
        let cancelled = false;
        async function loadEnrollment() {
            try {
                const { data } = await api.get("/enrollments/me");
                if (cancelled) return;
                const first = data.enrollments?.[0];
                setProfile((current) => ({
                    ...current,
                    course: first?.course?.title || "Not enrolled yet",
                }));
            } catch {
                if (!cancelled) {
                    setProfile((current) => ({ ...current, course: "Not enrolled yet" }));
                }
            }
        }
        loadEnrollment();
        return () => {
            cancelled = true;
        };
    }, []);

    /* =========================================================
       OPEN / CLOSE EDIT
    ========================================================= */
    const openEdit = () => {
        setDraft(profile);
        setUploadedFile(null);
        setError("");
        setEditing(true);
    };

    const closeEdit = () => {
        setDraft(profile);
        setUploadedFile(null);
        setEditing(false);
    };

    /* =========================================================
       SAVE PROFILE — sends name/phone/location to the backend,
       uploads a new photo first (if picked) and saves its URL.
    ========================================================= */
    const saveProfile = async () => {
        setSaving(true);
        setError("");
        try {
            let avatarUrl = user?.avatar || "";

            if (uploadedFile) {
                const formData = new FormData();
                formData.append("file", uploadedFile);
                const { data } = await api.post("/uploads", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                avatarUrl = data.file.url;
            }

            const { data } = await api.patch("/users/me", {
                name: draft.name.trim(),
                phone: draft.phone.trim(),
                location: draft.location.trim(),
                avatar: avatarUrl,
            });

            updateUserInContext(data.user);

            setProfile((current) => ({
                ...current,
                name: data.user.name,
                phone: data.user.phone || "",
                location: data.user.location || "",
                image: resolveImage(data.user.avatar),
            }));

            setEditing(false);
        } catch (err) {
            setError(err.response?.data?.message || "Could not save your profile.");
        } finally {
            setSaving(false);
        }
    };

    /* =========================================================
       PICK A NEW PHOTO (preview only until Save is pressed)
    ========================================================= */
    const handleImage = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadedFile(file);

        const reader = new FileReader();
        reader.onload = () => {
            setDraft((current) => ({ ...current, image: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="min-h-screen bg-[#f7f9ff]">
            <main className="mx-auto w-full max-w-[1350px] px-6 pb-14 pt-8 lg:px-8">

                {/* =====================================================
            PAGE HEADING
        ===================================================== */}
                <section className="mb-7">
                    <h1 className="text-[28px] font-bold tracking-[-0.4px] text-[#101936]">
                        My Profile
                    </h1>

                    <p className="mt-2 text-[12px] text-[#7c879b]">
                        View and manage your personal information.
                    </p>
                </section>

                {/* =====================================================
            PROFILE CARD
        ===================================================== */}
                <section className="overflow-hidden rounded-[22px] border border-[#e5eaf2] bg-white shadow-[0_5px_22px_rgba(15,23,42,.04)]">

                    {/* BLUE HEADER */}
                    <div className="relative h-[165px] bg-gradient-to-r from-[#1766df] via-[#1672e8] to-[#3569e8]">
                        <div className="absolute -right-12 -top-20 h-[250px] w-[250px] rounded-full bg-white/5" />

                        <div className="absolute -bottom-24 right-[24%] h-[220px] w-[220px] rounded-full bg-white/5" />
                    </div>

                    {/* =================================================
              PROFILE DETAILS
          ================================================= */}
                    <div className="relative px-7 pb-9 md:px-9">

                        {/* PROFILE TOP */}
                        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">

                            {/* IMAGE + NAME */}
                            <div className="flex items-end gap-5">

                                {/* PROFILE IMAGE */}
                                <div className="-mt-[58px] shrink-0">
                                    <div className="rounded-full bg-white p-[6px] shadow-[0_8px_24px_rgba(15,23,42,.18)]">
                                        <img
                                            src={profile.image}
                                            alt={profile.name}
                                            onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                                            className="h-[118px] w-[118px] rounded-full bg-[#eef2f7] object-cover"
                                        />
                                    </div>
                                </div>

                                {/* NAME */}
                                <div className="pb-3 pt-5">
                                    <h2 className="text-[24px] font-bold text-[#101936]">
                                        {profile.name}
                                    </h2>

                                    <p className="mt-1 text-[12px] text-[#7c879b]">
                                        Rathi Academy Student
                                    </p>
                                </div>
                            </div>

                            {/* EDIT BUTTON */}
                            <button
                                onClick={openEdit}
                                className="mb-2 flex h-11 items-center justify-center gap-2 rounded-[10px] bg-[#2563eb] px-5 text-[12px] font-semibold text-white transition hover:bg-[#1d55ca]"
                            >
                                <Edit3 size={16} />
                                Edit Profile
                            </button>
                        </div>

                        {/* =================================================
                INFORMATION
            ================================================= */}
                        <div className="mt-10 grid gap-5 md:grid-cols-2">

                            <ProfileInfo
                                icon={Mail}
                                label="Email"
                                value={profile.email}
                            />

                            <ProfileInfo
                                icon={Phone}
                                label="Phone"
                                value={profile.phone || "Not added yet"}
                            />

                            <ProfileInfo
                                icon={MapPin}
                                label="Location"
                                value={profile.location || "Not added yet"}
                            />

                            <ProfileInfo
                                icon={CalendarDays}
                                label="Joined"
                                value={profile.joined}
                            />

                            <ProfileInfo
                                icon={GraduationCap}
                                label="Current Course"
                                value={profile.course}
                            />
                        </div>
                    </div>
                </section>
            </main>

            {/* =====================================================
          EDIT PROFILE MODAL
      ===================================================== */}
            {editing && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0f172a]/45 p-4 backdrop-blur-[2px]">

                    <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto w-full max-w-[600px] rounded-[22px] bg-white p-6 shadow-[0_25px_70px_rgba(15,23,42,.25)]">

                        {/* MODAL HEADER */}
                        <div className="flex items-center justify-between">

                            <div>
                                <h2 className="text-[22px] font-bold text-[#101936]">
                                    Edit Profile
                                </h2>

                                <p className="mt-1 text-[11px] text-[#8a94a8]">
                                    Update your personal information.
                                </p>
                            </div>

                            <button
                                onClick={closeEdit}
                                className="grid h-9 w-9 place-items-center rounded-full bg-[#f5f7fb] text-[#667085] transition hover:bg-[#eef1f6]"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* =================================================
                PHOTO SECTION
            ================================================= */}
                        <div className="mt-6 flex items-center gap-4">

                            <div className="rounded-full bg-white p-[4px] shadow-md">
                                <img
                                    src={draft.image}
                                    alt="Profile preview"
                                    onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                                    className="h-[82px] w-[82px] rounded-full bg-[#eef2f7] object-cover"
                                />
                            </div>

                            <div>
                                <p className="mb-2 text-[11px] font-semibold text-[#344054]">
                                    Profile Photo
                                </p>

                                <label className="flex cursor-pointer items-center gap-2 rounded-[9px] border border-[#dce2ec] bg-white px-4 py-2 text-[11px] font-semibold text-[#445168] transition hover:bg-[#f8faff]">
                                    <Camera size={15} />

                                    Change Photo

                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImage}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                        </div>

                        {/* =================================================
                FORM
            ================================================= */}
                        <div className="mt-7 grid gap-4 md:grid-cols-2">

                            <Field
                                label="Full Name"
                                value={draft.name}
                                onChange={(value) =>
                                    setDraft((current) => ({
                                        ...current,
                                        name: value,
                                    }))
                                }
                            />

                            <Field
                                label="Email"
                                type="email"
                                value={draft.email}
                                disabled
                            />

                            <Field
                                label="Phone"
                                value={draft.phone}
                                onChange={(value) =>
                                    setDraft((current) => ({
                                        ...current,
                                        phone: value,
                                    }))
                                }
                            />

                            <Field
                                label="Location"
                                value={draft.location}
                                onChange={(value) =>
                                    setDraft((current) => ({
                                        ...current,
                                        location: value,
                                    }))
                                }
                            />
                        </div>

                        {error && (
                            <p className="mt-4 text-[12px] font-medium text-red-600">{error}</p>
                        )}

                        {/* =================================================
                ACTION BUTTONS
            ================================================= */}
                        <div className="mt-7 flex justify-end gap-3 border-t border-[#edf0f5] pt-5">

                            <button
                                onClick={closeEdit}
                                className="h-10 rounded-[9px] border border-[#dfe4ec] px-5 text-[11px] font-semibold text-[#536078] transition hover:bg-[#f8faff]"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={saveProfile}
                                disabled={saving}
                                className="flex h-10 items-center gap-2 rounded-[9px] bg-[#2563eb] px-5 text-[11px] font-semibold text-white transition hover:bg-[#1d55ca] disabled:opacity-60"
                            >
                                <Save size={15} />

                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* =========================================================
   PROFILE INFORMATION CARD
========================================================= */

function ProfileInfo({
    icon: Icon,
    label,
    value,
}) {
    return (
        <div className="flex min-h-[88px] items-center gap-4 rounded-[14px] border border-[#edf0f5] bg-[#fafbfe] px-5 py-4">

            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eef5ff] text-[#2563eb]">
                <Icon size={18} />
            </div>

            <div className="min-w-0">
                <p className="text-[10px] text-[#8a94a8]">
                    {label}
                </p>

                <p className="mt-1 break-words text-[12px] font-semibold text-[#354158]">
                    {value}
                </p>
            </div>
        </div>
    );
}

/* =========================================================
   EDIT FIELD
========================================================= */

function Field({
    label,
    value,
    onChange,
    type = "text",
    disabled = false,
}) {
    return (
        <label className="block">

            <span className="text-[11px] font-semibold text-[#344054]">
                {label}
            </span>

            <input
                type={type}
                value={value}
                disabled={disabled}
                onChange={(event) =>
                    onChange && onChange(event.target.value)
                }
                className="mt-2 h-11 w-full rounded-[10px] border border-[#dfe5ee] bg-white px-3 text-[12px] text-[#344054] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100 disabled:bg-[#f5f7fb] disabled:text-[#8a94a8]"
            />
        </label>
    );
}
