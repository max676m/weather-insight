# Weather Insight 🌤️

A full-stack weather application with AI-generated facts, Firebase authentication, and personalized search history.

---

## Prerequisites

Before running the app, make sure you have:

- **Node.js** v18+ (or v16+ minimum, v18 recommended)
- **Python** 3.10+
- **pip** (Python package manager)
- A **Firebase project** with:
  - Authentication → Email/Password enabled (free Spark plan)
  - Firestore Database created (Test mode is fine to start)
- API keys for [WeatherAPI.com](https://www.weatherapi.com/) and [Google AI Studio (Gemini)](https://aistudio.google.com/apikey)

---

## Environment Setup

Each service reads its config from a `.env` file. **Never commit these files to Git.**

### Frontend — `frontend/.env`

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

> Get these from: Firebase Console → Your Project → Project Settings → Your Apps → Web App Config

### Backend — `backend/.env`

```env
WEATHER_API_KEY=your_weatherapi_key
AI_SERVICE_URL=http://localhost:8000
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nABC...\n-----END PRIVATE KEY-----\n"
```

> Get Firebase Admin credentials from: Firebase Console → Project Settings → Service Accounts → Generate New Private Key

⚠️ Keep `FIREBASE_PRIVATE_KEY` in double-quotes to preserve the `\n` newline characters.

### AI Service — `ai-service/.env`

```env
GEMINI_API_KEY=your_gemini_key
```

---

## Running Services Individually

Open a separate terminal for each service.

### 1. Frontend (React + Vite) — Port 5173

```bash
cd frontend
npm install        # first time only
npm run dev
```

Open: http://localhost:5173

### 2. Backend (Node.js + Express) — Port 3001

```bash
cd backend
npm install        # first time only
node server.js
```

API available at: http://localhost:3001

### 3. AI Service (Python + FastAPI) — Port 8000

```bash
cd ai-service
pip install -r requirements.txt   # first time only
uvicorn main:app --reload --port 8000
```

API available at: http://localhost:8000

---

## Running All Services Together

Open **3 terminal windows** and run each command above in its own terminal simultaneously.

**Suggested order:**
1. Start the AI service first (slowest to boot)
2. Start the backend
3. Start the frontend last

Once all three are running, open http://localhost:5173 in your browser.

---

## Firebase Setup (One-Time)

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Navigate to **Authentication** → **Sign-in method** → Enable **Email/Password**.
3. Navigate to **Firestore Database** → **Create database** → Start in **Test mode**.
4. Navigate to **Project Settings** → **Your Apps** → Add a Web App → copy the config into `frontend/.env`.
5. Navigate to **Project Settings** → **Service Accounts** → **Generate new private key** → use values in `backend/.env`.

> All of the above is available on the **free Spark plan** — no billing required.

---

## Architecture

```
frontend/ (React + Vite :5173)
    │  Firebase Auth (client-side)
    │  Firestore (search history per user)
    │
    └──→  backend/ (Express :3001)
              │  Firebase Admin (token verification)
              ├──→ WeatherAPI.com
              └──→ ai-service/ (FastAPI :8000)
                        └──→ Google Gemini AI
```

---

## Key Features (V2)

| Feature | Description |
|---|---|
| 🔐 Auth | Email/password login & sign-up via Firebase |
| 🛡️ Protected API | Backend verifies Firebase ID tokens on every request |
| 🕐 Search History | Last 5 searches saved per user in Firestore, clickable to re-search |
| 👤 Profile | View account info and sign out |
| 🌤️ Weather | Live weather, air quality, and AI-generated facts per location |
