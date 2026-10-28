// OAuth client IDs are public identifiers, not client secrets. Keep the deployed
// frontend and backend on the same app even when build variables are omitted.
export const GOOGLE_WEB_CLIENT_ID = "184915201227-i516nb1ltcqlecuq5f7n49dgjemi40mi.apps.googleusercontent.com";
export const googleClientId = override => typeof override === "string" && override.trim() ? override.trim() : GOOGLE_WEB_CLIENT_ID;
