# Deployment

## 1. Before deploying

1. Fix the MongoDB Atlas authentication error currently preventing the backend from starting locally.
2. In MongoDB Atlas, add the production backend's outbound IP range to Network Access. For an initial Render/Railway deployment, `0.0.0.0/0` is the simplest option, but restrict it later when a stable egress range is available.
3. Confirm the Atlas database user has access to the `resumeAnalyzer` database.
4. Push this repository to GitHub. The root `.gitignore` excludes `.env`; never commit the real `.env` file.

## 2. Deploy the backend to Render

1. Create a new **Web Service** in Render and connect the repository.
2. Set **Root Directory** to `server`.
3. Set **Runtime** to `Node`.
4. Set **Build Command** to `npm install`.
5. Set **Start Command** to `npm start`.
6. Add these environment variables in Render's Environment page. Paste the values from your private local `.env`; do not commit them:

```text
GEMINI_API_KEY
RAPIDAPI_KEY
MONGO_URI
JWT_SECRET
CLIENT_URL=https://YOUR-VERCEL-APP.vercel.app
```

7. Deploy and verify:

```text
https://YOUR-RENDER-SERVICE.onrender.com/api/health
```

Expected response:

```json
{"status":"ok"}
```

Railway uses the same `npm install` build command, `npm start` start command, `server` root directory, and environment variable names.

## 3. Deploy the frontend to Vercel

1. Create a new Vercel project from the same repository.
2. Set **Root Directory** to `client`.
3. Framework preset: **Vite**.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Add this environment variable in Vercel:

```text
VITE_API_URL=https://YOUR-RENDER-SERVICE.onrender.com/api
```

7. Deploy the frontend.
8. Copy the final Vercel URL into the backend's `CLIENT_URL` variable in Render/Railway and redeploy the backend.

The backend now accepts the configured `CLIENT_URL` and rejects browser origins not listed there. The local default remains `http://localhost:5173` when `CLIENT_URL` is absent.

## 4. Live verification checklist

1. Open the Vercel URL.
2. Create an account with a new email and password.
3. Sign in and confirm the dashboard loads.
4. Upload a readable PDF or DOCX under 5 MB.
5. Paste a real job description and run analysis.
6. Confirm the score, matched skills, missing skills, ATS issues, and suggestions appear.
7. Open Job Matches and confirm results have real company names and direct apply links.
8. Refresh the page and confirm authenticated API requests still work.
9. Open the browser network panel and confirm requests go to the deployed backend, not `localhost`.
10. Confirm MongoDB contains the user, resume, analysis, and job-cache records.

## Important production notes

- Rotate the exposed credentials from the original local `.env` before making the repository public. They were included in the initial setup prompt and should be treated as compromised.
- Use a strong new `JWT_SECRET` in the hosting dashboard.
- Keep `CLIENT_URL` set to the exact Vercel origin, without a trailing slash.
- Never place `GEMINI_API_KEY`, `RAPIDAPI_KEY`, `MONGO_URI`, or `JWT_SECRET` in `client` variables or frontend source code.
