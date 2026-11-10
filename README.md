# EventPad Web
React + Vite + Tailwind v4 frontend for the EventPad FastAPI backend.

## Run
```bash
cp .env.example .env     # set VITE_API_URL to your API (default http://localhost:8000)
npm install
npm run dev
```
**Dev:** requests go through Vite's `/api` proxy to `VITE_API_URL`, so CORS isn't an issue locally. Restart `npm run dev` after editing `.env`.

**Production CORS:** the backend only allows `https://eventpadi-steel.vercel.app`. Add your deployed frontend URL to `allow_origins` in the backend's `main.py`.

## Structure
`src/api.js` single API client + session · `src/ui.jsx` shared bits · `src/pages/*` lazy-loaded routes.
