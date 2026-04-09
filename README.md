# ArthVeda

ArthVeda is an AI-assisted financial planning platform built as a full-stack project with:
- an **Expo (React Native + Web) frontend**
- a **FastAPI backend**
- **Firebase Authentication**
- **Gemini-powered AI chat guidance**
- **user-scoped data persistence** (MongoDB preferred, SQLite fallback)

It helps users onboard, discover investment categories, track portfolio progress, and interact with an AI assistant using their personal context.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Problem Statement and Motive](#problem-statement-and-motive)
3. [Who This App Is For](#who-this-app-is-for)
4. [Core Use Cases](#core-use-cases)
5. [Feature Walkthrough](#feature-walkthrough)
6. [Architecture](#architecture)
7. [Tech Stack](#tech-stack)
8. [Repository Structure](#repository-structure)
9. [Environment Variables](#environment-variables)
10. [End-to-End Local Setup](#end-to-end-local-setup)
11. [How the Main Flows Work](#how-the-main-flows-work)
12. [Backend API Reference](#backend-api-reference)
13. [Data Model](#data-model)
14. [Error Guide and Troubleshooting](#error-guide-and-troubleshooting)
15. [Security and Production Notes](#security-and-production-notes)
16. [Known Limitations](#known-limitations)
17. [Roadmap](#roadmap)
18. [Branding](#branding)
19. [License](#license)

---

## Project Overview

ArthVeda combines guided onboarding + AI assistance + portfolio tracking in one experience.

At a high level, users can:
- create an account or log in with Google/email-password
- store and update their profile and financial preferences
- browse suitable investment categories
- save portfolio planning choices
- add transaction entries to build a ledger
- view portfolio history charts and goal progress
- chat continuously with AI for contextual planning suggestions

---

## Problem Statement and Motive

Many beginners want to invest but struggle with:
- unclear risk alignment
- fragmented tools
- generic advice not personalized to their situation
- lack of a simple plan-to-action workflow

ArthVeda’s motive is to make financial planning approachable while still structured:
- onboarding captures user context (goal, risk, horizon, monthly surplus)
- discovery screens map that context to curated instruments
- chat layer explains tradeoffs and next steps in simple language
- portfolio and transaction data creates continuity over time

---

## Who This App Is For

- First-time or early-stage investors
- Users who want guided planning rather than raw market terminals
- Learners who prefer AI-assisted explanation of options
- Teams building an MVP for fintech advisory workflows

---

## Core Use Cases

1. **Account onboarding and personalization**
- User signs up/logs in
- App syncs identity with backend
- User profile is stored and reused across screens

2. **Investment discovery**
- User explores instruments by risk orientation
- User inspects details and saves choices into portfolio plan

3. **Portfolio tracking**
- User adds transactions (SIP, BUY, SELL, DIVIDEND, FEE)
- Ledger updates persist per user
- History chart and net worth snapshot update from stored data

4. **AI planning conversation**
- Guided initial prompts + open-ended follow-up chat
- Responses use profile and eligible instrument context

---

## Feature Walkthrough

### 1) Authentication
- Firebase Authentication integrated in frontend
- Supports:
  - Email/Password Sign up
  - Email/Password Log in
  - Google Sign-In
- Backend verifies Firebase ID token for protected endpoints

### 2) User and Profile Sync
- On successful auth, frontend triggers `POST /auth/sync`
- Backend stores/updates user identity snapshot
- Onboarding/profile is stored with `GET/PUT /me/profile`

### 3) Home/Onboarding UX
- Personalization prompt captures user profile details
- These details drive recommendations and chat prompts

### 4) Explore and Search
- Explore: risk-profile oriented instrument browsing
- Search: query and filter instruments
- Save-to-plan action persists selected items to backend

### 5) Portfolio Planner
- Net worth summary (invested value + P&L)
- Goal progress visualization
- Transaction entry form with validation
- User-specific ledger view with filters
- Portfolio history chart for past months

### 6) AI Chatbot
- Initial guided flow (horizon, monthly investable amount, tax preference)
- Continuous conversation mode after setup
- Sends conversation and context to backend `/chat`
- Friendly error handling when AI/network issues occur

---

## Architecture

### System Components

1. **Frontend (Expo app)**
- Screens/routes, contexts, UI state, Firebase client auth
- Calls backend APIs with Firebase bearer token

2. **Backend (FastAPI)**
- Token-protected routes for profile/transactions/plan
- AI orchestration endpoint for chat
- Database abstraction with Mongo/SQLite

3. **Firebase**
- User authentication provider
- ID token issuance and verification flow

4. **Data Store**
- MongoDB (recommended for multi-user environments)
- SQLite fallback for quick local development

### Request Flow (Simplified)

1. User logs in on frontend
2. Frontend receives Firebase ID token
3. Frontend calls protected backend route with `Authorization: Bearer <token>`
4. Backend verifies token and extracts `uid`
5. Backend performs user-scoped DB operations
6. Frontend updates UI with persisted result

---

## Tech Stack

### Frontend
- Expo
- React Native + Web
- Expo Router
- TypeScript
- Firebase JS SDK

### Backend
- FastAPI
- Uvicorn
- Pydantic
- Firebase Admin SDK
- Gemini (`google-genai`)
- PyMongo + SQLite

---

## Repository Structure

```text
Financial_Planer/
├── admin/
│   └── content.ts                  # Shared content/config, labels, and instrument metadata
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI routes
│   │   ├── auth.py                 # Firebase token verification
│   │   ├── database.py             # Mongo/SQLite persistence layer
│   │   ├── settings.py             # Environment config
│   │   ├── schemas.py              # Pydantic schemas
│   │   └── gemini_client.py        # Gemini integration
│   ├── data/                       # SQLite files (fallback mode)
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── app/                        # Expo Router screens
│   ├── context/                    # Auth + journey contexts
│   ├── lib/                        # API and Firebase helpers
│   ├── package.json
│   └── .env
└── README.md
```

---

## Environment Variables

### Backend (`backend/.env`)

Minimum required:
- `GEMINI_API_KEY=<your_key>`
- `GEMINI_MODEL=<model_name>` (example: `gemini-1.5-flash`)
- `ALLOW_ORIGINS=http://localhost:8081,http://127.0.0.1:8081`

Firebase admin (one of these required):
- `FIREBASE_SERVICE_ACCOUNT_FILE=/absolute/path/to/service-account.json`
- OR `FIREBASE_SERVICE_ACCOUNT_JSON={...json...}`

Database:
- `MONGO_URI=` (optional; if blank, SQLite fallback is used)
- `MONGO_DB_NAME=arthveda`

Optional debug/config knobs (if present in codebase):
- app-specific flags defined in `backend/app/settings.py`

### Frontend (`frontend/.env`)

Backend URL:
- `EXPO_PUBLIC_API_URL=http://127.0.0.1:8000`

Firebase web config:
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

Google OAuth client IDs (as needed by target platform):
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID`

---

## End-to-End Local Setup

### Prerequisites
- Python `3.11+`
- Node.js `20+`
- npm
- Firebase project configured (Auth + web app + service account)
- Optional: MongoDB instance if you do not want SQLite fallback

### 1) Clone repository

```bash
git clone <your-repo-url>
cd Financial_Planer
```

### 2) Configure backend env

Create or update `backend/.env` with all required keys.

Example:

```env
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-1.5-flash
ALLOW_ORIGINS=http://localhost:8081,http://127.0.0.1:8081
FIREBASE_SERVICE_ACCOUNT_FILE=/Users/you/keys/firebase-admin.json
MONGO_URI=
MONGO_DB_NAME=arthveda
```

### 3) Configure frontend env

Create or update `frontend/.env`.

Example:

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=...
```

### 4) Start backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Verify backend:
- Open `http://127.0.0.1:8000/health`
- Expected response: `{"status":"ok"}`

### 5) Start frontend

Open a new terminal:

```bash
cd frontend
npm install
npx expo start -c
```

For web testing:
- Open URL shown by Expo (usually `http://localhost:8081`)

### 6) Functional smoke test

1. Open `/login`
2. Create account or sign in
3. Confirm profile loads at `/profile`
4. Add one transaction in `/portfolio`
5. Check ledger updates immediately
6. Save one instrument from `/search` or `/explore`
7. Open `/chatbot` and send a follow-up question

---

## How the Main Flows Work

### Auth and Sync

1. User logs in via Firebase
2. Frontend receives auth state and token
3. Frontend calls `POST /auth/sync`
4. Backend upserts user by `uid`
5. Profile and other data become user-scoped

### Transaction Save + Portfolio Refresh

1. User submits add-transaction form
2. Frontend sends `POST /me/transactions`
3. Backend validates and stores record with current `uid`
4. Frontend reloads or merges transaction list
5. Chart/summary recompute from updated data

### AI Chat

1. Frontend packages conversation history + profile context
2. Sends `POST /chat` with token
3. Backend composes prompt + calls Gemini client
4. Reply sent to frontend and appended to conversation

---

## Backend API Reference

### Public
- `GET /health` - service status
- `GET /models` - available AI model information (if enabled)

### Protected (Firebase bearer token required)

#### Auth
- `POST /auth/sync`
  - Sync authenticated user data into backend DB

#### Profile
- `GET /me/profile`
  - Get current user onboarding/profile
- `PUT /me/profile`
  - Create or update onboarding/profile

#### Transactions
- `GET /me/transactions`
  - Get ledger entries for current user
- `POST /me/transactions`
  - Add a single transaction
- `POST /me/transactions/bulk`
  - Bulk add transactions

#### Portfolio Plan
- `GET /me/portfolio-plan`
  - Get saved plan instruments
- `POST /me/portfolio-plan`
  - Add/update plan entries

#### AI Chat
- `POST /chat`
  - Generate AI response from user context and conversation

---

## Data Model

High-level logical entities:

1. `users`
- `uid`, `email`, `name`, `photo_url`, timestamps

2. `journey_profiles`
- `uid`
- `userName`, `goalId`, `riskId`, `horizonId`, `monthlySurplus`, `taxPreference`

3. `transactions`
- `uid`
- `type` (`SIP`, `BUY`, `SELL`, `DIVIDEND`, `FEE`)
- `instrument`, `amount`, `date`, `note`

4. `portfolio_plan`
- `uid`
- selected instruments and related plan attributes

All financial/planning data is user-scoped by Firebase `uid`.

---

## Error Guide and Troubleshooting

### 1) `Error 401: invalid_client` (Google OAuth)
Cause:
- Wrong OAuth client ID used in frontend env.

Fix:
1. Open Google Cloud Console -> OAuth Client
2. Copy correct Web client ID
3. Put it in `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
4. Restart frontend (`npx expo start -c`)

### 2) `Error 400: redirect_uri_mismatch`
Cause:
- OAuth redirect URI sent by app does not exactly match configured redirect URI.

Important:
- **Authorized JavaScript origins** and **Authorized redirect URIs** are different fields.
- Redirect URI must be in **Authorized redirect URIs**, exact match.

Fix:
1. In Google Cloud OAuth client, add the exact redirect URI being requested
2. Save
3. Wait 1-2 minutes
4. Restart app and retry login

### 3) Firebase `auth/operation-not-allowed`
Cause:
- Sign-in provider not enabled in Firebase Auth.

Fix:
1. Firebase Console -> Authentication -> Sign-in method
2. Enable the provider used (Google / Email-Password)
3. Save and retry

### 4) Backend `500 Internal Server Error` on `/me/profile` or `/auth/sync`
Common causes:
- Invalid/missing Firebase Admin credentials
- DB schema mismatch from older local SQLite
- Missing required env vars

Fix checklist:
1. Verify `FIREBASE_SERVICE_ACCOUNT_FILE` path is valid
2. Check backend logs for traceback origin
3. Recheck `backend/.env`
4. If using old SQLite, remove stale DB and restart (only for local/dev)

### 5) Frontend `Failed to fetch` while saving transaction
Cause:
- Backend not running or wrong API URL/host mismatch.

Fix:
1. Confirm backend is running at `http://127.0.0.1:8000`
2. Set `EXPO_PUBLIC_API_URL` accordingly
3. Ensure CORS `ALLOW_ORIGINS` includes frontend origin
4. Restart frontend with `-c`

### 6) Git push errors (`src refspec main does not match any`)
Cause:
- No commit exists yet on `main`.

Fix:
```bash
git add .
git commit -m "initial commit"
git push -u origin main
```

### 7) GitHub auth error (`Invalid username or token`)
Cause:
- Password auth over HTTPS is not supported.

Fix:
1. Create GitHub Personal Access Token (classic or fine-grained)
2. Use token as password when pushing over HTTPS

Token location:
- GitHub -> Settings -> Developer settings -> Personal access tokens

---

## Security and Production Notes

1. Never commit secrets:
- `.env`
- Firebase service account JSON
- private API keys

2. Recommended production hardening:
- Strict CORS origins
- Rotate secrets regularly
- Use managed Mongo with auth + IP/network controls
- Add rate limiting on AI/chat endpoints
- Add request logging and monitoring

3. Compliance note:
- AI responses are educational and not legal/regulated financial advice.

---

## Known Limitations

1. Some market values and projections are demo/simulated.
2. No live broker integration in current version.
3. TypeScript native Firebase type-resolution warning may appear in some setups.
4. Advanced analytics (benchmarking, rebalance recommendations) are still limited.

---

## Roadmap

1. Live market data integration and real-time valuation.
2. Edit/delete transaction support with audit logs.
3. Richer charting (hover tooltips, zoom, comparison overlays).
4. Portfolio rebalance suggestions and drift alerts.
5. Export statements (CSV/PDF) and tax reports.
6. Notification system (SIP reminders, milestone alerts).
7. Role-based admin panel for instrument curation.

---

## Branding

- Product name: **ArthVeda**
- AI assistant naming in app: **ArthVeda AI Chat**

---

## License

This repository is private/internal unless a license is explicitly added.
