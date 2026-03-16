# Weather Insight — Implementation Tasks

## Phase 1 — Frontend (React) ✅
- [x] Initialize React app with Vite in `frontend/`
- [x] Build search UI (input, button, results section)
- [x] Implement API call to Node.js backend
- [x] Display weather data and AI-generated facts
- [x] Style with premium, modern design (dark theme, glassmorphism, animations)

## Phase 2 — Backend API (Node.js + Express) ✅
- [x] Initialize Node.js project in `backend/`
- [x] Create `GET /api/location-info` endpoint
- [x] Integrate external weather API (WeatherAPI.com)
- [x] Integrate AI microservice call (`POST /generate-facts`)
- [x] Return unified JSON response to frontend
- [x] Install npm dependencies

## Phase 3 — AI Service (Python FastAPI) ✅
- [x] Initialize Python project in `ai-service/`
- [x] Create `POST /generate-facts` endpoint
- [x] Implement fact generation logic (2 positive, 1 negative)
- [x] Install Python dependencies (compatible with Python 3.13)
- [x] Add retry logic for Gemini rate limits

## Phase 4 — Integration & Verification ✅
- [x] Flip `USE_MOCK` to `false` in frontend
- [x] Add API keys to `.env` files
- [x] Test end-to-end flow — weather data works perfectly
- [x] AI facts: code correct, Gemini key rate-limited (429)

## Startup Commands

```bash
# Terminal 1 — AI Service
cd ai-service && uvicorn main:app --reload --port 8000

# Terminal 2 — Backend
cd backend && node server.js

# Terminal 3 — Frontend
cd frontend && npm run dev
```
