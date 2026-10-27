import "./AuthFocus.css";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import { postAuthDestination } from "../utils/authRedirect";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import { normalizeEmail, normalizePhone, validEmail } from "../utils/authValidation";
import {
  Eye,
  EyeOff,
  Check,
  X,
  ArrowLeft,
} from "lucide-react";

/* ================= GOOGLE LOGO ================= */

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="h-[21px] w-[21px]">
      <path
        fill="#FFC107"
        d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.6-5.6C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9Z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.6-5.6C34 6.1 29.3 4 24 4c-7.7 0-14.3 4.3-17.7 10.7Z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44Z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9Z"
      />
    </svg>
  );
}

/* ================================================= */
/* MAIN COMPONENT */
/* ================================================= */

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle } = useAuth();

  const [screen, setScreen] = useState("login");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [devOtp, setDevOtp] = useState("");
  useEffect(() => {
    if (!resendSeconds) return;
    const timer = setTimeout(() => setResendSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(timer);
  }, [resendSeconds]);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const { requestGoogleToken } = useGoogleAuth();

  const handleGoogleLogin = async () => {
    if (googleLoading || loginLoading) return;
    setGoogleError("");
    setGoogleLoading(true);
    try {
      const accessToken = await requestGoogleToken();
      const googleUser = await loginWithGoogle(accessToken, loginData.remember);
      navigate(postAuthDestination(googleUser, location.state?.from, location.search), {
        replace: true,
      });
    } catch (err) {
      setGoogleError(
        err.response?.data?.message || err.message || "Google login failed."
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
    remember: true,
  });

  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [resetData, setResetData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [otp, setOtp] = useState(["", "", "", ""]);

  /* ================= LOGIN ================= */

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");

    if (!loginData.email.trim()) {
      setLoginError("Please enter your email address or mobile number.");
      return;
    }

    if (!loginData.password.trim()) {
      setLoginError("Please enter your password.");
      return;
    }

    if (loginLoading || googleLoading) return;
    setLoginLoading(true);
    try {
      const { data } = await api.post("/auth/login", {
        identifier: loginData.email.includes("@") ? normalizeEmail(loginData.email) : normalizePhone(loginData.email),
        password: loginData.password,
      });

      login(data.token, data.user, loginData.remember);

      navigate(postAuthDestination(data.user, location.state?.from, location.search), { replace: true });
    } catch (err) {
      setLoginError(
        err.response?.data?.message || "Invalid email/mobile or password."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  /* ================= RESET PASSWORD ================= */

  const sendOtp = async () => {
    const { data } = await api.post("/auth/forgot-password/send-otp", { email: normalizeEmail(resetData.email) }, { timeout: 30000 });
    setDevOtp(import.meta.env.DEV ? (data.devOtp || "") : "");
    setOtp(["", "", "", ""]); setResendSeconds(60); setScreen("otp");
  };
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (resetLoading) return;
    setOtpError("");
    if (!validEmail(normalizeEmail(resetData.email))) { setOtpError("Enter a valid registered email address."); return; }
    if (resetData.password.length < 6 || resetData.password.length > 72) { setOtpError("New password must be between 6 and 72 characters."); return; }
    if (resetData.password !== resetData.confirmPassword) { setOtpError("Passwords do not match."); return; }
    setResetLoading(true);
    try { await sendOtp(); }
    catch (err) { setOtpError(err.response?.data?.message || "Could not send the verification code. Please try again."); }
    finally { setResetLoading(false); }
  };
  const resendOtp = async () => {
    if (resetLoading || resendSeconds) return;
    setResetLoading(true); setOtpError("");
    try { await sendOtp(); }
    catch (err) { setOtpError(err.response?.data?.message || "Could not resend the code. Please try again."); }
    finally { setResetLoading(false); }
  };
  const handleOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    setOtp(current => current.map((digit, position) => position === index ? value : digit));
    setOtpError("");
    if (value && index < 3) document.getElementById(`reset-otp-${index + 1}`)?.focus();
  };
  const pasteOtp = event => {
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!digits) return;
    event.preventDefault(); setOtp(Array.from({ length: 4 }, (_, i) => digits[i] || ""));
    document.getElementById(`reset-otp-${Math.min(digits.length, 3)}`)?.focus();
  };
  const verifyOTP = async () => {
    if (resetLoading) return;
    const enteredOTP = otp.join("");
    if (enteredOTP.length !== 4) { setOtpError("Enter the complete 4-digit code."); return; }
    setResetLoading(true); setOtpError("");
    try {
      await api.post("/auth/forgot-password/verify-otp", { email: normalizeEmail(resetData.email), otp: enteredOTP });
      await api.post("/auth/forgot-password/reset", { email: normalizeEmail(resetData.email), otp: enteredOTP, newPassword: resetData.password });
      setDevOtp(""); setOtp(["", "", "", ""]); setResetData(current => ({ ...current, password: "", confirmPassword: "" })); setScreen("success");
    } catch (err) { setOtpError(err.response?.data?.message || "Could not reset your password. Please try again."); }
    finally { setResetLoading(false); }
  };

  /* ================================================= */
  /* LOGIN PAGE */
  /* ================================================= */

  if (screen === "login") {
    return (
      <main
        className="
          flex
          auth-page min-h-screen
          items-center
          justify-center
          bg-[#f2f5fa]
          p-4
          lg:p-[18px]
        "
      >
        {/* ================= MAIN CARD ================= */}

        <section
          className="
            flex
            h-[calc(100vh-32px)]
            max-h-[790px]
            min-h-[650px]
            w-full
            max-w-[1080px]
            overflow-hidden
            rounded-[22px]
            bg-white
            shadow-[0_18px_55px_rgba(20,40,75,0.12)]
            lg:h-[calc(100vh-36px)]
          "
        >
          {/* ============================================= */}
          {/* LEFT SIDE */}
          {/* ============================================= */}

          <div className="flex w-full bg-white lg:w-[49%]">
            <div
              className="
                mx-auto
                flex
                h-full
                w-full
                max-w-[455px]
                flex-col
                px-7
                py-7
                sm:px-9
                lg:px-6
              "
            >
              {/* ================= LOGO ================= */}

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="block text-left"
                >
                  <div className="text-[27px] font-extrabold leading-none tracking-[-1.6px]">
                    <span className="text-[#1555d9]">rathi</span>
                    <span className="text-[#111827]">academy</span>
                  </div>

                  <div className="mt-[7px] text-[9px] font-semibold uppercase tracking-[2.15px] text-[#4b5565]">
                    LEARN · IMPLEMENT · GROW
                  </div>
                </button>
              </div>

              {/* ================= FORM CONTENT ================= */}

              <div className="my-auto w-full">
                {/* HEADING */}

                <div className="mb-[27px]">
                  <h1 className="text-[29px] font-bold leading-tight tracking-[-0.7px] text-[#111827]">
                    Welcome back
                  </h1>

                  <p className="mt-[8px] text-[13px] text-[#667085]">
                    Login to continue your learning journey
                  </p>
                </div>

                {/* GOOGLE */}

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading || loginLoading}
                  className="
                    flex
                    h-[47px]
                    w-full
                    items-center
                    justify-center
                    gap-[14px]
                    rounded-[8px]
                    border
                    border-[#d7dce5]
                    bg-white
                    text-[13px]
                    font-medium
                    text-[#202939]
                    transition
                    hover:bg-[#f8fafc]
                    disabled:opacity-60
                  "
                >
                  <GoogleLogo />
                  <span>{googleLoading ? "Opening Google..." : "Login with Google"}</span>
                </button>

                {googleError && (
                  <p className="mt-[8px] text-center text-[12px] font-medium text-red-600">
                    {googleError}
                  </p>
                )}

                <div className="my-5 flex items-center gap-3"><div className="h-px flex-1 bg-slate-200"/><span className="text-xs text-slate-400">or use your account</span><div className="h-px flex-1 bg-slate-200"/></div>
                <form onSubmit={handleLogin} className="space-y-4">
                  <label className="block text-xs font-semibold text-slate-700">Email address or mobile number
                    <input name="identifier" autoComplete="username" value={loginData.email} onChange={e => setLoginData(current => ({ ...current, email: e.target.value }))} required maxLength={254} placeholder="Email address or mobile number" className="mt-2 h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-slate-400  "/>
                  </label>
                  <label className="block text-xs font-semibold text-slate-700">Password
                    <span className="relative mt-2 block"><input name="password" autoComplete="current-password" type={showLoginPassword ? "text" : "password"} value={loginData.password} onChange={e => setLoginData(current => ({ ...current, password: e.target.value }))} required placeholder="Password" className="h-11 w-full rounded-lg border border-slate-300 px-3 pr-11 text-sm outline-none focus:border-slate-400  "/><button type="button" aria-label={showLoginPassword ? "Hide password" : "Show password"} onClick={() => setShowLoginPassword(value => !value)} className="absolute right-3 top-3 text-slate-500">{showLoginPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></span>
                  </label>
                  <div className="flex items-center justify-between gap-3 text-xs"><label className="flex items-center gap-2 text-slate-600"><input type="checkbox" checked={loginData.remember} onChange={e => setLoginData(current => ({ ...current, remember: e.target.checked }))} className="accent-blue-600"/>Remember me</label><button type="button" onClick={() => { setOtpError(""); setScreen("forgot"); }} className="font-semibold text-blue-600">Forgot password?</button></div>
                  {loginError && <p role="alert" className="text-sm text-red-600">{loginError}</p>}
                  <button type="submit" disabled={loginLoading || googleLoading} className="h-11 w-full rounded-lg bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{loginLoading ? "Logging in..." : "Log in"}</button>
                </form>

                {/* SIGN UP */}

                <div className="mt-[28px] text-center text-[12px] text-[#667085]">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate({ pathname: "/signup", search: location.search }, { state: location.state })}
                    className="
                      font-semibold
                      text-[#1555d9]
                      hover:underline
                    "
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================= */}
          {/* RIGHT IMAGE SIDE */}
          {/* ============================================= */}

          <div
            className="
              relative
              hidden
              h-full
              w-[51%]
              overflow-hidden
              bg-[#073eaf]
              lg:block
            "
          >
            <img
              src="/login-side.png"
              alt="Rathi Academy online learning"
              className="
                absolute
                inset-0
                h-full
                w-full
                object-cover
                object-center
              "
            />
          </div>
        </section>
      </main>
    );
  }

  /* ================================================= */
  /* FORGOT PASSWORD / OTP / RESULT SCREENS */
  /* Your existing functionality is retained below. */
  /* ================================================= */

  return (
    <div className="flex auth-page min-h-screen items-center justify-center bg-[#f2f5fa] p-5">
      {/* ================= FORGOT PASSWORD ================= */}

      {screen === "forgot" && (
        <div className="w-full max-w-[560px] rounded-[24px] bg-white px-8 py-10 shadow-[0_20px_70px_rgba(15,23,42,0.1)] md:px-12">
          <button
            onClick={() => setScreen("login")}
            className="mb-7 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
          >
            <ArrowLeft size={17} />
            Back
          </button>

          <h1 className="text-3xl font-black text-slate-900">
            Forgot password?
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Enter Email to verify & reset password
          </p>

          <form onSubmit={handleSendOTP} className="mt-8">
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Enter Username or Email
            </label>

            <input
              type="text"
              placeholder="sarah.doe@gmail.com"
              value={resetData.email}
              onChange={(e) =>
                setResetData({
                  ...resetData,
                  email: e.target.value,
                })
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3.5 outline-none focus:border-slate-400  "
            />

            <label className="mb-2 mt-5 block text-sm font-bold text-slate-700">
              Set New Password
            </label>

            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={resetData.password}
                onChange={(e) =>
                  setResetData({
                    ...resetData,
                    password: e.target.value,
                  })
                }
                placeholder="Enter new password"
                className="w-full rounded-xl border border-slate-300 px-4 py-3.5 pr-12 outline-none focus:border-slate-400"
              />

              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {showNewPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>

            <label className="mb-2 mt-5 block text-sm font-bold text-slate-700">
              Rewrite New Password
            </label>

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={resetData.confirmPassword}
                onChange={(e) =>
                  setResetData({
                    ...resetData,
                    confirmPassword: e.target.value,
                  })
                }
                placeholder="Rewrite new password"
                className={`w-full rounded-xl border px-4 py-3.5 pr-12 outline-none ${resetData.confirmPassword &&
                    resetData.password === resetData.confirmPassword
                    ? "border-emerald-400"
                    : "border-slate-300 focus:border-slate-400"
                  }`}
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
              >
                {resetData.confirmPassword &&
                  resetData.password === resetData.confirmPassword ? (
                  <Check size={19} className="text-emerald-500" />
                ) : showConfirmPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>

            {otpError && <p role="alert" className="mt-4 text-sm text-red-600">{otpError}</p>}
            <button
              type="submit"
              disabled={resetLoading}
              className="mt-7 w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white hover:bg-blue-700"
            >
              {resetLoading ? "Sending code..." : "Send Verification OTP"}
            </button>

            <button
              type="button"
              onClick={() => setScreen("login")}
              className="mt-4 w-full text-center text-sm text-slate-500"
            >
              Back to{" "}
              <span className="font-bold text-blue-600">Log in</span>
            </button>
          </form>
        </div>
      )}

      {/* ================= OTP ================= */}

      {screen === "otp" && (
        <div className="w-full max-w-[520px] rounded-[24px] bg-white px-8 py-14 shadow-[0_20px_70px_rgba(15,23,42,0.1)] md:px-14">
          <h1 className="text-3xl font-black text-slate-900">
            Enter OTP
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            The OTP is sent to your registered email ID
          </p>

          <div className="mt-9 flex justify-center gap-3">
            {otp.map((value, index) => (
              <input
                key={index}
                id={`reset-otp-${index}`}
                value={value}
                maxLength={1}
                inputMode="numeric"
                aria-label={`Verification code digit ${index + 1}`}
                autoComplete={index === 0 ? "one-time-code" : "off"}
                onPaste={pasteOtp}
                onKeyDown={e => { if (e.key === "Backspace" && !value && index > 0) document.getElementById(`reset-otp-${index - 1}`)?.focus(); if (e.key === "Enter") verifyOTP(); }}
                onChange={(e) =>
                  handleOtpChange(e.target.value, index)
                }
                className="h-14 w-16 rounded-xl border-2 border-slate-300 text-center text-xl font-bold outline-none focus:border-slate-400  "
              />
            ))}
          </div>

          {devOtp && <p role="status" className="mt-4 text-sm text-amber-700">Local development email preview: {devOtp}</p>}
          {otpError && <p role="alert" className="mt-4 text-sm text-red-600">{otpError}</p>}
          <button
            disabled={resetLoading}
            onClick={verifyOTP}
            className="mt-8 w-full rounded-xl bg-blue-600 py-3.5 font-bold text-white hover:bg-blue-700"
          >
            {resetLoading ? "Verifying..." : "Verify"}
          </button>

          <p className="mt-4 text-center text-sm text-slate-500">
            Didn&apos;t receive OTP?{" "}
            <button
              onClick={resendOtp}
              disabled={resetLoading || resendSeconds > 0}
              className="font-bold text-blue-600"
            >
              {resendSeconds ? `Resend in ${resendSeconds}s` : "Resend"}
            </button>
          </p>
          <button type="button" disabled={resetLoading} onClick={() => { setOtpError(""); setScreen("forgot"); }} className="mt-4 w-full text-sm text-slate-500">Change email or password</button>
        </div>
      )}

      {/* ================= SUCCESS ================= */}

      {screen === "success" && (
        <div className="flex min-h-[500px] w-full max-w-[540px] flex-col items-center justify-center rounded-[24px] bg-white px-8 text-center shadow-[0_20px_70px_rgba(15,23,42,0.1)]">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-600 shadow-xl shadow-blue-600/25">
            <Check
              size={52}
              strokeWidth={3}
              className="text-white"
            />
          </div>

          <h2 className="mt-6 text-3xl font-black text-blue-600">
            Verified
          </h2>

          <h1 className="mt-5 text-3xl font-black leading-tight text-slate-900">
            Password Changed
            <br />
            Successfully!
          </h1>

          <button
            onClick={() => {
              setScreen("login");

              setLoginData({
                ...loginData,
                email: resetData.email,
                password: "",
              });
            }}
            className="mt-9 text-lg text-slate-500"
          >
            Back to{" "}
            <span className="font-bold text-blue-600">Log in</span>
          </button>
        </div>
      )}

      {/* ================= FAILED ================= */}

      {screen === "failed" && (
        <div className="flex min-h-[500px] w-full max-w-[540px] flex-col items-center justify-center rounded-[24px] bg-white px-8 text-center shadow-[0_20px_70px_rgba(15,23,42,0.1)]">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-500">
            <X
              size={55}
              strokeWidth={3}
              className="text-white"
            />
          </div>

          <h1 className="mt-7 text-3xl font-black text-red-500">
            Verification Failed
          </h1>

          <h2 className="mt-6 text-3xl font-black leading-tight text-slate-900">
            Password Reset has
            <br />
            Failed!
          </h2>

          <button
            onClick={() => setScreen("forgot")}
            className="mt-8 text-lg font-bold text-blue-600 hover:underline"
          >
            Try Again
          </button>

          <button
            onClick={() => setScreen("login")}
            className="mt-3 text-lg text-slate-500"
          >
            Back to{" "}
            <span className="font-bold text-blue-600">Log in</span>
          </button>
        </div>
      )}
    </div>
  );
}