# EventPad Web
React + Vite + Tailwind v4 frontend for the EventPad FastAPI backend.

## Run
```bash
cp .env.example .env     # set VITE_API_URL to your API (default http://localhost:8000)
npm install
npm run dev
```
**CORS:** the backend only allows `https://eventpadi-steel.vercel.app`. Add `http://localhost:5173` to `allow_origins` in the backend's `main.py` for local dev.

## Structure
`src/api.js` single API client + session · `src/ui.jsx` shared bits · `src/pages/*` lazy-loaded routes.
