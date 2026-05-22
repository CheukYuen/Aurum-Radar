"""Persistence layer — map pipeline schemas (app/schemas) to ORM models
(app/models) and write them.

Kept separate from the pipeline so stage logic stays free of DB concerns.

Idempotency (stages are re-runnable, architecture.md §7):
  * raw_documents — bulk insert, skip duplicates by content_hash
  * daily_briefs  — upsert by brief_date (one brief per day)
  * intelligence_events / market_snapshots / action_items / job_runs —
    plain insert; a re-run appends rows.
"""
from __future__ import annotations

from datetime import date, datetime
from enum import Enum

from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.models import (
    ActionItem,
    DailyBrief,
    IntelligenceEvent,
    JobRun,
    MarketSnapshot,
    RawDocument,
)
from app.schemas import (
    ActionItemIn,
    DailyBriefIn,
    IntelligenceEventIn,
    MarketSnapshotIn,
    RawDocumentIn,
    StageResult,
)


def _val(value):
    """Enum -> its string value; passthrough otherwise (incl. None)."""
    return value.value if isinstance(value, Enum) else value


def _iso(value: datetime | date | None) -> str | None:
    return value.isoformat() if value is not None else None


# --- stage 2: raw_documents -------------------------------------------------

def save_raw_documents(db: Session, docs: list[RawDocumentIn]) -> dict[str, int]:
    """Insert raw documents (skip content_hash dups); return content_hash -> id."""
    if not docs:
        return {}
    rows = [
        dict(
            source_type=_val(d.source_type),
            source_name=d.source_name,
            market=d.market,
            region=d.region,
            title=d.title,
            summary=d.summary,
            url=d.url,
            published_at=d.published_at,
            fetched_at=d.fetched_at,
            language=d.language,
            raw_content=d.raw_content,
            clean_content=d.clean_content,
            content_hash=d.content_hash,
            oss_path=d.oss_path,
            credibility_level=_val(d.credibility_level),
        )
        for d in docs
    ]
    stmt = pg_insert(RawDocument).values(rows).on_conflict_do_nothing(
        index_elements=["content_hash"]
    )
    db.execute(stmt)
    db.commit()
    # return content_hash -> id (new and pre-existing rows) so the extract
    # stage can link intelligence_events.raw_document_id
    hashes = [d.content_hash for d in docs if d.content_hash]
    if not hashes:
        return {}
    found = (
        db.query(RawDocument.content_hash, RawDocument.id)
        .filter(RawDocument.content_hash.in_(hashes))
        .all()
    )
    return {h: i for h, i in found}


# --- stages 3-4: intelligence_events ---------------------------------------

def save_events(db: Session, events: list[IntelligenceEventIn]) -> int:
    """Insert scored intelligence events."""
    if not events:
        return 0
    models = [
        IntelligenceEvent(
            market=e.market,
            region=e.region,
            event_type=_val(e.event_type),
            title=e.title,
            summary=e.summary,
            business_impact=e.business_impact,
            impact_type=_val(e.impact_type),
            priority=_val(e.priority),
            confidence=_val(e.confidence),
            opportunity_score=e.opportunity_score,
            risk_score=e.risk_score,
            source_url=e.source_url,
            raw_document_id=e.raw_document_id,
            # carried for display but not modelled as columns -> extra
            extra={
                "source_name": e.source_name,
                "credibility_level": _val(e.credibility_level),
                "published_at": _iso(e.published_at),
            },
        )
        for e in events
    ]
    db.add_all(models)
    db.commit()
    return len(models)


# --- stage 5: market_snapshots ---------------------------------------------

def save_snapshots(db: Session, snapshots: list[MarketSnapshotIn]) -> int:
    """Insert market snapshots."""
    if not snapshots:
        return 0
    models = [
        MarketSnapshot(
            market=s.market,
            region=s.region,
            snapshot_date=s.snapshot_date,
            opportunity_score=s.opportunity_score,
            risk_score=s.risk_score,
            overall_judgement=s.overall_judgement,
            key_opportunities=s.key_opportunities,
            key_risks=s.key_risks,
            watch_items=s.watch_items,
            event_count=s.event_count,
        )
        for s in snapshots
    ]
    db.add_all(models)
    db.commit()
    return len(models)


# --- stage 6: daily_briefs --------------------------------------------------

def save_brief(db: Session, brief: DailyBriefIn) -> int:
    """Upsert the daily brief (one row per brief_date)."""
    values = dict(
        brief_date=brief.brief_date,
        markets=brief.markets,
        executive_summary=brief.executive_summary,
        opportunities=brief.opportunities,
        risks=brief.risks,
        watch_items=brief.watch_items,
        recommended_actions=[
            a.model_dump(mode="json") for a in brief.recommended_actions
        ],
        source_count=brief.source_count,
        event_count=brief.event_count,
    )
    stmt = pg_insert(DailyBrief).values(**values).on_conflict_do_update(
        index_elements=["brief_date"],
        set_={k: v for k, v in values.items() if k != "brief_date"},
    )
    db.execute(stmt)
    db.commit()
    return 1


# --- stage 7: action_items --------------------------------------------------

def save_actions(db: Session, actions: list[ActionItemIn]) -> int:
    """Insert department action items."""
    if not actions:
        return 0
    models = [
        ActionItem(
            market=a.market,
            department=a.department,
            priority=_val(a.priority),
            action_title=a.action_title,
            action_detail=a.action_detail,
            reason=a.reason,
            deadline=a.deadline,
            expected_output=a.expected_output,
            success_metric=a.success_metric,
            status=_val(a.status),
            event_id=a.event_id,
            extra={"source_url": a.source_url},
        )
        for a in actions
    ]
    db.add_all(models)
    db.commit()
    return len(models)


# --- job_runs ---------------------------------------------------------------

def save_job_run(
    db: Session,
    *,
    job_name: str,
    trigger_type: str,
    stage_result: StageResult,
    params: dict | None = None,
) -> None:
    """Record one pipeline stage run."""
    db.add(
        JobRun(
            job_name=job_name,
            stage=_val(stage_result.stage),
            trigger_type=trigger_type,
            status=_val(stage_result.status),
            params_json=params,
            started_at=stage_result.started_at,
            finished_at=stage_result.finished_at,
            rows_affected=stage_result.rows_affected,
            error_message=stage_result.error_message,
        )
    )
    db.commit()
