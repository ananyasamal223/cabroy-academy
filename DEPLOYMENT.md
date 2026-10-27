# Free deployment: CABROY

Status: source code is published at https://github.com/ananyasamal223/cabroy-academy. Hosting has not been deployed.

## 1. GitHub
The repository is PUBLIC, as requested. Its root contains frontend, backend, render.yaml and this file. Keep local .env files private and out of commits.

Before uploading, exclude .env files, node_modules, dist, uploads, database exports, logs, browser profiles and credentials. The .gitignore now excludes the known local secrets and test profiles. Check the selected files before the first commit; ignore rules do not remove already tracked files. Keep .env.example templates.

## 2. MongoDB Atlas
Create a Free cluster and database user. Copy its connection string directly into Render MONGODB_URI, including a database name. Keep it out of GitHub and chat. Allow the Render service outbound IP ranges in Atlas Network Access. Existing local courses, users and purchases need a deliberate database migration; a new cluster starts empty.

## 3. Render backend
Connect GitHub and use New > Blueprint with render.yaml, or create a Web Service manually:
- Root directory: backend
- Build: npm ci
- Start: npm start
- Plan: Free
- Health check: /api/health
- Environment: NODE_ENV=production; MONGODB_URI; long random JWT_SECRET; CLIENT_URL containing exact frontend origins separated by commas.

Set CLIENT_URL to include the actual frontend deployment URL as well as https://codeexampler.com and https://www.codeexampler.com. Never use wildcard CORS for authenticated requests.

## 4. Frontend
Cloudflare Pages is the default frontend choice; Vercel is an alternative. Connect the same GitHub repository. Root: frontend. Build: npm run build. Output: dist. Install: npm ci. Use Node 22.16 or a compatible newer version.

Set VITE_API_URL to https://YOUR-ACTUAL-SERVICE.onrender.com/api initially. Set VITE_GOOGLE_CLIENT_ID only if Google login is configured. Rebuild after changing frontend environment variables. VITE variables are public: never put secrets in them. Configure SPA fallback to index.html so /courses and /landing load directly.

## 5. Cloudflare domain
First verify frontend and backend deployment URLs. Add codeexampler.com in frontend hosting Custom Domains, then use the DNS records that host supplies. Add api.codeexampler.com in Render Custom Domains and follow its exact CNAME instructions. Start API verification with DNS-only mode. Remove conflicting root records only after the new frontend is ready. Do not change mail records. Finally set VITE_API_URL=https://api.codeexampler.com/api and rebuild.

## Required before everything works
- Email: HTTPS Resend support is implemented. Set server-only RESEND_API_KEY and EMAIL_FROM for a verified sender domain. Render Free blocks common SMTP ports, so leave hosted SMTP unset. Sender DNS verification and a real inbox delivery test remain required. Do not disable account verification.
- Uploads: set UPLOAD_STORAGE=gridfs (configured in render.yaml) to store new uploads in MongoDB, surviving backend restarts. Existing local uploads still need migration with their original filenames. Atlas storage limits include uploaded files: keep course videos on external storage and monitor usage.
- Payments: configure server-only RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET. Test with test keys first; real payments incur processor fees and require an activated account.
- Google login: configure GOOGLE_CLIENT_ID on backend and matching VITE_GOOGLE_CLIENT_ID on frontend; register exact live origins in Google.
- Admin: create the admin securely using backend npm run create-admin with private environment values. Do not publish example passwords.
- Proxy: TRUST_PROXY_HOPS=1 is configured for Render direct/DNS-only API routing. Review this if you enable Cloudflare proxying or add another reverse proxy.
- Test registration email, login/logout, password reset, course data, test purchase, enrollment, protected downloads, counselling, admin uploads and direct route refreshes on actual live URLs.

Render Free sleeps after 15 minutes of inactivity and can take about a minute to wake. The current frontend request timeout is 15 seconds, so a sleeping backend may require retry. This setup is for testing; it is not an always-on production guarantee.

## Official references
- https://render.com/docs/free
- https://render.com/docs/blueprint-spec
- https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/
- https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/
