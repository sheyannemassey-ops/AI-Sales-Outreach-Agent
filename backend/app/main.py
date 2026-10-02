import csv
import io
import logging
import os
import time
from collections import defaultdict
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Annotated
from uuid import uuid4

from fastapi import Depends, FastAPI, File, HTTPException, Query, Request, Response, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session, selectinload

from .database import Base, SessionLocal, engine, get_db
from .models import Campaign, EngagementEvent, Lead, OutreachMessage, Response as LeadResponse
from .models import Template
from .schemas import AnalyticsRead, CampaignCreate, CampaignRead, CampaignUpdate, EngagementEventCreate, GenerationRequest
from .schemas import GenerationResponse, LeadCreate, LeadImport, LeadRead, LeadUpdate, MessageCreate, MessageRead
from .schemas import ResponseCreate, ResponseRead
from .services.outreach import GenerationUnavailable, generate_variants, summarize_reply, summarize_reply_ai

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("signaldesk.api")
generation_requests: dict[str, list[float]] = defaultdict(list)


@asynccontextmanager
async def lifespan(_: FastAPI):
    if os.getenv("SEED_DEMO_DATA", "true").lower() == "true":
        seed_demo_data()
    yield


app = FastAPI(title="SignalDesk API", version="1.0.0", lifespan=lifespan)
origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "*").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=origins != ["*"],
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


def seed_demo_data() -> None:
    with SessionLocal() as db:
        if db.scalar(select(func.count()).select_from(Lead)):
            return
        leads = [
            Lead(first_name="Avery", last_name="Chen", company="Meridian Health", role="VP of Marketing", email="avery@example.test", notes="Expanding into two new markets; interested in patient retention."),
            Lead(first_name="Marcus", last_name="Reed", company="Fieldwork", role="Founder", email="marcus@example.test", notes="Small product studio hiring its first growth marketer."),
            Lead(first_name="Priya", last_name="Nair", company="Northstar Finance", role="Head of Growth", email="priya@example.test", notes="Focused on reducing customer acquisition costs.", status="Opened"),
            Lead(first_name="Sofia", last_name="Martinez", company="Brightpath Learning", role="Director of Partnerships", email="sofia@example.test", notes="Exploring new partnerships before the next enrollment cycle."),
        ]
        campaign = Campaign(name="Q3 Growth Leaders", channel="Email", audience="New prospects", goal="Book a discovery call")
        db.add_all([*leads, campaign])
        db.flush()
        message = OutreachMessage(
            lead_id=leads[0].id,
            campaign_id=campaign.id,
            channel="Email",
            subject="A thought for Meridian Health",
            content="Hi Avery, I noticed Meridian Health is expanding into new markets. Would a short conversation about patient retention be useful?",
            ai_generated=True,
            status="Sent",
            sent_at=datetime.now(timezone.utc),
        )
        db.add(message)
        db.flush()
        db.add(EngagementEvent(message_id=message.id, event_type="Sent"))
        db.commit()


def serialize_lead(db: Session, lead: Lead) -> dict:
    response = db.scalar(select(LeadResponse).where(LeadResponse.lead_id == lead.id).order_by(LeadResponse.created_at.desc()))
    return {
        "id": lead.id,
        "first_name": lead.first_name,
        "last_name": lead.last_name,
        "company": lead.company,
        "role": lead.role,
        "email": lead.email,
        "phone": lead.phone,
        "notes": lead.notes,
        "status": lead.status,
        "created_at": lead.created_at,
        "response": response.content if response else None,
        "response_summary": response.summary if response else None,
        "response_action": response.action_recommendation if response else None,
    }


def serialize_message(message: OutreachMessage) -> dict:
    return {
        "id": message.id,
        "lead_id": message.lead_id,
        "campaign_id": message.campaign_id,
        "channel": message.channel,
        "subject": message.subject,
        "content": message.content,
        "ai_generated": message.ai_generated,
        "variant": message.variant,
        "status": message.status,
        "scheduled_at": message.scheduled_at,
        "sent_at": message.sent_at,
        "created_at": message.created_at,
    }


@app.middleware("http")
async def request_logging(request: Request, call_next):
    started = time.perf_counter()
    response = await call_next(request)
    elapsed = round((time.perf_counter() - started) * 1000)
    logger.info("http method=%s path=%s status=%d duration_ms=%d", request.method, request.url.path, response.status_code, elapsed)
    response.headers["X-Response-Time-ms"] = str(elapsed)
    return response


@app.get("/api/health")
def health(db: Annotated[Session, Depends(get_db)]) -> dict[str, str]:
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}


@app.get("/api/bootstrap")
def bootstrap(db: Annotated[Session, Depends(get_db)]) -> dict:
    leads = db.scalars(select(Lead).order_by(Lead.created_at.desc())).all()
    campaigns = db.scalars(select(Campaign).order_by(Campaign.created_at.desc())).all()
    messages = db.scalars(select(OutreachMessage).order_by(OutreachMessage.created_at.desc()).limit(100)).all()
    responses = db.scalars(select(LeadResponse).order_by(LeadResponse.created_at.desc())).all()
    return {
        "leads": [serialize_lead(db, lead) for lead in leads],
        "campaigns": [CampaignRead.model_validate(campaign).model_dump(mode="json") for campaign in campaigns],
        "messages": [serialize_message(message) for message in messages],
        "responses": [ResponseRead.model_validate(item).model_dump(mode="json") for item in responses],
    }


@app.get("/api/leads", response_model=list[LeadRead])
def list_leads(
    db: Annotated[Session, Depends(get_db)],
    search: str | None = Query(default=None, max_length=100),
    lead_status: str | None = Query(default=None, alias="status", max_length=24),
    limit: int = Query(default=500, ge=1, le=1000),
) -> list[dict]:
    query = select(Lead).order_by(Lead.created_at.desc()).limit(limit)
    if lead_status:
        query = query.where(Lead.status == lead_status)
    if search:
        term = f"%{search.strip()}%"
        query = query.where(Lead.first_name.ilike(term) | Lead.last_name.ilike(term) | Lead.company.ilike(term) | Lead.email.ilike(term))
    return [serialize_lead(db, lead) for lead in db.scalars(query).all()]


@app.post("/api/leads", response_model=LeadRead, status_code=status.HTTP_201_CREATED)
def create_lead(payload: LeadCreate, db: Annotated[Session, Depends(get_db)]) -> dict:
    lead = Lead(**payload.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return serialize_lead(db, lead)


@app.post("/api/leads/import", status_code=status.HTTP_201_CREATED)
def import_leads(payload: LeadImport, db: Annotated[Session, Depends(get_db)]) -> dict[str, int]:
    known_emails = {email.lower() for email in db.scalars(select(Lead.email).where(Lead.email != "")).all()}
    created = []
    skipped = 0
    for item in payload.leads:
        email = item.email.lower()
        if email and email in known_emails:
            skipped += 1
            continue
        if email:
            known_emails.add(email)
        created.append(Lead(**item.model_dump()))
    db.add_all(created)
    db.commit()
    return {"imported": len(created), "skipped_duplicates": skipped}


@app.post("/api/leads/import.csv", status_code=status.HTTP_201_CREATED)
async def import_csv(file: UploadFile = File(...), db: Session = Depends(get_db)) -> dict[str, int]:
    raw = await file.read(5_000_001)
    await file.close()
    if len(raw) > 5_000_000:
        raise HTTPException(status_code=413, detail="CSV file exceeds the 5 MB limit")
    try:
        text_data = raw.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(text_data))
        if not reader.fieldnames:
            raise ValueError("CSV header row is required")
        aliases = {
            "first_name": {"firstname", "first"},
            "last_name": {"lastname", "last"},
            "company": {"company", "companyname", "organization"},
            "role": {"role", "title", "jobtitle"},
            "email": {"email", "emailaddress"},
            "phone": {"phone", "phonenumber"},
            "notes": {"notes", "context", "description"},
        }
        normalized_headers = {header.lower().replace(" ", "").replace("-", "").replace("_", ""): header for header in reader.fieldnames}
        columns = {field: next((normalized_headers[name] for name in names if name in normalized_headers), None) for field, names in aliases.items()}
        if not columns["first_name"] or not columns["company"]:
            raise ValueError("CSV needs at least first name and company columns")
        rows = list(reader)
        if len(rows) > 1000:
            raise ValueError("CSV can contain at most 1,000 leads")
        leads = []
        for row_number, row in enumerate(rows, start=2):
            values = {field: (row.get(column) or "").strip() if column else "" for field, column in columns.items()}
            if not values["first_name"] or not values["company"]:
                continue
            try:
                leads.append(LeadCreate.model_validate(values))
            except Exception as error:
                raise ValueError(f"Invalid lead on CSV row {row_number}: {error}") from error
    except (UnicodeDecodeError, csv.Error, ValueError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    if not leads:
        raise HTTPException(status_code=422, detail="No valid leads found in the CSV")
    return import_leads(LeadImport(leads=leads), db)


@app.patch("/api/leads/{lead_id}", response_model=LeadRead)
def update_lead(lead_id: str, payload: LeadUpdate, db: Annotated[Session, Depends(get_db)]) -> dict:
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(lead, key, value)
    db.commit()
    db.refresh(lead)
    return serialize_lead(db, lead)


@app.delete("/api/leads/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(lead_id: str, db: Annotated[Session, Depends(get_db)]) -> Response:
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    db.delete(lead)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@app.get("/api/campaigns", response_model=list[CampaignRead])
def list_campaigns(db: Annotated[Session, Depends(get_db)]) -> list[Campaign]:
    return db.scalars(select(Campaign).order_by(Campaign.created_at.desc())).all()


@app.post("/api/campaigns", response_model=CampaignRead, status_code=status.HTTP_201_CREATED)
def create_campaign(payload: CampaignCreate, db: Annotated[Session, Depends(get_db)]) -> Campaign:
    if payload.template_id and not db.get(Template, payload.template_id):
        raise HTTPException(status_code=404, detail="Template not found")
    campaign = Campaign(**payload.model_dump())
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


@app.patch("/api/campaigns/{campaign_id}", response_model=CampaignRead)
def update_campaign(campaign_id: str, payload: CampaignUpdate, db: Annotated[Session, Depends(get_db)]) -> Campaign:
    campaign = db.get(Campaign, campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    changes = payload.model_dump(exclude_unset=True)
    if changes.get("template_id") and not db.get(Template, changes["template_id"]):
        raise HTTPException(status_code=404, detail="Template not found")
    for key, value in changes.items():
        setattr(campaign, key, value)
    db.commit()
    db.refresh(campaign)
    return campaign


@app.post("/api/outreach/generate", response_model=GenerationResponse)
async def generate_outreach(payload: GenerationRequest, request: Request, db: Annotated[Session, Depends(get_db)]) -> GenerationResponse:
    client_key = request.client.host if request.client else "unknown"
    now = time.monotonic()
    generation_requests[client_key] = [timestamp for timestamp in generation_requests[client_key] if now - timestamp < 60]
    if len(generation_requests[client_key]) >= 10:
        raise HTTPException(status_code=429, detail="Generation limit reached. Try again in a minute.")
    generation_requests[client_key].append(now)
    lead = db.get(Lead, payload.lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if payload.campaign_id and not db.get(Campaign, payload.campaign_id):
        raise HTTPException(status_code=404, detail="Campaign not found")
    try:
        variants, model_name = await generate_variants(lead, payload.channel, payload.tone, payload.goal, payload.variants)
    except GenerationUnavailable as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    from .schemas import MessageVariant
    return GenerationResponse(
        lead_id=lead.id,
        channel=payload.channel,
        variants=[MessageVariant(subject=item.subject, content=item.content) for item in variants],
        model=model_name,
        generated_at=datetime.now(timezone.utc),
    )


@app.get("/api/messages", response_model=list[MessageRead])
def list_messages(db: Annotated[Session, Depends(get_db)], limit: int = Query(default=500, ge=1, le=1000)) -> list[OutreachMessage]:
    return db.scalars(select(OutreachMessage).order_by(OutreachMessage.created_at.desc()).limit(limit)).all()


@app.post("/api/messages", response_model=MessageRead, status_code=status.HTTP_201_CREATED)
def create_message(payload: MessageCreate, db: Annotated[Session, Depends(get_db)]) -> OutreachMessage:
    if not db.get(Lead, payload.lead_id):
        raise HTTPException(status_code=404, detail="Lead not found")
    if payload.campaign_id and not db.get(Campaign, payload.campaign_id):
        raise HTTPException(status_code=404, detail="Campaign not found")
    message = OutreachMessage(**payload.model_dump())
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@app.post("/api/messages/{message_id}/send", response_model=MessageRead)
def mark_message_sent(message_id: str, db: Annotated[Session, Depends(get_db)]) -> OutreachMessage:
    message = db.get(OutreachMessage, message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    if message.status != "Draft":
        raise HTTPException(status_code=409, detail="Only drafts can be marked as sent")
    message.status = "Sent"
    message.sent_at = datetime.now(timezone.utc)
    db.add(EngagementEvent(message_id=message.id, event_type="Sent"))
    lead = db.get(Lead, message.lead_id)
    if lead and lead.status == "New":
        lead.status = "Sent"
    db.commit()
    db.refresh(message)
    return message


@app.post("/api/messages/{message_id}/events", status_code=status.HTTP_201_CREATED)
def record_engagement(message_id: str, payload: EngagementEventCreate, db: Annotated[Session, Depends(get_db)]) -> dict[str, str]:
    message = db.get(OutreachMessage, message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    if message.status not in ("Sent", "Opened", "Clicked"):
        raise HTTPException(status_code=409, detail="Engagement can only be recorded for sent messages")
    event = EngagementEvent(message_id=message.id, event_type=payload.event_type)
    db.add(event)
    message.status = payload.event_type
    lead = db.get(Lead, message.lead_id)
    if lead and payload.event_type == "Opened" and lead.status == "Sent":
        lead.status = "Opened"
    db.commit()
    return {"message_id": message.id, "event_type": payload.event_type}


@app.post("/api/messages/{message_id}/reply", response_model=ResponseRead, status_code=status.HTTP_201_CREATED)
async def record_reply(message_id: str, payload: ResponseCreate, db: Annotated[Session, Depends(get_db)]) -> LeadResponse:
    message = db.get(OutreachMessage, message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    if message.response:
        raise HTTPException(status_code=409, detail="A reply is already linked to this message")
    insight = await summarize_reply_ai(payload.content)
    response = LeadResponse(
        lead_id=message.lead_id,
        message_id=message.id,
        content=payload.content.strip(),
        sentiment=insight.sentiment,
        summary=insight.summary,
        action_recommendation=insight.action,
    )
    message.status = "Replied"
    db.get(Lead, message.lead_id).status = "Replied"
    db.add(EngagementEvent(message_id=message.id, event_type="Replied"))
    db.add(response)
    db.commit()
    db.refresh(response)
    return response


@app.post("/api/leads/{lead_id}/replies", response_model=ResponseRead, status_code=status.HTTP_201_CREATED)
async def record_lead_reply(lead_id: str, payload: ResponseCreate, db: Annotated[Session, Depends(get_db)]) -> LeadResponse:
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    message = db.scalar(
        select(OutreachMessage)
        .where(OutreachMessage.lead_id == lead_id, OutreachMessage.status != "Draft")
        .order_by(OutreachMessage.created_at.desc())
    )
    if message and message.response:
        raise HTTPException(status_code=409, detail="The latest message already has a reply; use its activity record")
    insight = await summarize_reply_ai(payload.content)
    response = LeadResponse(
        lead_id=lead.id,
        message_id=message.id if message else None,
        content=payload.content.strip(),
        sentiment=insight.sentiment,
        summary=insight.summary,
        action_recommendation=insight.action,
    )
    if message:
        message.status = "Replied"
        db.add(EngagementEvent(message_id=message.id, event_type="Replied"))
    lead.status = "Replied"
    db.add(response)
    db.commit()
    db.refresh(response)
    return response


@app.get("/api/analytics", response_model=AnalyticsRead)
def get_analytics(db: Annotated[Session, Depends(get_db)]) -> dict:
    sent = list(db.scalars(select(OutreachMessage).where(OutreachMessage.status != "Draft")).all())
    sent_count = len(sent)
    opened = sum(message.status in ("Opened", "Clicked", "Replied") for message in sent)
    clicked = sum(message.status in ("Clicked", "Replied") for message in sent)
    replied = sum(message.status == "Replied" for message in sent)
    campaigns = db.scalars(select(Campaign).order_by(Campaign.created_at.desc())).all()
    campaign_stats = []
    for campaign in campaigns:
        items = [message for message in sent if message.campaign_id == campaign.id]
        responses_count = sum(message.status == "Replied" for message in items)
        engaged = sum(message.status in ("Opened", "Clicked", "Replied") for message in items)
        campaign_stats.append({
            "id": campaign.id,
            "name": campaign.name,
            "sent": len(items),
            "replies": responses_count,
            "engagement_rate": round(engaged / len(items) * 100, 1) if items else 0,
            "reply_rate": round(responses_count / len(items) * 100, 1) if items else 0,
        })
    since = datetime.now(timezone.utc) - timedelta(days=30)
    event_rows = db.execute(
        select(func.date(EngagementEvent.occurred_at), EngagementEvent.event_type, func.count())
        .where(EngagementEvent.occurred_at >= since)
        .group_by(func.date(EngagementEvent.occurred_at), EngagementEvent.event_type)
        .order_by(func.date(EngagementEvent.occurred_at))
    ).all()
    daily: dict[str, dict[str, str | int]] = {}
    for day, event_type, count in event_rows:
        key = str(day)
        daily.setdefault(key, {"date": key, "opens": 0, "clicks": 0, "replies": 0})
        metric = {"Opened": "opens", "Clicked": "clicks", "Replied": "replies"}.get(event_type)
        if metric:
            daily[key][metric] = count
    return {
        "total_leads": db.scalar(select(func.count()).select_from(Lead)) or 0,
        "sent_messages": sent_count,
        "open_rate": round(opened / sent_count * 100, 1) if sent_count else 0,
        "click_rate": round(clicked / sent_count * 100, 1) if sent_count else 0,
        "reply_rate": round(replied / sent_count * 100, 1) if sent_count else 0,
        "campaigns": campaign_stats,
        "daily_engagement": list(daily.values()),
    }


@app.get("/api/recommendations")
def recommendations(db: Annotated[Session, Depends(get_db)]) -> list[dict[str, str]]:
    opened_ids = db.scalars(select(OutreachMessage.lead_id).where(OutreachMessage.status == "Opened")).all()
    replied_ids = set(db.scalars(select(LeadResponse.lead_id)).all())
    result = []
    for lead_id in dict.fromkeys(opened_ids):
        if lead_id in replied_ids:
            continue
        lead = db.get(Lead, lead_id)
        if lead:
            result.append({"lead_id": lead.id, "priority": "High", "title": f"Follow up with {lead.first_name} {lead.last_name}".strip(), "reason": "Opened an outreach message but has not replied.", "action": "Send a short, relevant follow-up within two business days."})
    return result[:10]


@app.post("/api/templates", status_code=status.HTTP_201_CREATED)
def create_template(payload: dict, db: Annotated[Session, Depends(get_db)]) -> dict:
    name = str(payload.get("name", "")).strip()
    body = str(payload.get("body", "")).strip()
    channel = payload.get("channel", "Email")
    if not name or not body or channel not in ("Email", "SMS"):
        raise HTTPException(status_code=422, detail="Template name, body, and valid channel are required")
    template = Template(name=name[:160], channel=channel, subject=str(payload.get("subject", ""))[:300], body=body[:5000])
    db.add(template)
    db.commit()
    db.refresh(template)
    return {"id": template.id, "name": template.name, "channel": template.channel, "subject": template.subject, "body": template.body}


@app.get("/api/templates")
def list_templates(db: Annotated[Session, Depends(get_db)]) -> list[dict]:
    templates = db.scalars(select(Template).order_by(Template.created_at.desc())).all()
    return [{"id": item.id, "name": item.name, "channel": item.channel, "subject": item.subject, "body": item.body} for item in templates]


web_root = Path(os.getenv("WEB_ROOT", "/srv/signaldesk"))
if web_root.is_dir():
    app.mount("/", StaticFiles(directory=web_root, html=True), name="web")
