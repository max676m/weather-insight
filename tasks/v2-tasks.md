# Weather Insight V2 — Task Checklist

> Reference: [implementation-plan-v2.md](../specs/implementation-plan-v2.md)

---

## 🔧 Setup & Config

- [x] Verify `frontend/.env` has all 6 `VITE_FIREBASE_*` variables populated
- [x] Verify `backend/.env` has `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- [x] Ensure both `.env` files are listed in `.gitignore`

---

## 📦 Dependencies

- [x] `cd frontend && npm install firebase react-router-dom`
- [x] `cd backend && npm install firebase-admin`

---

## 🖥️ Frontend

### Firebase Initialization
- [x] Create `frontend/src/firebase.js` — init Firebase App, export `auth` and `db`

### Auth Context
- [x] Create `frontend/src/contexts/AuthContext.jsx` — `AuthProvider` + `useAuth()` hook

### Routing & Pages
- [x] Modify `frontend/src/App.jsx` — wrap with `AuthProvider`, `BrowserRouter`, define routes
- [x] Create `frontend/src/pages/LoginPage.jsx` — sign-up / sign-in form
- [x] Create `frontend/src/pages/HomePage.jsx` — main weather search (moved from `App.jsx`)
- [x] Create `frontend/src/pages/ProfilePage.jsx` — email, blank avatar, logout button

### Components
- [x] Create `frontend/src/components/Header.jsx` — logo + user icon linking to `/profile`
- [x] Create `frontend/src/components/ProtectedRoute.jsx` — redirect to `/login` if not authenticated
- [x] Create `frontend/src/components/SearchHistory.jsx` — display last 5 search chips

### Search & History Logic (in `HomePage.jsx`)
- [x] Attach Firebase ID token to all `fetch` calls to the backend
- [x] On successful search: save location to Firestore `users/{uid}/history` (keep last 5)
- [x] On page load: fetch and display history from Firestore

### Styling
- [x] Add CSS for Header, Login, Profile, SearchHistory to `index.css`

---

## 🔒 Backend

- [x] Create `backend/firebaseAdmin.js` — init Firebase Admin SDK from env vars
- [x] Create `backend/middleware/authMiddleware.js` — verify Bearer token, attach `req.uid`
- [x] Modify `backend/server.js` — apply `authMiddleware` to `GET /api/location-info`

---

## 📖 Documentation

- [x] Create `README.md` in project root with:
  - [x] Prerequisites (Node 18+, Python 3.10+)
  - [x] Environment setup instructions and `.env.example` references
  - [x] Commands to run each service individually
  - [x] Commands to run all services together
  - [x] Firebase setup notes (free Spark plan)

---

## ✅ Verification

- [ ] Navigate to `http://localhost:5173` → should redirect to `/login`
- [ ] Create account and log in → should land on home page
- [ ] Click user icon → profile page shows email + blank avatar
- [ ] Perform 6 searches → only last 5 shown in history
- [ ] Refresh page → history still shows (persisted in Firestore)
- [ ] Call API without token → should return `401 Unauthorized`
- [ ] Logout → should redirect to `/login`
