import "./AuthFocus.css";
import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/client";
import { postAuthDestination } from "../utils/authRedirect";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
import { signupError as validateSignup, normalizeEmail, normalizePhone } from "../utils/authValidation";

/* ================= GOOGLE LOGO ================= */

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="h-[20px] w-[20px]">
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

/* ================= INDIA FLAG (inline SVG - renders everywhere, unlike the emoji) ================= */

function IndiaFlag() {
  return (
    <svg viewBox="0 0 24 16" className="h-[13px] w-[19px] shrink-0 rounded-[2px]">
      <rect width="24" height="16" fill="#fff" />
      <rect width="24" height="5.33" fill="#FF9933" />
      <rect y="10.67" width="24" height="5.33" fill="#138808" />
      <circle cx="12" cy="8" r="2.2" fill="none" stroke="#000080" strokeWidth="0.3" />
      <circle cx="12" cy="8" r="0.3" fill="#000080" />
    </svg>
  );
}
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ChevronDown,
  Check,
} from "lucide-react";

export default function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signup, loginWithGoogle } = useAuth();
  const { requestGoogleToken } = useGoogleAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);
  useEffect(() => {
    if (!resendSeconds) return;
    const timer = setTimeout(() => setResendSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(timer);
  }, [resendSeconds]);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

  const handleGoogleSignup = async () => {
    if (googleLoading || signupLoading) return;
    if (!agree) { setGoogleError("Please agree to the Terms of Service and Privacy Policy first."); return; }
    setGoogleError("");
    setGoogleLoading(true);
    try {
      const accessToken = await requestGoogleToken();
      const googleUser = await loginWithGoogle(accessToken, true, agree);
      navigate(postAuthDestination(googleUser, location.state?.from, location.search), {
        replace: true,
      });
    } catch (err) {
      setGoogleError(
        err.response?.data?.message || err.message || "Google sign-up failed."
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSignupError("");

    if (signupLoading || googleLoading) return;
    const validation = validateSignup(form, agree);
    if (validation) { setSignupError(validation); return; }

    setSignupLoading(true);
    try {
      const response = await signup({
        name: form.name.trim(),
        email: normalizeEmail(form.email),
        phone: normalizePhone(form.phone),
        password: form.password,
        acceptTerms: agree,
      });

      setPendingEmail(response.email || normalizeEmail(form.email));
      setDevOtp(import.meta.env.DEV ? response.devOtp || "" : "");
      setResendSeconds(60); setVerificationCode("");
      setForm(current => ({ ...current, password: "", confirmPassword: "" }));
    } catch (err) {
      setSignupError(
        err.response?.data?.message || "Signup failed. Please try again."
      );
    } finally {
      setSignupLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    navigate({ pathname: "/login", search: location.search }, { state: location.state });
  };

  const verifySignup = async event => {
    event.preventDefault();
    if (signupLoading) return;
    if (!/^\d{6}$/.test(verificationCode)) { setSignupError("Enter the complete 6-digit code."); return; }
    setSignupLoading(true); setSignupError("");
    try {
      await api.post("/auth/signup/verify-otp", { email: pendingEmail, otp: verificationCode });
      setPendingEmail(""); setDevOtp(""); setVerificationCode(""); setShowSuccessModal(true);
    } catch (error) { setSignupError(error.response?.data?.message || "Verification failed. Please try again."); }
    finally { setSignupLoading(false); }
  };
  const resendSignup = async () => {
    if (signupLoading || resendSeconds) return;
    setSignupLoading(true); setSignupError("");
    try {
      const { data } = await api.post("/auth/signup/resend-otp", { email: pendingEmail }, { timeout: 30000 });
      setDevOtp(import.meta.env.DEV ? data.devOtp || "" : ""); setResendSeconds(60); setVerificationCode("");
    } catch (error) { setSignupError(error.response?.data?.message || "Could not resend the code."); }
    finally { setSignupLoading(false); }
  };
  if (pendingEmail) return <main className="flex auth-page min-h-screen items-center justify-center bg-slate-50 px-5 py-10">
    <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg sm:p-9">
      <h1 className="text-2xl font-bold text-slate-900">Verify your email</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">Enter the 6-digit code for <strong>{pendingEmail}</strong> to finish creating your account. The code expires in 10 minutes.</p>
      <form onSubmit={verifySignup} className="mt-6 space-y-4">
        <label className="block text-sm font-semibold text-slate-700">Verification code
          <input autoFocus name="otp" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={verificationCode} onChange={event => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))} className="mt-2 h-14 w-full rounded-xl border border-slate-300 px-4 text-center text-2xl tracking-[0.35em] outline-none focus:border-slate-400  " required/>
        </label>
        {devOtp && <p role="status" className="text-sm text-amber-700">Local development email preview: {devOtp}</p>}
        {signupError && <p role="alert" className="text-sm text-red-600">{signupError}</p>}
        <button disabled={signupLoading} className="h-12 w-full rounded-xl bg-blue-600 font-semibold text-white disabled:opacity-60">{signupLoading ? "Please wait..." : "Verify and create account"}</button>
      </form>
      <button type="button" disabled={signupLoading || resendSeconds > 0} onClick={resendSignup} className="mt-5 w-full text-sm font-semibold text-blue-600 disabled:text-slate-400">{resendSeconds ? `Resend in ${resendSeconds}s` : "Resend verification code"}</button>
      <button type="button" disabled={signupLoading} onClick={() => { setPendingEmail(""); setSignupError(""); setDevOtp(""); }} className="mt-4 w-full text-sm text-slate-500">Change signup details</button>
    </section>
  </main>;

  const inputClass =
    "h-[44px] w-full rounded-[8px] border border-[#d8dee8] bg-white text-[13px] text-[#1f2937] outline-none transition placeholder:text-[#7a8699] focus:border-slate-400  ";

  const helperClass =
    "mt-[3px] pl-[2px] text-[10px] leading-none text-[#697586]";

  return (
    <>
      <main className="flex auth-page min-h-screen items-center justify-center bg-[#eef3f9] p-4 lg:p-5">
        {/* ================= MAIN CARD ================= */}
        <section
          className="
            flex
            min-h-[740px]
            w-full
            max-w-[1050px]
            overflow-hidden
            rounded-[22px]
            bg-white
            shadow-[0_18px_55px_rgba(25,45,80,0.13)]
          "
        >
          {/* ================================================= */}
          {/* LEFT SIDE */}
          {/* ================================================= */}
          <div className="flex w-full flex-col bg-white lg:w-[60%]">
            <div
              className="
                mx-auto
                flex
                w-full
                max-w-[535px]
                flex-col
                px-7
                py-5
                sm:px-8
                lg:px-8
              "
            >
              {/* LOGO */}
              <div className="shrink-0">
                <div className="text-[27px] font-extrabold leading-none tracking-[-1.7px]">
                  <span className="text-[#1555d9]">rathi</span>
                  <span className="text-[#111827]">academy</span>
                </div>

                <div className="mt-[7px] text-[9px] font-semibold uppercase tracking-[2.2px] text-[#4b5565]">
                  LEARN · IMPLEMENT · GROW
                </div>
              </div>

              {/* CONTENT */}
              <div className="mt-[22px] flex min-h-0 flex-1 flex-col">
                {/* HEADING */}
                <div className="mb-[15px] shrink-0">
                  <h1 className="text-[28px] font-bold leading-[1.15] tracking-[-0.8px] text-[#090909]">
                    Create your account
                  </h1>

                  <p className="mt-[7px] text-[12.5px] text-[#697586]">
                    Join Rathi Academy and start your learning journey
                  </p>
                </div>

                {/* GOOGLE */}
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={googleLoading || signupLoading}
                  className="
                    flex
                    h-[44px]
                    shrink-0
                    items-center
                    justify-center
                    gap-3
                    rounded-[8px]
                    border
                    border-[#d8dee8]
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

                  <span>{googleLoading ? "Opening Google..." : "Sign up with Google"}</span>
                </button>

                {googleError && (
                  <p className="mt-[8px] text-center text-[11px] font-medium text-red-600">
                    {googleError}
                  </p>
                )}

                {/* OR */}
                <div className="my-[11px] flex shrink-0 items-center gap-4">
                  <div className="h-px flex-1 bg-[#e0e4ea]" />

                  <span className="text-[11px] text-[#818b99]">or</span>

                  <div className="h-px flex-1 bg-[#e0e4ea]" />
                </div>

                {/* FORM */}
                <form
                  onSubmit={handleSubmit}
                  className="flex min-h-0 flex-1 flex-col"
                >
                  {/* FULL NAME */}
                  <div className="mb-[8px]">
                    <div className="relative">
                      <User
                        size={17}
                        strokeWidth={1.7}
                        className="absolute left-[15px] top-1/2 -translate-y-1/2 text-[#738096]"
                      />

                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Full Name"
                        autoComplete="name"
                        className={`${inputClass} pl-[45px] pr-4`}
                      />
                    </div>

                    <p className={helperClass}>Enter your full name</p>
                  </div>

                  {/* EMAIL */}
                  <div className="mb-[8px]">
                    <div className="relative">
                      <Mail
                        size={17}
                        strokeWidth={1.7}
                        className="absolute left-[15px] top-1/2 -translate-y-1/2 text-[#738096]"
                      />

                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Email Address"
                        autoComplete="email"
                        className={`${inputClass} pl-[45px] pr-4`}
                      />
                    </div>

                    <p className={helperClass}>Enter your email address</p>
                  </div>

                  {/* PHONE */}
                  <div className="mb-[8px]">
                    <div
                      className="
                        flex
                        h-[44px]
                        w-full
                        overflow-hidden
                        rounded-[8px]
                        border
                        border-[#d8dee8]
                        bg-white
                        transition
                        focus-within:border-slate-400
                        
                        
                      "
                    >
                      <button
                        type="button"
                        className="
                          flex
                          w-[112px]
                          shrink-0
                          items-center
                          gap-[7px]
                          border-r
                          border-[#d8dee8]
                          px-[11px]
                          text-[13px]
                          text-[#253041]
                        "
                      >
                        <IndiaFlag />
                        <span className="font-medium">+91</span>

                        <ChevronDown
                          size={13}
                          className="ml-auto text-[#697586]"
                        />
                      </button>

                      <div className="relative min-w-0 flex-1">
                        <Phone
                          size={17}
                          strokeWidth={1.7}
                          className="absolute left-[15px] top-1/2 -translate-y-1/2 text-[#738096]"
                        />

                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="Mobile Number"
                          autoComplete="tel"
                          className="
                            h-full
                            w-full
                            bg-transparent
                            pl-[44px]
                            pr-3
                            text-[13px]
                            text-[#1f2937]
                            outline-none
                            placeholder:text-[#7a8699]
                          "
                        />
                      </div>
                    </div>

                    <p className={helperClass}>Enter your mobile number</p>
                  </div>

                  {/* PASSWORD */}
                  <div className="mb-[8px]">
                    <div className="relative">
                      <Lock
                        size={17}
                        strokeWidth={1.7}
                        className="absolute left-[15px] top-1/2 -translate-y-1/2 text-[#738096]"
                      />

                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Password"
                        autoComplete="new-password"
                        className={`${inputClass} pl-[45px] pr-[45px]`}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((prev) => !prev)
                        }
                        className="absolute right-[15px] top-1/2 -translate-y-1/2 text-[#738096]"
                      >
                        {showPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    </div>

                    <p className={helperClass}>
                      Password must be at least 6 characters
                    </p>
                  </div>

                  {/* CONFIRM PASSWORD */}
                  <div className="mb-[9px]">
                    <div className="relative">
                      <Lock
                        size={17}
                        strokeWidth={1.7}
                        className="absolute left-[15px] top-1/2 -translate-y-1/2 text-[#738096]"
                      />

                      <input
                        type={
                          showConfirmPassword ? "text" : "password"
                        }
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm Password"
                        autoComplete="new-password"
                        className={`${inputClass} pl-[45px] pr-[45px]`}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword((prev) => !prev)
                        }
                        className="absolute right-[15px] top-1/2 -translate-y-1/2 text-[#738096]"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={17} />
                        ) : (
                          <Eye size={17} />
                        )}
                      </button>
                    </div>

                    <p className={helperClass}>Re-enter your password</p>
                  </div>

                  {/* TERMS */}
                  <label className="flex shrink-0 cursor-pointer items-center gap-[8px] text-[10px] text-[#596579]">
                    <input
                      type="checkbox"
                      checked={agree}
                      onChange={(e) => setAgree(e.target.checked)}
                      className="h-[16px] w-[16px] shrink-0 accent-[#1555e8]"
                    />

                    <span>
                      I agree to the{" "}
                      <Link to="/terms" target="_blank" rel="noreferrer" className="font-semibold text-[#1555d9]">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy" target="_blank" rel="noreferrer" className="font-semibold text-[#1555d9]">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>

                  {/* ERROR MESSAGE */}
                  {signupError && (
                    <p role="alert" className="mb-[6px] text-[11px] font-medium text-red-600">
                      {signupError}
                    </p>
                  )}

                  {/* CREATE ACCOUNT */}
                  <button
                    type="submit"
                    disabled={signupLoading || googleLoading}
                    className="
                      mt-[10px]
                      h-[44px]
                      w-full
                      shrink-0
                      rounded-[8px]
                      bg-[#1555e8]
                      text-[13.5px]
                      font-semibold
                      text-white
                      shadow-[0_5px_15px_rgba(21,85,232,0.18)]
                      transition
                      hover:bg-[#1049ce]
                      disabled:opacity-60
                    "
                  >
                    {signupLoading ? "Creating account..." : "Create Account"}
                  </button>

                  {/* LOGIN */}
                  <div className="mt-3 shrink-0 pb-2 text-center text-[12px] leading-5 text-[#697586]">
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => navigate({ pathname: "/login", search: location.search }, { state: location.state })}
                      className="font-semibold text-[#1555d9] hover:underline"
                    >
                      Login
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* ================================================= */}
          {/* RIGHT SIDE */}
          {/* ================================================= */}
          <div className="relative hidden w-[40%] self-stretch overflow-hidden lg:block">
            <img
              src="/signup-side.png"
              alt="Rathi Academy learning"
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
          </div>
        </section>
      </main>

      {/* ===================================================== */}
      {/* SUCCESS MODAL */}
      {/* ===================================================== */}
      {showSuccessModal && (
        <div
          className="
            fixed
            inset-0
            z-[9999]
            flex
            items-center
            justify-center
            bg-black/45
            px-4
            backdrop-blur-[1px]
          "
        >
          <div
            className="
              w-full
              max-w-[455px]
              rounded-[22px]
              bg-white
              px-[26px]
              pb-[30px]
              pt-[46px]
              text-center
              shadow-[0_24px_80px_rgba(0,0,0,0.25)]
              sm:px-[32px]
            "
          >
            {/* SUCCESS ICON AREA */}
            <div className="relative mx-auto mb-[24px] flex h-[115px] w-[170px] items-center justify-center">
              {/* DECORATION DOTS */}
              <span className="absolute left-[8px] top-[34px] h-[5px] w-[5px] rounded-full bg-[#f5c84b]" />
              <span className="absolute left-[25px] bottom-[22px] h-[5px] w-[5px] rounded-full bg-[#48b868]" />
              <span className="absolute left-[44px] top-[62px] h-[5px] w-[5px] rounded-full bg-[#67a4ef]" />
              <span className="absolute right-[25px] top-[24px] h-[5px] w-[5px] rounded-full bg-[#b9be72]" />
              <span className="absolute right-[10px] top-[60px] h-[5px] w-[5px] rounded-full bg-[#67a4ef]" />
              <span className="absolute right-[32px] bottom-[20px] h-[5px] w-[5px] rounded-full bg-[#62c977]" />

              {/* OUTER GREEN CIRCLE */}
              <div className="flex h-[102px] w-[102px] items-center justify-center rounded-full bg-[#e8f7ed]">
                {/* INNER GREEN CIRCLE */}
                <div className="flex h-[66px] w-[66px] items-center justify-center rounded-full bg-[#3dba5b] shadow-[0_7px_18px_rgba(61,186,91,0.25)]">
                  <Check
                    size={38}
                    strokeWidth={2.5}
                    className="text-white"
                  />
                </div>
              </div>
            </div>

            {/* TITLE */}
            <h2 className="text-[22px] font-bold leading-tight text-[#171717]">
              Account Created Successfully!
            </h2>

            {/* DESCRIPTION */}
            <p className="mx-auto mt-[13px] max-w-[360px] text-[13px] leading-[1.65] text-[#667085]">
              Welcome to Rathi Academy! Your account has been
              created successfully. You can now log in and start
              your learning journey.
            </p>

            {/* CLOSE */}
            <button
              type="button"
              onClick={handleCloseSuccess}
              className="
                mt-[28px]
                h-[50px]
                w-full
                rounded-[8px]
                bg-[#edf3ff]
                text-[14px]
                font-semibold
                text-[#1555d9]
                transition
                hover:bg-[#e3ecff]
              "
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}