# CABROY Academy

React frontend and Express API in separate directories.

```text
frontend/       React + Vite app, assets and browser checks
backend/        Express API, database models and backend tests
render.yaml     Render backend configuration
```

## Local development

Install dependencies from the repository root:

```powershell
npm run install:all
```

Create frontend/.env from frontend/.env.example and backend/.env from backend/.env.example. Keep real secrets private. Start in separate terminals:

```powershell
npm run dev
npm run dev:backend
```

Frontend build: npm run build. Output: frontend/dist. Frontend commands can also run directly inside frontend/.

## Hosting

| Setting | Frontend | Backend |
| --- | --- | --- |
| Root directory | frontend | backend |
| Install | npm ci | npm ci |
| Build | npm run build | npm ci |
| Start | Static hosting | npm start |
| Output | dist | Not applicable |

For Cloudflare Pages or Vercel, select frontend as the project root. On Vercel choose Vite. The backend Render root stays backend.

See [DEPLOYMENT.md](DEPLOYMENT.md) for environment variables, domain setup and remaining email/storage deployment requirements.

## Browser checks

Run browser scripts from frontend after building; for example node scripts/check-responsive.mjs.
