import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function protect(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) return res.status(401).json({ message: "Not authenticated" });
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return res.status(401).json({ message: "User not found or inactive" });
    if ((decoded.version || 0) !== (user.authVersion || 0)) return res.status(401).json({ message: "Session expired. Please log in again." });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Forbidden" });
  next();
};

// Full admins always pass. Employees pass only when an admin explicitly
// granted access to the requested section.
export const authorizeAdminPermission = (permission) => (req, res, next) => {
  if (req.user.role === "admin") return next();
  if (
    req.user.adminAccess &&
    Array.isArray(req.user.adminPermissions) &&
    req.user.adminPermissions.includes(permission)
  ) return next();
  return res.status(403).json({ message: "You do not have access to this admin section" });
};

export const authorizeAdminArea = (req, res, next) => {
  if (req.user.role === "admin") return next();
  if (req.user.adminAccess) return next();
  return res.status(403).json({ message: "Admin access is not enabled for this account" });
};
