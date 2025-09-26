# Auth Service

This microservice handles Google OAuth2 login and issues local JWTs for the other services.

Environment variables (place in top-level `.env`):

- `GOOGLE_CLIENT_ID`  - Your Google OAuth2 Client ID
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth2 Client Secret
- `GOOGLE_REDIRECT_URI` - Redirect URI registered in Google Cloud Console (e.g. `http://localhost:3000/auth/callback`)

Where to place credentials:
- Put the values in the project's root `.env` file. See `.env.example` for variable names. The auth endpoints will read from `process.env.GOOGLE_CLIENT_ID` and `process.env.GOOGLE_CLIENT_SECRET`.

Quick start (development):

1. Copy `.env.example` to `.env` and set values.
2. cd services/auth-service
3. npm install
4. npm run dev


