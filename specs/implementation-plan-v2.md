# Weather Insight V2 — Implementation Plan

Upgrade from a public weather lookup tool to an authenticated, personalized experience using Firebase. Only logged-in users can search for weather. Their last 5 searches are stored in Firestore and displayed in the UI.

---

## Credential Security

> [!CAUTION]
> **Never commit Firebase keys or Service Account JSON files to Git.**
> Firebase credentials are sensitive — a leaked service account key grants full admin access to your Firebase project.

### Sharing Credentials Securely
- **Firebase Web Config** (Frontend) → Store in `frontend/.env` as individual variables. Never paste the raw JSON into source code.
- **Service Account Key** (Backend) → Store each field from the downloaded JSON as individual variables in `backend/.env`.
- **How to share with teammates** → Use a secure private channel (e.g., encrypted password manager). Never send via email, Slack, or GitHub.

**Required `.env` variables:**

`frontend/.env`
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

`backend/.env`
```
WEATHER_API_KEY=...
AI_SERVICE_URL=http://localhost:8000
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

> [!NOTE]
> The `FIREBASE_PRIVATE_KEY` must be kept in double quotes in the `.env` file to preserve its newline characters.

---

## Proposed Changes

### Frontend

*Segregated into dedicated files per concern — no crammed single-file approach.*

#### [MODIFY] `frontend/package.json`
- Add `firebase` and `react-router-dom`.

#### [NEW] `frontend/src/firebase.js`
- Reads env variables, initializes the Firebase App, exports `auth` and `db` (Firestore) instances.

#### [NEW] `frontend/src/contexts/AuthContext.jsx`
- Wraps the app with `AuthProvider`, exposes `useAuth()` hook.
- Listens to `onAuthStateChanged` to keep user state in sync.

#### [NEW] `frontend/src/pages/LoginPage.jsx`
- Full-page login/sign-up form using `createUserWithEmailAndPassword` and `signInWithEmailAndPassword`.
- Redirects to `/` on success.

#### [NEW] `frontend/src/pages/ProfilePage.jsx`
- Shows user's email, blank circular avatar, and a Logout button.

#### [NEW] `frontend/src/pages/HomePage.jsx`
- Protected page: pulls weather search UI out of `App.jsx` into its own file.
- Fetches and renders the last 5 search history items from Firestore.
- Attaches Firebase ID token to every backend API call.

#### [NEW] `frontend/src/components/Header.jsx`
- Shows the app title/logo on the left.
- Shows a user avatar icon on the right that links to `/profile`.

#### [NEW] `frontend/src/components/SearchHistory.jsx`
- Renders the last 5 searches as clickable chips/cards below the search bar.

#### [NEW] `frontend/src/components/ProtectedRoute.jsx`
- HOC that redirects unauthenticated users to `/login`.

#### [MODIFY] `frontend/src/App.jsx`
- Wraps everything with `AuthProvider` and `BrowserRouter`.
- Defines routes: `/login` → `LoginPage`, `/profile` → `ProfilePage`, `/` → `ProtectedRoute > HomePage`.

---

### Backend

#### [MODIFY] `backend/package.json`
- Add `firebase-admin`.

#### [NEW] `backend/firebaseAdmin.js`
- Initializes the Firebase Admin SDK using env variables.
- Exports the `admin` instance.

#### [NEW] `backend/middleware/authMiddleware.js`
- Pulls `Authorization: Bearer <token>` from request headers.
- Calls `admin.auth().verifyIdToken(token)` to validate.
- Attaches `req.uid` on success; responds `401` on failure.

#### [MODIFY] `backend/server.js`
- Imports and applies `authMiddleware` to `GET /api/location-info`.

---

### New Root File

#### [NEW] `README.md` (project root)
Sections to include:
1. **Prerequisites** — Node 18+, Python 3.10+, Firebase project setup.
2. **Environment Setup** — Where to place `.env` files, reference to `.env.example`.
3. **Running Individually** — Commands for each of the 3 services.
4. **Running All Together** — Instructions to open 3 terminals.
5. **Firebase Setup** — Enable Auth and Firestore in Console (free Spark plan).

---

## Database Schema (Firestore)

```
users/ (collection)
  └── {uid} (document)
        └── history: ["London", "Paris", "Tokyo", "Dubai", "New York"]  ← max 5 items
```

- After each search, prepend the new location and keep only the last 5.
- All Firestore writes happen from the **frontend** (user is already authenticated).

---

## Verification Plan

### Manual Verification (via browser)
1. Navigate to `http://localhost:5173` — verify redirect to `/login`.
2. Create a new account → verify redirect to home page.
3. Click User Icon → verify Profile page shows email and blank avatar.
4. Perform 6 searches → verify only the last 5 appear in history.
5. Refresh the page → verify history persists (loaded from Firestore).
6. `curl http://localhost:3001/api/location-info?location=London` without a token → verify `401 Unauthorized`.
7. Click Logout → verify redirect back to `/login`.
