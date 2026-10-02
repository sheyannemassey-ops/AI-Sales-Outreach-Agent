import pytest
from fastapi.testclient import TestClient

from app.database import normalize_database_url


def test_postgres_urls_use_psycopg3_driver() -> None:
    assert normalize_database_url("postgres://user:pass@db:5432/app") == "postgresql+psycopg://user:pass@db:5432/app"
    assert normalize_database_url("postgresql://user:pass@db:5432/app") == "postgresql+psycopg://user:pass@db:5432/app"
    assert normalize_database_url("sqlite:///./signaldesk.db") == "sqlite:///./signaldesk.db"


def test_health_reports_database_connection(client: TestClient) -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "connected"}


def test_seed_demo_data_creates_linked_message_event(client: TestClient) -> None:
    from app.main import seed_demo_data

    seed_demo_data()
    snapshot = client.get("/api/bootstrap").json()
    assert len(snapshot["leads"]) == 4
    assert len(snapshot["messages"]) == 1
    assert snapshot["messages"][0]["status"] == "Sent"


def test_lead_campaign_outreach_reply_and_analytics_flow(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    lead_response = client.post("/api/leads", json={
        "first_name": "Jordan",
        "last_name": "Lee",
        "company": "Acme Co.",
        "role": "Marketing Director",
        "email": "jordan@acme.example",
        "notes": "Focused on improving customer retention.",
    })
    assert lead_response.status_code == 201
    lead = lead_response.json()

    campaign_response = client.post("/api/campaigns", json={
        "name": "Retention follow-up",
        "channel": "Email",
        "audience": "New prospects",
        "goal": "Book a discovery call",
    })
    assert campaign_response.status_code == 201
    campaign = campaign_response.json()

    generated = client.post("/api/outreach/generate", json={
        "lead_id": lead["id"],
        "campaign_id": campaign["id"],
        "channel": "Email",
        "tone": "Consultative",
        "goal": "Book a discovery call",
        "variants": 3,
    })
    assert generated.status_code == 200
    assert generated.json()["model"] == "local-demo"
    assert len(generated.json()["variants"]) == 3

    draft = generated.json()["variants"][0]
    message_response = client.post("/api/messages", json={
        "lead_id": lead["id"],
        "campaign_id": campaign["id"],
        "channel": "Email",
        **draft,
        "ai_generated": True,
    })
    assert message_response.status_code == 201
    message_id = message_response.json()["id"]
    assert client.post(f"/api/messages/{message_id}/send").status_code == 200

    reply = client.post(f"/api/messages/{message_id}/reply", json={"content": "Could you share pricing?"})
    assert reply.status_code == 201
    assert reply.json()["sentiment"] == "Interested"
    assert "pricing overview" in reply.json()["action_recommendation"]

    analytics = client.get("/api/analytics").json()
    assert analytics["total_leads"] == 1
    assert analytics["sent_messages"] == 1
    assert analytics["reply_rate"] == 100


def test_lead_import_skips_duplicate_emails(client: TestClient) -> None:
    payload = {"leads": [
        {"first_name": "Jo", "company": "Acme", "email": "jo@example.test"},
        {"first_name": "Jo", "company": "Acme Duplicate", "email": "JO@example.test"},
    ]}
    response = client.post("/api/leads/import", json=payload)
    assert response.status_code == 201
    assert response.json() == {"imported": 1, "skipped_duplicates": 1}
    assert len(client.get("/api/leads").json()) == 1


def test_lead_validation_rejects_invalid_email(client: TestClient) -> None:
    response = client.post("/api/leads", json={"first_name": "Jo", "company": "Acme", "email": "invalid"})
    assert response.status_code == 422
