import { googleClientId } from "../../../shared/googleOAuth.mjs";
import { useCallback } from "react";
export function useGoogleAuth() {
  const requestGoogleToken = useCallback(() => new Promise((resolve, reject) => {
    const clientId = googleClientId(import.meta.env.VITE_GOOGLE_CLIENT_ID);
    if (!clientId) { reject(new Error("Google sign-in is not configured yet.")); return; }
    if (!window.google?.accounts?.oauth2) { reject(new Error("Google sign-in failed to load. Please try again.")); return; }
    const timer = setTimeout(() => reject(new Error("Google sign-in timed out. Please try again.")), 90000);
    const fail = message => { clearTimeout(timer); reject(new Error(message)); };
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId, scope: "openid email profile",
        callback: response => {
          if (response.error || !response.access_token) { fail(response.error_description || "Google sign-in was cancelled."); return; }
          clearTimeout(timer); resolve(response.access_token);
        },
        error_callback: error => fail(error.type === "popup_closed" ? "Google sign-in was cancelled." : "Google popup could not open. Allow popups and try again."),
      });
      client.requestAccessToken();
    } catch (error) { fail(error.message || "Could not start Google sign-in."); }
  }), []);
  return { requestGoogleToken };
}
