from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


Channel = Literal["Email", "SMS"]
Tone = Literal["Professional", "Friendly", "Aggressive", "Consultative"]
LeadStatus = Literal["New", "Sent", "Opened", "Replied", "Converted", "Do not contact"]
MessageStatus = Literal["Draft", "Sent", "Opened", "Clicked", "Replied"]


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class LeadCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(default="", max_length=100)
    company: str = Field(min_length=1, max_length=200)
    role: str = Field(default="", max_length=200)
    email: str = Field(default="", max_length=320)
    phone: str = Field(default="", max_length=40)
    notes: str = Field(default="", max_length=5000)

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        value = value.strip()
        if value and ("@" not in value or value.startswith("@") or value.endswith("@")):
            raise ValueError("Enter a valid email address")
        return value


class LeadRead(ORMModel):
    id: str
    first_name: str
    last_name: str
    company: str
    role: str
    email: str
    phone: str
    notes: str
    status: str
    created_at: datetime
    response: str | None = None
    response_summary: str | None = None


class LeadUpdate(BaseModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, max_length=100)
    company: str | None = Field(default=None, min_length=1, max_length=200)
    role: str | None = Field(default=None, max_length=200)
    email: str | None = Field(default=None, max_length=320)
    phone: str | None = Field(default=None, max_length=40)
    notes: str | None = Field(default=None, max_length=5000)
    status: LeadStatus | None = None


class LeadImport(BaseModel):
    leads: list[LeadCreate] = Field(min_length=1, max_length=1000)


class CampaignCreate(BaseModel):
    name: str = Field(min_length=1, max_length=180)
    channel: Channel = "Email"
    audience: str = Field(default="All active leads", max_length=120)
    goal: str = Field(default="", max_length=300)
    template_id: str | None = None
    status: Literal["Active", "Paused", "Completed"] = "Active"
    scheduled_at: datetime | None = None


class CampaignRead(ORMModel):
    id: str
    name: str
    channel: str
    audience: str
    goal: str
    template_id: str | None
    status: str
    scheduled_at: datetime | None
    created_at: datetime


class CampaignUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=180)
    channel: Channel | None = None
    audience: str | None = Field(default=None, max_length=120)
    goal: str | None = Field(default=None, max_length=300)
    template_id: str | None = None
    status: Literal["Active", "Paused", "Completed"] | None = None
    scheduled_at: datetime | None = None


class GenerationRequest(BaseModel):
    lead_id: str
    campaign_id: str | None = None
    channel: Channel = "Email"
    tone: Tone = "Professional"
    goal: str = Field(min_length=3, max_length=300)
    variants: int = Field(default=3, ge=1, le=3)


class MessageVariant(BaseModel):
    subject: str = ""
    content: str = Field(min_length=1, max_length=5000)


class GenerationResponse(BaseModel):
    lead_id: str
    channel: Channel
    variants: list[MessageVariant]
    model: str
    generated_at: datetime


class MessageCreate(BaseModel):
    lead_id: str
    campaign_id: str | None = None
    channel: Channel
    subject: str = Field(default="", max_length=300)
    content: str = Field(min_length=1, max_length=5000)
    ai_generated: bool = False
    variant: int = Field(default=1, ge=1, le=3)
    scheduled_at: datetime | None = None


class MessageRead(ORMModel):
    id: str
    lead_id: str
    campaign_id: str | None
    channel: str
    subject: str
    content: str
    ai_generated: bool
    variant: int
    status: str
    scheduled_at: datetime | None
    sent_at: datetime | None
    created_at: datetime


class ResponseCreate(BaseModel):
    content: str = Field(min_length=1, max_length=10000)


class ResponseRead(ORMModel):
    id: str
    lead_id: str
    message_id: str | None
    content: str
    sentiment: str
    summary: str
    action_recommendation: str
    created_at: datetime


class EngagementEventCreate(BaseModel):
    event_type: Literal["Opened", "Clicked"]


class AnalyticsRead(BaseModel):
    total_leads: int
    sent_messages: int
    open_rate: float
    click_rate: float
    reply_rate: float
    campaigns: list[dict[str, str | int | float]]
    daily_engagement: list[dict[str, str | int]]
