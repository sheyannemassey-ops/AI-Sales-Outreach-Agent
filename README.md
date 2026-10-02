# SignalDesk | AI Sales Outreach

SignalDesk is a recruiter-ready product demo for an AI-assisted sales outreach workspace. It helps a sales team organize lead context, draft personalized email and SMS outreach, track message activity, and decide what to do next.

## Demo

The app opens to a sample workspace with leads, campaigns, engagement analytics, and next-step recommendations. All interactions work in the browser:

- Import leads from CSV or add them manually.
- Generate three editable email or SMS options from lead context, goal, and tone.
- Organize outreach in campaigns and mark drafts as sent.
- Log a reply and get a locally generated summary and suggested next action.
- Review campaign and channel engagement in the dashboard and analytics views.

Changes are saved in browser `localStorage`. The sample workspace is shared only by that browser profile; there is no account or server-side database.

## Run locally

Open `index.html` in a browser, or serve the repository root with any static web server. For example:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publish with GitHub Pages

The repository includes a GitHub Actions workflow that deploys the static app on every push to `main` and on manual workflow dispatch. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**. Once the workflow completes, GitHub Pages provides a stable URL at:

`https://sheyannemassey-ops.github.io/AI-Sales-Outreach-Agent/`

## Demo boundaries

Message generation and response summaries are deterministic, local demo behaviors; no external LLM is called and no email or SMS is delivered. Lead and engagement data are sample data and browser-local. This prototype focuses on the end-to-end product workflow and does not yet include authentication, a FastAPI service, or PostgreSQL. Those are the next steps for a production deployment with shared data and live model integrations.
