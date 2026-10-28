# Google sign-in deployment

The frontend and backend share the public OAuth client ID in `shared/googleOAuth.mjs`. A Google client ID identifies the app publicly; this file must never contain a client secret. Optional `VITE_GOOGLE_CLIENT_ID` (frontend build) and `GOOGLE_CLIENT_ID` (backend) overrides must match.

In the matching Google Cloud project's Google Auth Platform > Clients > Web application, add this exact Authorized JavaScript origin:

`https://cabroy-academy.ananyasamal812.workers.dev`

Add any custom production domain separately when it is used. For local development, allow `http://localhost:5173` if needed. This popup token flow does not use a backend redirect callback. If the OAuth app is in Testing, add intended preview users under Audience > Test users; otherwise Google can restrict their access.

Deploy the latest GitHub main to both Cloudflare (frontend) and Render (backend). Existing environment overrides still take priority. No Google client secret is required in the browser or for this token-verification flow. Google tokens must continue to pass audience, expiry and verified-email checks on the backend.

Use the Sign Up page and accept the policies for a new Google account. Sign In requires an existing account. Test with a real Google account in a browser after Google Cloud origins are configured; mocked integration tests do not prove Google Cloud consent/origin configuration.
