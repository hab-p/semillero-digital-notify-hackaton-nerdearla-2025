# Notifications Service

This service sends notifications via SMTP, Telegram and WhatsApp (Twilio). Configure credentials in the root `.env`:

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- `TELEGRAM_BOT_TOKEN`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` (e.g. `+1415XXXX`)

Endpoints:
- `POST /api/notifications/send-email` { to, subject, text, html }
- `POST /api/notifications/send-telegram` { chatId, text }
- `POST /api/notifications/send-whatsapp` { to (E.164), text }

The service also stores notification logs in the `notifications` collection in MongoDB.


