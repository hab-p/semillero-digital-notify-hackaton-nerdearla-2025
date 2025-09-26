# Reports Service

This service aggregates data for dashboards and reports.

Endpoints:

- `GET /api/reports/overview` — totals and overall submission rate
- `GET /api/reports/attendance` — attendance metrics (requires attendance events)
- `GET /api/reports/delivery-rate` — on-time delivery statistics

Notes:

- This service expects shared models for submissions, enrollments and courses. See `src/shared_models_placeholder.md` for details.


