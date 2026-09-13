# Pulse — React Frontend

This is the React + Vite frontend for the Issue Tracker project, implementing the **Linear Craft Engine** design system.

## Quick Start (Development)

You need **two terminals** running simultaneously:

### Terminal 1 — Spring Boot Backend
```bash
# From project root
./gradlew bootRun
# Runs on http://localhost:8090
```

### Terminal 2 — React Frontend
```bash
cd frontend
bun install       # Install dependencies (first time only)
bun run dev       # Start dev server
# Runs on http://localhost:5173
# Proxies /api/* → http://localhost:8090
```

Open **http://localhost:5173** in your browser.

## Build

```bash
cd frontend
bun run build   # Produces dist/ with optimized bundle
```

Build output: **388 kB JS** (114 kB gzipped), **28 kB CSS** — 0 errors, 0 warnings.

---

## Architecture

```
React (port 5173)  →  /api/*  →  Spring Boot (port 8090)
```

- **Authentication**: JWT tokens via `POST /api/login`. Token stored in `localStorage`.
- **All requests** carry `Authorization: Bearer <token>` via an Axios interceptor.
- **Vite proxy** forwards all `/api` requests to Spring Boot during development — no CORS configuration needed.

## Pages

| Route | Page | API Used |
|---|---|---|
| `/login` | Login | `POST /api/login` |
| `/register` | Register | `POST /api/register` |
| `/` | Dashboard | `GET /api/projects`, `GET /api/users` |
| `/projects/:id` | Project Detail | `GET /api/projects/:id`, `GET /api/issues` |
| `/issues/:id` | Issue Detail | `GET /api/issues/:id`, `GET /api/issues/:id/comments` |
| `/profile` | Profile and Settings | `GET /api/users` |

## Structure

```
frontend/
├── index.html               # Entry HTML with fonts + Material Symbols
├── vite.config.js           # Vite + Tailwind v4 + proxy config
├── src/
│   ├── index.css            # Linear Craft Engine design tokens
│   ├── main.jsx             # React entry point
│   ├── App.jsx              # Router + auth guards
│   ├── api/
│   │   └── client.js        # Axios instance + all API wrappers
│   ├── context/
│   │   └── AuthContext.jsx  # JWT auth state
│   ├── components/
│   │   ├── Sidebar.jsx      # Fixed left navigation
│   │   ├── Header.jsx       # Top bar with search + glassmorphism
│   │   ├── Layout.jsx       # Page wrapper
│   │   ├── StatusBadge.jsx  # Issue status chips
│   │   ├── PriorityBadge.jsx # Priority icons
│   │   ├── Avatar.jsx       # User avatars
│   │   └── Modal.jsx        # Accessible modal
│   └── pages/
│       ├── LoginPage.jsx
│       ├── RegisterPage.jsx
│       ├── DashboardPage.jsx
│       ├── ProjectDetailPage.jsx
│       ├── IssueDetailPage.jsx
│       └── ProfilePage.jsx
```

## Legacy Thymeleaf Frontend

The original Thymeleaf frontend remains fully intact at:
- Templates: src/main/resources/templates/
- Accessible via the Spring Boot session-based security chain at http://localhost:8090/login

It is completely independent from the React frontend and has not been modified.
