# ✈️ Traveloop

> **AI-powered travel planning platform** — plan trips, build itineraries, track budgets, generate packing lists with Gemini AI, and share adventures with the community.

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=white)](https://postgresql.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
  - [1. Database Setup](#1-database-setup)
  - [2. Backend](#2-backend)
  - [3. Frontend](#3-frontend)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Contributing](#-contributing)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **🗺️ Trip Management** | Create and manage trips with start/end dates, budget, status, and visibility |
| **📍 Itinerary Builder** | Add stops with city search, dates, section types, and link activities |
| **💰 Budget Tracker** | Log expenses by category, visualize with Pie & Bar charts, over-budget alerts |
| **🎒 Smart Packing** | AI-generated packing lists via Gemini API (with offline fallback), bulk insert, toggle/reset |
| **📝 Notes** | Trip-level and stop-level notes with full CRUD |
| **🧾 Invoice** | Auto-generated invoice with PDF download (PDFKit), tax, discount, mark-as-paid |
| **🌍 Community Feed** | Share public trips, paginated community wall, avatar + cover images |
| **🔍 Search** | City & activity search with filters, popular destinations from real DB data |
| **🛡️ Admin Panel** | User management, trip oversight, analytics dashboard with charts |
| **🔐 Auth** | JWT auth, bcrypt password hashing, profile photo upload (Multer) |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Vite + React 19)         │
│  React Router v6 · Recharts · Axios · Lucide Icons  │
│                  http://localhost:5173                │
└──────────────────────────┬──────────────────────────┘
                           │ REST API (JSON)
                           │ JWT in Authorization header
┌──────────────────────────▼──────────────────────────┐
│               Backend (Express + Node.js)             │
│  express-validator · bcryptjs · jsonwebtoken          │
│  multer (photo uploads) · pdfkit (PDF generation)    │
│                  http://localhost:5000                │
└──────────────────────────┬──────────────────────────┘
                           │ pg (node-postgres)
┌──────────────────────────▼──────────────────────────┐
│                  PostgreSQL Database                  │
│         11 tables · Raw SQL (no ORM)                 │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 Prerequisites

- **Node.js** v18 or higher
- **PostgreSQL** v14 or higher (`psql` in PATH)
- **npm** v9+
- A free [Google Gemini API key](https://aistudio.google.com) *(optional — AI features have offline fallback)*

---

## 🚀 Quick Start

### 1. Database Setup

```bash
# Create the database
createdb traveloop

# Run migrations (creates 11 tables)
psql -d traveloop -f "oddo backend/traveloop-backend/migrations/001_init.sql"

# Seed reference data (25 cities, 57+ activities)
psql -d traveloop -f "oddo backend/traveloop-backend/seeds/cities.sql"
psql -d traveloop -f "oddo backend/traveloop-backend/seeds/activities.sql"

# Verify (should show 11 tables)
psql -d traveloop -c "\dt"
```

### 2. Backend

```bash
cd "oddo backend/traveloop-backend"

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env — set your DATABASE_URL and JWT_SECRET

# Start development server (port 5000)
npm run dev
```

Verify: `curl http://localhost:5000/api/health` → `{"status":"ok"}`

### 3. Frontend

```bash
cd "oddo frontend/traveloop-app"

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# .env is pre-configured for local dev — no changes needed

# Start development server (port 5173)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — register an account and start planning!

---

## 🔑 Environment Variables

### Backend — `oddo backend/traveloop-backend/.env`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5000` | HTTP server port |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string |
| `JWT_SECRET` | **Yes** | — | Secret for signing JWTs (change in production!) |
| `JWT_EXPIRES_IN` | No | `7d` | Token expiry duration |
| `CLIENT_URL` | **Yes** | `http://localhost:5173` | Frontend origin for CORS (no trailing slash) |
| `NODE_ENV` | No | `development` | Set to `production` for prod |

### Frontend — `oddo frontend/traveloop-app/.env`

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | **Yes** | Backend API base URL (e.g. `http://localhost:5000/api`) |
| `VITE_GEMINI_KEY` | No | Fallback Gemini key; users can set per-account in Profile settings |

> ⚠️ **Never commit `.env` files.** Both are in `.gitignore`. Use `.env.example` as the template.

---

## 📡 API Reference

All responses use a consistent envelope:

```json
// Success
{ "success": true, "data": { ... } }

// Success (paginated)
{ "success": true, "data": [...], "meta": { "total": 45, "page": 1, "pages": 5 } }

// Validation error (422)
{ "success": false, "errors": [{ "field": "email", "message": "..." }] }

// Error (4xx / 5xx)
{ "success": false, "error": "Human readable message" }
```

### Auth Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | No | Register new user |
| `POST` | `/api/auth/login` | No | Login, receive JWT |
| `GET` | `/api/auth/me` | JWT | Get current user profile |
| `PUT` | `/api/auth/profile` | JWT | Update profile + photo (multipart/form-data) |

### Trip Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/trips` | JWT | List user's trips (`?status=&search=&sort=`) |
| `POST` | `/api/trips` | JWT | Create trip |
| `GET` | `/api/trips/public/:id` | No | View public trip |
| `GET` | `/api/trips/:id` | JWT | Get trip by ID |
| `PUT` | `/api/trips/:id` | JWT | Update trip |
| `DELETE` | `/api/trips/:id` | JWT | Delete trip → 204 |
| `PATCH` | `/api/trips/:id/visibility` | JWT | Toggle public/private |

### Nested Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET/POST` | `/api/trips/:id/stops` | Stop management |
| `PATCH` | `/api/trips/:id/stops/reorder` | Reorder stops |
| `PUT/DELETE` | `/api/trips/:id/stops/:stopId` | Update/delete stop |
| `POST` | `/api/trips/:id/stops/:stopId/activities` | Add activity to stop |
| `GET` | `/api/trips/:id/budget` | Budget summary with charts data |
| `GET/POST/DELETE` | `/api/trips/:id/budget/expenses` | Expense CRUD |
| `GET/POST` | `/api/trips/:id/packing` | Packing list |
| `POST` | `/api/trips/:id/packing/bulk` | AI bulk insert |
| `POST` | `/api/trips/:id/packing/reset` | Mark all unpacked |
| `PATCH` | `/api/trips/:id/packing/:itemId/toggle` | Toggle packed state |
| `GET/POST/PUT/DELETE` | `/api/trips/:id/notes` | Notes CRUD (`?stop_id=` filter) |
| `GET` | `/api/trips/:id/invoice` | Get/auto-create invoice |
| `GET` | `/api/trips/:id/invoice/pdf` | Stream PDF (use `responseType: 'blob'`) |
| `PATCH` | `/api/trips/:id/invoice/pay` | Mark invoice paid |

### Other Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/search/cities` | No | Search cities (`?q=&region=&limit=`) |
| `GET` | `/api/search/cities/popular` | No | 8 popular destinations |
| `GET` | `/api/search/activities` | No | Search activities (`?q=&city_id=&category=`) |
| `GET` | `/api/community` | No | Community feed (paginated) |
| `POST` | `/api/community` | JWT | Share a public trip |
| `GET` | `/api/admin/users` | Admin | User list with search |
| `GET` | `/api/admin/trips` | Admin | All trips with status filter |
| `GET` | `/api/admin/analytics` | Admin | Platform analytics |
| `GET` | `/api/health` | No | Health check |

### Canonical Enum Values

```
Expense categories : transport | stay | activities | meals | misc
Trip statuses      : upcoming | ongoing | completed
Stop section types : travel | hotel | activity | general
Sort fields        : created_at | start_date | title
```

---

## 📁 Project Structure

```
oddo/
├── oddo backend/
│   └── traveloop-backend/
│       ├── migrations/
│       │   └── 001_init.sql          # Full schema — 11 tables
│       ├── seeds/
│       │   ├── cities.sql            # 25 cities with coordinates & costs
│       │   └── activities.sql        # 57+ activities mapped to cities
│       ├── src/
│       │   ├── app.js                # Express app, middleware, route mounting
│       │   ├── config/
│       │   │   └── db.js             # pg Pool with slow-query logger
│       │   ├── middleware/
│       │   │   ├── auth.js           # verifyToken + adminOnly
│       │   │   └── validate.js       # handleValidationErrors
│       │   ├── routes/               # One file per domain
│       │   │   ├── auth.js
│       │   │   ├── trips.js
│       │   │   ├── stops.js          # mergeParams: true
│       │   │   ├── budget.js         # mergeParams: true
│       │   │   ├── packing.js        # mergeParams: true
│       │   │   ├── notes.js          # mergeParams: true
│       │   │   ├── invoice.js        # mergeParams: true
│       │   │   ├── search.js
│       │   │   ├── community.js
│       │   │   └── admin.js
│       │   ├── controllers/          # Business logic, raw SQL queries
│       │   │   ├── authController.js
│       │   │   ├── tripsController.js
│       │   │   ├── stopsController.js
│       │   │   ├── budgetController.js
│       │   │   ├── packingController.js
│       │   │   ├── notesController.js
│       │   │   ├── invoiceController.js
│       │   │   ├── searchController.js
│       │   │   ├── communityController.js
│       │   │   └── adminController.js
│       │   └── utils/
│       │       ├── pdfGenerator.js   # PDFKit invoice generation
│       │       └── generateInvoiceNumber.js
│       ├── uploads/                  # User photo uploads (gitignored, .gitkeep)
│       ├── .env.example
│       ├── .gitignore
│       └── package.json
│
└── oddo frontend/
    └── traveloop-app/
        ├── src/
        │   ├── api/
        │   │   └── axios.js           # Axios instance, JWT interceptor, error helper
        │   ├── context/
        │   │   └── AuthContext.jsx    # Auth state, login/logout/updateUser
        │   ├── hooks/
        │   │   └── useToast.jsx       # Toast notifications
        │   ├── components/
        │   │   ├── charts/            # BudgetPieChart, BudgetBarChart
        │   │   ├── layout/            # AppLayout, Sidebar, Navbar, PrivateRoute
        │   │   ├── trips/             # TripCard, BudgetBar
        │   │   └── ui/                # Modal, Spinner, ToastContainer
        │   ├── pages/
        │   │   ├── LoginPage.jsx
        │   │   ├── RegisterPage.jsx
        │   │   ├── DashboardPage.jsx
        │   │   ├── TripsPage.jsx
        │   │   ├── CreateTripPage.jsx
        │   │   ├── TripDetailPage.jsx  # Layout w/ Outlet for child routes
        │   │   ├── ItineraryBuilderPage.jsx
        │   │   ├── BudgetPage.jsx
        │   │   ├── PackingPage.jsx
        │   │   ├── NotesPage.jsx
        │   │   ├── InvoicePage.jsx
        │   │   ├── CommunityPage.jsx
        │   │   ├── SearchPage.jsx
        │   │   ├── ProfilePage.jsx
        │   │   └── AdminPage.jsx
        │   ├── utils/
        │   │   ├── formatters.js      # formatDate (IST-safe), formatCurrency, etc.
        │   │   ├── validators.js      # Canonical enums + client-side validators
        │   │   ├── gemini.js          # Gemini API (raw fetch) + offline fallback
        │   │   └── cityImages.js      # City name → Unsplash image mapping
        │   ├── styles/
        │   │   └── globals.css        # Glassmorphism design system
        │   └── App.jsx                # Router, route tree
        ├── .env.example
        ├── .gitignore                 # Includes .env
        ├── index.html
        └── package.json
```

---

## 🛠️ Tech Stack

### Backend
| Package | Version | Purpose |
|---------|---------|---------|
| `express` | ^4.19 | HTTP framework |
| `pg` | ^8.12 | PostgreSQL client (raw SQL, no ORM) |
| `bcryptjs` | ^2.4 | Password hashing |
| `jsonwebtoken` | ^9.0 | JWT signing & verification |
| `express-validator` | ^7.2 | Request validation |
| `multer` | ^1.4 | Profile photo upload |
| `pdfkit` | ^0.15 | Invoice PDF generation |
| `helmet` | ^7.1 | Security headers |
| `cors` | ^2.8 | CORS with credentials |
| `dotenv` | ^16 | Environment configuration |

### Frontend
| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^19 | UI framework |
| `react-router-dom` | ^7 | Client-side routing |
| `axios` | ^1.16 | HTTP client with JWT interceptor |
| `recharts` | ^3 | Budget charts (Pie + Bar) |
| `lucide-react` | ^1.14 | Icon library |
| `vite` | ^8 | Build tool & dev server |

---

## 🤝 Contributing

### Git Workflow

```bash
git checkout -b feature/your-feature
# ... make changes ...
git add -A && git commit -m "feat: description"
git push origin feature/your-feature
# Open a pull request to main
```

### Commit Convention

```
feat:     New feature
fix:      Bug fix
refactor: Code restructure (no behavior change)
docs:     Documentation only
chore:    Build / tooling changes
```

### Running Tests

```bash
# Backend health check
curl http://localhost:5000/api/health

# Verify DB seed
psql -d traveloop -c "SELECT COUNT(*) FROM cities"      # → 25
psql -d traveloop -c "SELECT COUNT(*) FROM activities"  # → 57+
```

### Common Issues

| Error | Cause | Fix |
|-------|-------|-----|
| `CORS error` | Wrong `CLIENT_URL` | Set `CLIENT_URL=http://localhost:5173` (no trailing slash) |
| `JWT invalid` | `JWT_SECRET` changed | Restart backend after changing secret |
| `relation "trips" does not exist` | Migration not run | Run `001_init.sql` first |
| `multer: unexpected field` | Wrong field name | Profile photo field must be named `photo` |
| PDF download corrupted | Missing responseType | Add `{ responseType: 'blob' }` to axios call |
| `tripId undefined` in controller | Missing mergeParams | All nested routers need `{ mergeParams: true }` |
| Budget page blank | Wrong envelope access | Use `res.data.data` (axios response → envelope → inner object) |
| Expense 422 | Wrong category enum | Use `transport\|stay\|activities\|meals\|misc` (not `food`) |

---

## 📄 License

MIT — see [LICENSE](LICENSE) for details.
