# ArthVeda

ArthVeda is an AI-assisted financial planning application built with an Expo React Native frontend and a FastAPI backend.

It helps users:
- onboard with a risk/goal profile,
- explore investment instruments,
- get AI-personalized educational suggestions,
- track portfolio progress,
- maintain a transaction ledger,
- and save a personalized portfolio plan.

---

## Project Motive

The core goal of ArthVeda is to make financial planning easier, more understandable, and more actionable for everyday users.

Instead of presenting raw market data alone, ArthVeda combines:
- **guided onboarding** (risk, horizon, monthly surplus, tax preference),
- **structured investment discovery**,
- **AI-generated educational guidance**,
- **portfolio tracking and goal progress**.

This makes the app suitable for beginners while still giving enough structure for intermediate users.

---

## Main Use Cases

1. **First-time investor onboarding**
- Capture user profile and investment preferences.
- Suggest categories aligned to risk and horizon.

2. **AI planning assistant**
- User asks follow-up financial questions in chatbot.
- AI responds using user context + eligible instruments.

3. **Portfolio planning & monitoring**
- Add transactions to ledger.
- View 12-month history chart and net-worth snapshot.
- Track progress against a goal target.

4. **Instrument research & planning**
- Search and filter instruments.
- Add instruments to a persistent portfolio plan.

---

## Current Feature Set

### Authentication
- Firebase Authentication integration.
- Google Sign-In.
- Email/Password Log in + Sign up.
- Auth state persisted in app context.

### User Profile & Journey
- Stores onboarding profile (`userName`, `goalId`, `riskId`, `horizonId`, `monthlySurplus`, `taxPreference`).
- Auto-syncs authenticated user to backend (`/auth/sync`).

### Explore Tab
- Risk-profile based instrument browsing.
- Detail view per instrument.
- Professional floating CTA to open AI chat.

### Search Tab
- Search instruments by name/category/risk.
- Risk filters (`All`, `Safety`, `Income`, `Growth`).
- Watchlist UX.
- “Add to Portfolio Plan” persists per user.

### Portfolio Tab
- Net worth snapshot (invested vs P&L).
- Interactive 12-month chart (tap month for values).
- Goal progress bar.
- Add transaction form (SIP, BUY, SELL, DIVIDEND, FEE).
- Transaction ledger with filters.
- Optimistic transaction updates with pending-sync retry.

### Chatbot
- Guided setup flow (risk/horizon/surplus/tax), then **continuous chat** mode.
- Follow-up questions supported via conversation history.
- Backend `/chat` call includes profile + eligible instruments.
- Friendly fallback messages for network/quota issues.

---

## Tech Stack

### Frontend
- Expo (React Native + Web)
- Expo Router
- Firebase JS SDK
- TypeScript

### Backend
- FastAPI
- Firebase Admin SDK (token verification)
- Gemini integration (`google-genai`)
- Persistence:
  - **MongoDB** when `MONGO_URI` is configured
  - **SQLite fallback** when Mongo is not configured

---

## Repository Structure

```
Financial_Planer/
├── admin/                  # Shared content/config (copy, labels, static instrument data)
├── backend/
│   ├── app/
│   │   ├── main.py         # API routes
│   │   ├── auth.py         # Firebase token verification
│   │   ├── database.py     # Mongo/SQLite persistence layer
│   │   ├── settings.py     # env config
│   │   ├── schemas.py      # Pydantic request/response schemas
│   │   └── gemini_client.py
│   ├── data/               # SQLite DB (if using local fallback)
│   └── requirements.txt
└── frontend/
    ├── app/                # Expo Router screens
    ├── context/            # Auth + Journey contexts
    ├── lib/                # API/Firebase clients
    ├── app.json            # Expo app config
    └── package.json
```

---

## Environment Variables

### Backend (`backend/.env`)

Required:
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `ALLOW_ORIGINS`

Auth (at least one required for protected endpoints):
- `FIREBASE_SERVICE_ACCOUNT_FILE` **or**
- `FIREBASE_SERVICE_ACCOUNT_JSON`

Database:
- `MONGO_URI` (optional; if empty, SQLite fallback is used)
- `MONGO_DB_NAME`

### Frontend (`frontend/.env`)

Required:
- `EXPO_PUBLIC_API_URL` (e.g. `http://127.0.0.1:8000`)
- Firebase web app keys:
  - `EXPO_PUBLIC_FIREBASE_API_KEY`
  - `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
  - `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - `EXPO_PUBLIC_FIREBASE_APP_ID`

Google OAuth IDs (based on platforms used):
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID`

---

## Setup & Run

### 1) Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2) Frontend

```bash
cd frontend
npm install
npx expo start -c
```

For web testing, open the local URL shown by Expo (usually `http://localhost:8081`).

---

## API Overview

### Health
- `GET /health`

### Auth/User Sync
- `POST /auth/sync`

### Journey Profile
- `GET /me/profile`
- `PUT /me/profile`

### Transactions
- `GET /me/transactions`
- `POST /me/transactions`
- `POST /me/transactions/bulk`

### Portfolio Plan
- `GET /me/portfolio-plan`
- `POST /me/portfolio-plan`

### AI
- `GET /models`
- `POST /chat`

All `/me/*`, `/auth/sync`, and `/chat` endpoints require Firebase bearer token.

---

## Data Model (High Level)

- **users**: authenticated user identity snapshot
- **journey_profiles**: onboarding profile/preferences
- **transactions**: ledger entries (type/date/amount/instrument/note)
- **portfolio_plan**: saved instruments chosen by user

Storage is user-scoped by `uid`.

---

## UX Notes

- Bottom tabs include icon + label (`Home`, `Search`, `Explore`, `Portfolio`, `Profile`).
- Portfolio chart is interactive and bounded; selecting a month updates summary values.
- Explore includes a professional floating AI action button.
- Chatbot supports continuous conversation after onboarding questions.

---

## Known Issues / Limitations

1. **TypeScript check warning on native Firebase import**
- `frontend/lib/firebase.native.ts` may report:
  - `Cannot find module 'firebase/auth/react-native'...`
- This is an existing type-resolution issue and does not block web functionality.

2. **AI output constraints**
- Chat is educational and not regulatory financial advice.
- Suggestions are currently generated from app-provided instrument set.

3. **Demo market values**
- Some displayed values are simulation/demo values and not live broker data.

---

## Security Notes

- Do not commit real secrets (`.env`, service account JSON) to public repositories.
- Restrict Firebase and Gemini keys appropriately.
- Use proper CORS origin values in production (avoid `ALLOW_ORIGINS=*`).

---

## Roadmap Ideas

- Real broker/feed integration for live portfolio valuation.
- Better charting (zoom/tooltips/benchmark comparison).
- Transaction edit/delete APIs and audit trail.
- Goal templates (retirement, emergency fund, education, house).
- Notifications for SIP reminders and allocation drift.
- Advanced risk analytics and scenario stress testing.

---

## Brand

Current product name: **ArthVeda**

---

## License

Internal/Private project unless explicitly licensed otherwise.
