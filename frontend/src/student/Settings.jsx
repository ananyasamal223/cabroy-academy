import { useEffect, useState } from "react";
import {
  User,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Mail,
  Smartphone,
  CheckCircle2,
  Save,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user, login } = useAuth();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [activeTab, setActiveTab] =
    useState("account");

  const [showCurrentPassword, setShowCurrentPassword] =
    useState(false);

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [settings, setSettings] = useState({
    emailNotifications: true,
    courseUpdates: true,
    assignmentReminders: true,
    mentorSessionReminders: true,
    communityUpdates: false,
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    api.get("/users/me/settings", { signal: controller.signal }).then(({ data }) => {
      if (!controller.signal.aborted) { setSettings(data.preferences); setAccount(data.account); setError(""); }
    }).catch(err => { if (!controller.signal.aborted) setError(err.response?.data?.message || "Could not load settings. Please try again."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh]);
  const toggle = name => {
    if (loading || saving || error) return;
    setSettings(current => ({ ...current, [name]: !current[name] })); setSaved(false);
  };
  const saveSettings = async () => {
    if (loading || saving || error) return;
    setSaving(true); setSaved(false);
    try { const { data } = await api.patch("/users/me/settings", { preferences: settings }); setSettings(data.preferences); setSaved(true); }
    catch (err) { setError(err.response?.data?.message || "Could not save preferences. Your changes have not been saved."); }
    finally { setSaving(false); }
  };
  const changePassword = async event => {
    event.preventDefault();
    if (passwordBusy) return;
    setPasswordError(""); setPasswordMessage("");
    if (!passwords.current || passwords.next.length < 6 || new TextEncoder().encode(passwords.next).length > 72) { setPasswordError("Enter your current password and a new password of at least 6 characters and no more than 72 bytes."); return; }
    if (passwords.next !== passwords.confirm) { setPasswordError("New passwords do not match."); return; }
    if (passwords.current === passwords.next) { setPasswordError("Choose a different new password."); return; }
    setPasswordBusy(true);
    try {
      const remember = Boolean(localStorage.getItem("rathi-token"));
      const { data } = await api.post("/users/me/password", { currentPassword: passwords.current, newPassword: passwords.next });
      login(data.token, data.user, remember); setPasswords({ current: "", next: "", confirm: "" }); setPasswordMessage(data.message);
    } catch (err) { setPasswordError(err.response?.data?.message || "Could not update your password. Please try again."); }
    finally { setPasswordBusy(false); }
  };

  return (
    <div className="min-h-screen bg-[#f7f9ff]">
      <main className="mx-auto w-full max-w-[1250px] px-6 pb-14 pt-8 lg:px-8">

        {/* PAGE TITLE */}
        <section className="mb-7">
          <h1 className="text-[28px] font-bold tracking-[-0.4px] text-[#101936]">
            Settings
          </h1>

          <p className="mt-2 text-[12px] text-[#7c879b]">
            Manage your account, notifications and security preferences.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">

          {/* ==============================================
              SETTINGS MENU
          ============================================== */}
          <aside className="h-fit rounded-[18px] border border-[#e5eaf2] bg-white p-3 shadow-[0_4px_18px_rgba(15,23,42,.035)]">

            <SettingsTab
              icon={User}
              label="Account"
              active={activeTab === "account"}
              onClick={() => setActiveTab("account")}
            />

            <SettingsTab
              icon={Bell}
              label="Notifications"
              active={activeTab === "notifications"}
              onClick={() =>
                setActiveTab("notifications")
              }
            />

            <SettingsTab
              icon={Lock}
              label="Password & Security"
              active={activeTab === "security"}
              onClick={() =>
                setActiveTab("security")
              }
            />
          </aside>

          {/* ==============================================
              CONTENT
          ============================================== */}
          <section className="min-w-0 rounded-[20px] border border-[#e5eaf2] bg-white p-6 shadow-[0_4px_18px_rgba(15,23,42,.035)] md:p-7">

            {loading && <p role="status" className="mb-5 text-sm text-slate-500">Loading settings...</p>}
            {error && <div role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}<button className="ml-3 font-semibold underline" onClick={() => { setLoading(true); setError(""); setRefresh(v => v + 1); }}>Reload settings</button></div>}
            {/* ACCOUNT */}
            {activeTab === "account" && (
              <>
                <div className="border-b border-[#edf0f5] pb-5">
                  <h2 className="text-[19px] font-bold text-[#172033]">
                    Account Settings
                  </h2>

                  <p className="mt-1 text-[11px] text-[#8a94a8]">
                    Manage the basic information associated with your account.
                  </p>
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2">

                  <ReadOnlySetting
                    icon={User}
                    label="Student Name"
                    value={account?.name || user?.name || "Not available"}
                  />

                  <ReadOnlySetting
                    icon={Mail}
                    label="Email Address"
                    value={account?.email || user?.email || "Not available"}
                  />

                  <ReadOnlySetting
                    icon={Smartphone}
                    label="Phone Number"
                    value={account?.phone || user?.phone || "Not provided"}
                  />
                </div>

                <div className="mt-7 rounded-[14px] bg-[#f7f9ff] p-5">
                  <h3 className="text-[13px] font-bold text-[#172033]">
                    Update personal details
                  </h3>

                  <p className="mt-2 text-[10px] leading-5 text-[#7c879b]">
                    To update your name, profile photo, phone number
                    or location, use the Edit Profile option available from
                    My Profile. <Link to="/profile" className="font-semibold text-blue-600">Open My Profile</Link>
                  </p>
                </div>
              </>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === "notifications" && (
              <>
                <div className="border-b border-[#edf0f5] pb-5">
                  <h2 className="text-[19px] font-bold text-[#172033]">
                    Notification Preferences
                  </h2>

                  <p className="mt-1 text-[11px] text-[#8a94a8]">
                    Choose which updates you would like to receive.
                  </p>
                </div>

                <div className="mt-3 divide-y divide-[#edf0f5]">

                  <ToggleRow
                    title="Email Notifications"
                    description="Receive important updates on your registered email."
                    checked={settings.emailNotifications}
                    onChange={() =>
                      toggle("emailNotifications")
                    }
                  />

                  <ToggleRow
                    title="Course Updates"
                    description="Receive updates when new lessons or resources are added."
                    checked={settings.courseUpdates}
                    onChange={() =>
                      toggle("courseUpdates")
                    }
                  />

                  <ToggleRow
                    title="Assignment Reminders"
                    description="Get notified before an assignment or project deadline."
                    checked={settings.assignmentReminders}
                    onChange={() =>
                      toggle("assignmentReminders")
                    }
                  />

                  <ToggleRow
                    title="Mentor Session Reminders"
                    description="Receive reminders for your upcoming mentor sessions."
                    checked={
                      settings.mentorSessionReminders
                    }
                    onChange={() =>
                      toggle(
                        "mentorSessionReminders"
                      )
                    }
                  />

                  <ToggleRow
                    title="Community Updates"
                    description="Receive announcements from the Rathi Academy community."
                    checked={settings.communityUpdates}
                    onChange={() =>
                      toggle("communityUpdates")
                    }
                  />
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={saveSettings}
                    disabled={loading || saving || Boolean(error)}
                    className="flex h-10 items-center gap-2 rounded-[9px] bg-[#2563eb] px-5 text-[11px] font-semibold text-white"
                  >
                    {saved ? (
                      <>
                        <CheckCircle2 size={15} />
                        Saved
                      </>
                    ) : (
                      <>
                        <Save size={15} />
                        {saving ? "Saving..." : "Save Preferences"}
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* SECURITY */}
            {activeTab === "security" && (
              <>
                <div className="border-b border-[#edf0f5] pb-5">
                  <h2 className="text-[19px] font-bold text-[#172033]">
                    Password & Security
                  </h2>

                  <p className="mt-1 text-[11px] text-[#8a94a8]">
                    Keep your Rathi Academy account secure.
                  </p>
                </div>

                <form onSubmit={changePassword} className="mt-6 max-w-[600px] space-y-5">

                  <PasswordField
                    label="Current Password"
                    value={passwords.current}
                    onChange={value => setPasswords(current => ({ ...current, current: value }))}
                    autoComplete="current-password"
                    disabled={passwordBusy}
                    visible={showCurrentPassword}
                    setVisible={setShowCurrentPassword}
                  />

                  <PasswordField
                    label="New Password"
                    value={passwords.next}
                    onChange={value => setPasswords(current => ({ ...current, next: value }))}
                    autoComplete="new-password"
                    disabled={passwordBusy}
                    visible={showNewPassword}
                    setVisible={setShowNewPassword}
                  />

                  <label className="block">
                    <span className="text-[11px] font-semibold text-[#344054]">
                      Confirm New Password
                    </span>

                    <input
                      type="password"
                      placeholder="Re-enter your new password"
                      value={passwords.confirm}
                      onChange={e => setPasswords(current => ({ ...current, confirm: e.target.value }))}
                      autoComplete="new-password"
                      required
                      disabled={passwordBusy}
                      className="mt-2 h-11 w-full rounded-[10px] border border-[#dfe5ee] px-3 text-[12px] outline-none transition focus:border-[#2563eb]"
                    />
                  </label>

                  {passwordError && <p role="alert" className="text-sm text-red-600">{passwordError}</p>}
                  {passwordMessage && <p role="status" className="text-sm text-emerald-700">{passwordMessage}</p>}
                  <button disabled={passwordBusy} type="submit" className="h-11 rounded-[10px] bg-[#2563eb] px-6 text-[12px] font-semibold text-white">
                    {passwordBusy ? "Updating..." : "Update Password"}
                  </button>
                  <p className="text-xs text-slate-500">If you signed up with Google and have no password, use <Link to="/login" className="font-semibold text-blue-600">Forgot Password</Link> to set one first.</p>
                </form>

                <div className="mt-8 border-t border-[#edf0f5] pt-6">
                  <h3 className="text-[14px] font-bold text-[#172033]">
                    Account Security
                  </h3>

                  <div className="mt-4 rounded-[14px] border border-[#e7ecf3] bg-[#fafbfe] p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                        <CheckCircle2 size={17} />
                      </div>

                      <div>
                        <p className="text-[11px] font-semibold text-[#344054]">
                          {(account?.emailVerified ?? user?.emailVerified) ? "Email verified" : "Email verification not recorded"}
                        </p>

                        <p className="mt-1 text-[9px] text-[#8a94a8]">
                          {(account?.emailVerified ?? user?.emailVerified) ? "Your registered email has been verified." : "No verified email record is available for this account."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function SettingsTab({
  icon: Icon,
  label,
  active,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-[48px] w-full items-center gap-3 rounded-[11px] px-4 text-left text-[12px] font-semibold transition ${active
          ? "bg-[#eef4ff] text-[#2563eb]"
          : "text-[#667085] hover:bg-[#f8faff]"
        }`}
    >
      <Icon size={17} />
      {label}
    </button>
  );
}

function ReadOnlySetting({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex min-h-[80px] items-center gap-4 rounded-[14px] border border-[#edf0f5] bg-[#fafbfe] p-4">

      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eef4ff] text-[#2563eb]">
        <Icon size={18} />
      </div>

      <div>
        <p className="text-[9px] text-[#8a94a8]">
          {label}
        </p>

        <p className="mt-1 text-[11px] font-semibold text-[#354158]">
          {value}
        </p>
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-5">

      <div>
        <p className="text-[12px] font-semibold text-[#344054]">
          {title}
        </p>

        <p className="mt-1 text-[10px] leading-5 text-[#8a94a8]">
          {description}
        </p>
      </div>

      <button
        onClick={onChange}
        role="switch"
        aria-checked={checked}
        aria-label={title}
        className={`relative h-[25px] w-[44px] shrink-0 rounded-full transition ${checked
            ? "bg-[#2563eb]"
            : "bg-[#d5dae4]"
          }`}
      >
        <span
          className={`absolute top-[3px] h-[19px] w-[19px] rounded-full bg-white shadow-sm transition-all ${checked
              ? "left-[22px]"
              : "left-[3px]"
            }`}
        />
      </button>
    </div>
  );
}

function PasswordField({
  label,
  visible,
  setVisible,
  value, onChange, autoComplete, disabled,
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-[#344054]">
        {label}
      </span>

      <div className="relative mt-2">
        <input
          type={visible ? "text" : "password"}
          placeholder={`Enter ${label.toLowerCase()}`}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
          disabled={disabled}
          className="h-11 w-full rounded-[10px] border border-[#dfe5ee] px-3 pr-11 text-[12px] outline-none transition focus:border-[#2563eb]"
        />

        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() =>
            setVisible(!visible)
          }
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a94a8]"
        >
          {visible ? (
            <EyeOff size={16} />
          ) : (
            <Eye size={16} />
          )}
        </button>
      </div>
    </label>
  );
}