# EvenPad!!
React + Vite frontend for the FastAPI Event-Ticketing-System.

    npm install
    npm run dev        # serves on http://127.0.0.1:5500 (matches the CORS origin in main.py)

Start the API first: `uvicorn main:app --reload` (default http://127.0.0.1:8000, change under Settings).
Endpoints and form fields are discovered from the API's /openapi.json at runtime.
