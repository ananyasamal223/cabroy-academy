export const normalizeEmail = value => typeof value === "string" ? value.trim().toLowerCase() : "";
export const validEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export function normalizePhone(value) {
  const digits = String(value || "").replace(/[\s()+-]/g, "");
  return digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;
}
export function signupError(form, agree) {
  if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password || !form.confirmPassword) return "Please fill all fields.";
  if (!validEmail(normalizeEmail(form.email))) return "Enter a valid email address.";
  if (!/^[6-9]\d{9}$/.test(normalizePhone(form.phone))) return "Enter a valid 10-digit Indian mobile number.";
  if (form.password.length < 6 || new TextEncoder().encode(form.password).length > 72) return "Password must be at least 6 characters and no more than 72 bytes.";
  if (form.password !== form.confirmPassword) return "Passwords do not match.";
  if (!agree) return "Please agree to the Terms of Service and Privacy Policy.";
  return "";
}
