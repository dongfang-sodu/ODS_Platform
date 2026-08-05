# ODS Platform Frontend

React + TypeScript + Vite frontend for One Driving System. The baseline covers the main graduation-project flows described in `AI_seggestion/ODS系统的功能分析.md`:

- Dashboard and cross-module activity summary
- Project list, filters, CSV export, project detail, create and edit forms
- PMO L0/L1 hierarchy, risk/capacity fields and LPM-only delete affordance
- Vehicle Market sales distribution and data-source health
- Academy Library / Trims Academy course management
- My Ticket daily priority workspace
- Video Guideline topic library

## Requirements

- Node.js 22.23.1 (the Docker build uses the same version)
- npm 10.9.8 or another npm 10 release
- Spring Boot API on `http://localhost:8080` for live data

## Run locally

```powershell
cd C:\Users\admin\ODS\frontend
npm ci
npm run dev
```

Open `http://localhost:5173`. The app starts at `/login` and sends credentials to `/api/v1/auth/login`. A successful response stores the JWT in local storage and all protected requests include it as a Bearer token. Vite proxies `/api` to `http://localhost:8080`, so no additional CORS setup is needed for local development.

The default is production-style behavior: failed API requests show an error or empty state and never substitute sample records. For UI previews, set `VITE_ENABLE_DEMO_DATA=true`; fallback records are then clearly labelled and read-only, while real API responses still take precedence.

## Configuration

Copy `.env.example` to `.env.local` if the API uses another base URL:

```text
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_ENABLE_DEMO_DATA=false
```

Set `VITE_ENABLE_DEMO_DATA=true` only for an explicit read-only preview when the API is unavailable.
The Docker build accepts both values as build arguments; they are compiled into the static bundle and must not contain secrets.

## API contract used by the frontend

| Module | Method | Endpoint |
| --- | --- | --- |
| Authentication | `POST` | `/api/v1/auth/login` |
| Current user | `GET` | `/api/v1/auth/me` |
| Projects | `GET`, `POST` | `/api/v1/projects` |
| Project | `GET`, `PUT` | `/api/v1/projects/{id}` |
| PMO | `GET`, `POST` | `/api/v1/pmo/projects` |
| PMO child | `POST` | `/api/v1/pmo/projects/{parentId}/children` |
| PMO record | `PATCH`, `DELETE` | `/api/v1/pmo/projects/{id}` |
| Market | `GET` | `/api/v1/vehicle-market/sales-distribution` |
| Academy | `GET`, `POST` | `/api/v1/training/courses` |
| Academy course | `PUT` | `/api/v1/training/courses/{id}` |
| Academy course actions | `POST` | `/api/v1/training/courses/{id}/publish`, `/unpublish`, `/cancel` |
| Complete Academy course | `PATCH` | `/api/v1/training/courses/{id}/complete` |
| My Ticket | `GET` | `/api/v1/my-tickets` |
| Ticket | `PATCH` | `/api/v1/my-tickets/{id}` |
| Video guidelines | `GET` | `/api/v1/video-guidelines` |

## Verification

```powershell
npm ci
npm run typecheck
npm run build
```

The production bundle is written to `frontend/dist`.
