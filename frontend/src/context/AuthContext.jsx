import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

import { authToken, clearAuth, saveAuth, saveAuthUser } from "../utils/authStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => authToken());
  const [loading, setLoading] = useState(true);

  // On first load, if we have a token, ask the backend who we are.
  // This is what keeps you logged in across a page refresh.
  useEffect(() => {
    async function loadCurrentUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get("/auth/me");
        setUser(data.user);
      } catch (error) {
        // token was invalid/expired — clear everything
        if (error.response?.status === 401) {
          clearAuth(); setToken(null); setUser(null);
        }
      } finally {
        setLoading(false);
      }
    }
    loadCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const expired = () => { setToken(null); setUser(null); };
    window.addEventListener("auth-expired", expired);
    return () => window.removeEventListener("auth-expired", expired);
  }, []);

  function login(newToken, newUser, remember = true) {
    saveAuth(newToken, newUser, remember);
    setToken(newToken);
    setUser(newUser);
  }

  async function loginWithGoogle(accessToken, remember = true, acceptTerms = false) {
    const { data } = await api.post("/auth/google", { accessToken, acceptTerms }, { timeout: 90000 });
    login(data.token, data.user, remember);
    return data.user;
  }

  // Call this after a successful profile edit so the whole app
  // (navbar, dashboard greeting, etc.) reflects the change immediately.
  function updateUserInContext(updatedUser) {
    saveAuthUser(updatedUser);
    setUser(updatedUser);
  }

  async function signup(payload) {
    // Signup only creates the account — it does not log the user in,
    // matching the existing "show success modal, then go to /login" flow.
    const { data } = await api.post("/auth/signup", payload, { timeout: 30000 });
    return data;
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore — we're clearing local state regardless
    }
    clearAuth();
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, signup, logout, loginWithGoogle, updateUserInContext }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// This module intentionally exposes its provider and matching context hook.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
