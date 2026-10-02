from fastapi.testclient import TestClient


def test_csv_upload_creates_leads_and_skips_duplicate_email(client: TestClient) -> None:
    csv_file = (
        "first_name,last_name,company,email,notes\n"
        'Jordan,Lee,"Acme, Inc.",jordan@example.test,"Focused on retention, growth"\n'
        "Jordan,Duplicate,Other Co.,JORDAN@example.test,Duplicate row\n"
    )
    response = client.post("/api/leads/import.csv", files={"file": ("leads.csv", csv_file, "text/csv")})
    assert response.status_code == 201
    assert response.json() == {"imported": 1, "skipped_duplicates": 1}
    lead = client.get("/api/leads").json()[0]
    assert lead["company"] == "Acme, Inc."
    assert lead["notes"] == "Focused on retention, growth"


def test_csv_upload_requires_name_and_company_columns(client: TestClient) -> None:
    response = client.post("/api/leads/import.csv", files={"file": ("leads.csv", "email,role\na@example.test,Buyer", "text/csv")})
    assert response.status_code == 422


def test_reply_can_be_logged_without_outbound_message(client: TestClient) -> None:
    created = client.post("/api/leads", json={"first_name": "Jordan", "company": "Acme"}).json()
    response = client.post(f"/api/leads/{created['id']}/replies", json={"content": "Please send pricing"})
    assert response.status_code == 201
    assert response.json()["message_id"] is None
    assert response.json()["sentiment"] == "Interested"
    assert client.get("/api/leads").json()[0]["status"] == "Replied"
