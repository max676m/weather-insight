# Weather Insight — Implementation Plan (V1)

Build a three-service web application (React + Node.js + Python FastAPI) per the constitution and specification.

## Architecture

```
frontend/ (React + Vite)  →  backend/ (Express :3001)  →  WeatherAPI.com
                                      ↕
                              ai-service/ (FastAPI :8000)  →  Gemini AI
```

## Services

### Frontend — `frontend/`
- React 18 + Vite 4, dev proxy to `:3001`
- Search bar → calls `GET /api/location-info?location=X`
- Displays weather card + AI facts
- Dark theme, glassmorphism, animated blobs

### Backend — `backend/`
- Express on port 3001
- `GET /api/location-info` — calls WeatherAPI.com + AI service, returns unified JSON
- Env: `WEATHER_API_KEY`, `AI_SERVICE_URL`

### AI Service — `ai-service/`
- FastAPI on port 8000
- `POST /generate-facts` — uses Gemini 2.0 Flash to generate 3 facts (2 positive, 1 negative)
- Env: `GEMINI_API_KEY`

## API Contracts

### `GET /api/location-info?location=Paris` → Unified response:
```json
{
  "location": "Paris",
  "country": "France",
  "weather": { "temperature_c": 11, "condition": "Overcast", "humidity": 66, "wind_kph": 9.4 },
  "air_quality": { "pm2_5": 16.05, "pm10": 20.65 },
  "facts": ["Fact 1", "Fact 2", "Fact 3"]
}
```

### `POST /generate-facts` → `{ "facts": ["...", "...", "..."] }`

## Required API Keys
1. **WeatherAPI.com** — free at https://www.weatherapi.com/
2. **Google Gemini** — free at https://aistudio.google.com/apikey
