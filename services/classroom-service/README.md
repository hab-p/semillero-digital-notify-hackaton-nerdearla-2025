
# Classroom Service

Synchronizes courses, rosters and assignments from Google Classroom. This service will use either:

- OAuth2 tokens obtained via `auth-service` (user delegated access), or
- A service account with domain-wide delegation (recommended for server-to-server sync).

Environment variables (add to root `.env`):

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (if using user OAuth)
- `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` - path to service account JSON (if using service account)
- `GOOGLE_ADMIN_EMAIL` - admin account for domain delegation

Where to place credentials:
- If using user OAuth: exchange codes through `auth-service` and store refresh tokens securely in the DB. See `auth-service/README.md`.
- If using service account: place the JSON key under `secrets/` and set `GOOGLE_SERVICE_ACCOUNT_KEY_PATH=secrets/service-account.json` in `.env`.

Using the service:

- `GET /api/classroom/courses` — lists courses; prefers service account if configured, otherwise requires `?userId=<id>` to use stored user tokens.
- `GET /api/classroom/courses/:courseId/roster?userId=<id>` — returns students for a course.
- `GET /api/classroom/courses/:courseId/assignments?userId=<id>` — returns coursework for a course.

Place credentials summary:

- Root `.env`: `GOOGLE_SERVICE_ACCOUNT_KEY_PATH` or `GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET` (and `GOOGLE_REDIRECT_URI`).
- If using user OAuth: tokens are persisted by `auth-service` in the `tokens` collection; `classroom-service` reads them from the DB.

