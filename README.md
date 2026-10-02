# SignalDesk | AI Sales Outreach

SignalDesk is an AI-assisted outbound workspace for importing lead context, drafting personalized outreach, tracking engagement, and recommending a human-reviewed next step.

## Stack

- React 19, TypeScript, Vite, Tailwind CSS, and Lucide icons
- FastAPI, Pydantic, SQLAlchemy, and Alembic
- PostgreSQL 16 for shared application data
- OpenAI chat completions when `OPENAI_API_KEY` is configured; validated local draft and summary fallbacks otherwise
- Docker Compose for local full-stack development; GitHub Pages for the public static demo

## Features

- CSV import with header validation, duplicate-email handling, and a 5 MB/1,000-row API limit; manual lead create/edit
- Campaign creation with audience, channel, and goal
- Three personalized email or SMS variants with four tones; drafts remain editable and require review
- Message history, send/open/click/reply events, and reply summaries with suggested next actions
- Analytics for tracked open, click, and reply rates plus campaign engagement
- Request timing logs, response-time headers, generation rate limiting, and server-side API key handling

## Run the full stack

Requirements: Docker Engine and Docker Compose.

```bash
cp .env.example .env
docker compose up --build
```

Open `http://localhost:8001` for the app and `http://localhost:8001/docs` for the API reference. PostgreSQL data is kept in the `signaldesk-postgres` Docker volume. The backend applies Alembic migrations before startup and seeds a small sample workspace into an empty database.

To use OpenAI drafts, add your key to `.env` as `OPENAI_API_KEY=...` and restart the app service. The key remains on the server; it is never included in the frontend build. Without a key, the API reports `model: local-demo` and generates deterministic drafts. Message sends are log-only and never deliver email or SMS.

## Run tests

```bash
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
PYTHONPATH=backend .venv/bin/pytest -q backend/tests
cd frontend && npm ci && npm run build && npm run lint
```

## Public hosting

The GitHub Actions workflow builds `frontend/` and publishes the static bundle to:

`https://sheyannemassey-ops.github.io/AI-Sales-Outreach-Agent/`

GitHub Pages cannot run FastAPI or PostgreSQL. The public Pages app therefore stays in browser-local demo mode until a backend is deployed. `render.yaml` describes a Render web service plus PostgreSQL database. After deploying it, add a GitHub Actions repository variable named `VITE_API_URL` with the Render service URL and rerun the Pages workflow to connect the frontend to shared data. Set `CORS_ORIGINS` on the backend to `https://sheyannemassey-ops.github.io`.

## Current demo boundaries

There is no authentication/authorization yet, and any publicly exposed API would allow workspace writes. Configure API access controls before using real customer data. Open/click/reply status is recorded through the API or manually; there is no email/SMS provider, webhook ingestion, automatic scheduler, or background send worker. Reply summarization currently uses deterministic intent rules; generation can use OpenAI when configured. No external message is ever sent automatically.
