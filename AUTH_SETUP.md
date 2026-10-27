# Login and Signup verification

Implemented input normalization, explicit policy consent, duplicate-account handling, email/mobile login, Google popup errors and server client checks, working OTP resend, expiry and attempt limits, one-time reset codes, and Remember me session storage.

## Local verification

Run frontend checks:

```powershell
node --test src/utils/authRedirect.test.js src/utils/authStorage.test.js src/utils/authValidation.test.js
```

Run backend integration checks with MongoDB running:

```powershell
$env:AUTH_INTEGRATION='1'
node --env-file=backend/.env --test backend/src/controllers/auth.integration.test.js
node --test backend/src/utils/email.test.js
```

Integration tests use a uniquely named rathi_auth_test_ database and remove that database afterward. Email transport and Google responses are mocked; no external email is sent.

## Production configuration still required

- Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and SMTP_FROM in backend/.env. Use provider credentials directly in your environment; do not commit them.
- Missing SMTP is an explicit error outside development. In development only, missing SMTP produces a clearly labeled local code preview rather than claiming email delivery.
- GOOGLE_CLIENT_ID on the server must match VITE_GOOGLE_CLIENT_ID in the frontend. The current frontend public client ID was copied into the local backend configuration.
- Register the deployed frontend origin in the Google OAuth application. Finish an actual account-picker sign-in using your own test account. Google setup: https://developers.google.com/identity/oauth2/web/guides/use-token-model
- Replace the clearly labeled draft Terms of Service and Privacy Policy with approved academy text before deployment. Consent currently records the draft policy version.
- Confirm real reset email arrival after SMTP configuration.

Browser automation was unavailable in this session, so visual/mobile verification and real Google account-picker sign-in remain unverified.

Final validation: 17 authentication tests passed; targeted frontend lint passed; production build passed with reduced worker/memory settings. Restart the backend if it is not running with automatic reload.


## Signup email verification update

Email signup now sends a 6-digit code and creates the User only after successful verification. Pending records expire after 10 minutes. Resends have a 60-second cooldown, and five wrong guesses require a new code. Google signup uses Google's verified email. Existing accounts remain compatible.

Run the local SMTP setup from the project root:

```powershell
powershell -NoProfile -File backend/scripts/configure-smtp.ps1
cd backend
npm run smtp:verify
```

The setup prompts for provider host, port, username, sender and a hidden password. It updates backend/.env without printing the password. No SMTP account or credentials are created automatically. For Gmail use an app password: https://support.google.com/accounts/answer/185833

Gmail selected: local SMTP_HOST=smtp.gmail.com and SMTP_PORT=465 are configured. Run the setup prompt to add your sending Gmail address and hidden app password. Until then, actual email delivery is unavailable and signup returns a delivery error.

Verification after signup OTP update: isolated MongoDB integration checks passed, including blocked login before verification, hashed pending credentials, code expiry, resend cooldown, incorrect-code limits and one-time signup verification. Live Gmail delivery awaits the sender/app password.
