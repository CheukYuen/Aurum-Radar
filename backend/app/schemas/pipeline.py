"""Pydantic data contracts passed between Agent pipeline stages.

Each ``*In`` model mirrors a table in backend/architecture.md §8. They are the
in-memory representation; persistence (SQLAlchemy models under app/models) is a
separate layer — see the TODO markers in app/services/pipeline.py.
"""
from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, Field

from app.schemas.enums import (
    ActionStatus,
    Confidence,
    CredibilityLevel,
    EventType,
    ImpactType,
    PipelineStage,
    Priority,
    SourceType,
    StageStatus,
)


class RawDocumentIn(BaseModel):
    """Mirrors ``raw_documents`` (architecture.md §8). Output of stages 1-2."""

    source_type: SourceType
    source_name: str
    market: str
    region: str | None = None
    title: str
    summary: str | None = None
    url: str
    published_at: datetime | None = None
    fetched_at: datetime
    language: str | None = None
    raw_content: str | None = None
    clean_content: str | None = None
    content_hash: str | None = None
    oss_path: str | None = None
    credibility_level: CredibilityLevel | None = None

    # --- pipeline-internal, NOT persisted to raw_documents ---
    candidate_event_type: EventType | None = None
    relevant: bool = True


class IntelligenceEventIn(BaseModel):
    """Mirrors ``intelligence_events`` (architecture.md §8). Output of stages 3-4."""

    market: str
    region: str | None = None
    event_type: EventType
    title: str
    summary: str
    business_impact: str
    impact_type: ImpactType
    priority: Priority
    confidence: Confidence
    opportunity_score: int = Field(default=0, ge=0, le=100)
    risk_score: int = Field(default=0, ge=0, le=100)
    source_url: str
    raw_document_id: int | None = None  # FK -> raw_documents.id (linked at score stage)

    # --- carried from the source raw_document for scoring / display ---
    # (not columns on intelligence_events — joined via raw_document_id)
    source_name: str | None = None
    credibility_level: CredibilityLevel | None = None
    published_at: datetime | None = None
    source_content_hash: str | None = None  # pipeline-internal: event -> raw_document link


class MarketSnapshotIn(BaseModel):
    """Mirrors ``market_snapshots`` (architecture.md §8). Output of stage 5."""

    market: str
    region: str | None = None
    snapshot_date: date
    opportunity_score: int = Field(default=0, ge=0, le=100)
    risk_score: int = Field(default=0, ge=0, le=100)
    overall_judgement: str = ""
    key_opportunities: list[str] = []
    key_risks: list[str] = []
    watch_items: list[str] = []
    event_count: int = 0


class ActionItemIn(BaseModel):
    """Mirrors ``action_items`` (architecture.md §8). Output of stage 7."""

    market: str
    department: str
    priority: Priority
    action_title: str
    action_detail: str
    reason: str
    deadline: str | None = None
    expected_output: str | None = None
    success_metric: str | None = None
    status: ActionStatus = ActionStatus.pending
    event_id: int | None = None  # FK -> intelligence_events.id (None for strategy-derived)
    source_url: str | None = None


class DailyBriefIn(BaseModel):
    """Mirrors ``daily_briefs`` (architecture.md §8). Output of stage 6."""

    brief_date: date
    markets: list[str] = []
    executive_summary: str = ""
    opportunities: list[str] = []
    risks: list[str] = []
    watch_items: list[str] = []
    recommended_actions: list[ActionItemIn] = []
    source_count: int = 0
    event_count: int = 0


class StageResult(BaseModel):
    """One pipeline stage run — basis for a ``job_runs`` row (architecture.md §8)."""

    stage: PipelineStage
    status: StageStatus = StageStatus.running
    rows_affected: int = 0
    error_message: str | None = None
    started_at: datetime
    finished_at: datetime | None = None


class PipelineResult(BaseModel):
    """Aggregate result of one pipeline run."""

    job_name: str
    trigger_type: str = "manual"
    markets: list[str] = []
    stages: list[StageResult] = []
    started_at: datetime
    finished_at: datetime | None = None
