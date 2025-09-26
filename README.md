# Here are your Instructions

Project scaffold

Architecture overview:

- `services/auth-service` — Google OAuth2 and local JWT issuance. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the root `.env` (see `.env.example`).
- `services/classroom-service` — Sync with Google Classroom (courses, rosters, assignments). Supports service account or user OAuth.
- `services/notifications-service` — Send emails using SMTP; configure `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` in `.env`.
- `services/api-gateway` — BFF that proxies to each microservice for the frontend.
- `frontend` — React app (to be migrated to TypeScript).

Where to put Google credentials:

- In the project root `.env` file add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` (see `.env.example` added by the scaffold). For service accounts, add the JSON file under `secrets/` and set `GOOGLE_SERVICE_ACCOUNT_KEY_PATH=secrets/service-account.json`.
