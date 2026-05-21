"""Agent pipeline orchestrator — runs stages 1-7 in sequence.

Each stage is independent and idempotent (architecture.md §7). This module
chains them, times them, and records a StageResult per stage.

Entry point for both the scheduler and POST /api/jobs/run.

DB persistence is intentionally left as TODO: it needs the SQLAlchemy models
under app/models (architecture.md §8), which are a separate layer. Until then
the pipeline passes data between stages in memory.
"""
from __future__ import annotations

from datetime import date, datetime, timezone

from loguru import logger

from app.schemas import (
    ActionItemIn,
    DailyBriefIn,
    IntelligenceEventIn,
    MarketSnapshotIn,
    PipelineResult,
    PipelineStage,
    RawDocumentIn,
    StageResult,
    StageStatus,
)
from app.services.action import generate_actions
from app.services.brief import generate_brief
from app.services.extraction import extract_events
from app.services.forecast import forecast_markets
from app.services.ingestion import clean_documents, collect_documents
from app.services.scoring import score_events
from app.services.taxonomy import MVP_MARKETS

ALL_STAGES: list[str] = [s.value for s in PipelineStage]


class PipelineContext:
    """Carries data between stages (in memory — DB persistence is TODO)."""

    def __init__(self) -> None:
        self.raw_documents: list[RawDocumentIn] = []
        self.clean_documents: list[RawDocumentIn] = []
        self.events: list[IntelligenceEventIn] = []
        self.snapshots: list[MarketSnapshotIn] = []
        self.brief: DailyBriefIn | None = None
        self.actions: list[ActionItemIn] = []


def run_pipeline(
    markets: list[str] | None = None,
    source_types: list[str] | None = None,
    stages: list[str] | None = None,
    seed_documents: list[RawDocumentIn] | None = None,
    trigger_type: str = "manual",
) -> PipelineResult:
    """Run the requested pipeline stages and return a run report.

    ``seed_documents`` lets the pipeline run before live providers are ported
    — pass data_probe output here (see ingestion.load_seed_documents).
    """
    markets = markets or MVP_MARKETS
    stages = stages or ALL_STAGES
    ctx = PipelineContext()
    if seed_documents:
        ctx.raw_documents = list(seed_documents)

    result = PipelineResult(
        job_name="agent_pipeline",
        trigger_type=trigger_type,
        markets=markets,
        started_at=datetime.now(timezone.utc),
    )

    runners = {
        PipelineStage.ingest.value: lambda: _run_ingest(
            ctx, markets, source_types, seed_documents
        ),
        PipelineStage.clean.value: lambda: _run_clean(ctx),
        PipelineStage.extract.value: lambda: _run_extract(ctx),
        PipelineStage.score.value: lambda: _run_score(ctx),
        PipelineStage.forecast.value: lambda: _run_forecast(ctx),
        PipelineStage.brief.value: lambda: _run_brief(ctx),
        PipelineStage.action.value: lambda: _run_action(ctx),
    }

    for stage_value in ALL_STAGES:
        if stage_value not in stages:
            continue
        stage_result = StageResult(
            stage=PipelineStage(stage_value),
            started_at=datetime.now(timezone.utc),
        )
        try:
            stage_result.rows_affected = runners[stage_value]()
            stage_result.status = StageStatus.success
        except Exception as exc:  # noqa: BLE001 - record failure, stop the chain
            stage_result.status = StageStatus.failed
            stage_result.error_message = str(exc)
            logger.error(f"Stage {stage_value} failed: {exc}")
        stage_result.finished_at = datetime.now(timezone.utc)
        result.stages.append(stage_result)
        # TODO: persist stage_result as a `job_runs` row (architecture.md §8).
        if stage_result.status == StageStatus.failed:
            logger.error("Aborting pipeline — downstream stages need this output")
            break

    result.finished_at = datetime.now(timezone.utc)
    return result


# --- per-stage runners -----------------------------------------------------
# Each returns the number of rows produced (recorded on the StageResult).


def _run_ingest(
    ctx: PipelineContext,
    markets: list[str],
    source_types: list[str] | None,
    seed_documents: list[RawDocumentIn] | None,
) -> int:
    if seed_documents:
        logger.info(f"Ingest: using {len(ctx.raw_documents)} seed documents")
    else:
        ctx.raw_documents = collect_documents(markets, source_types)
    # TODO: persist ctx.raw_documents to the `raw_documents` table.
    return len(ctx.raw_documents)


def _run_clean(ctx: PipelineContext) -> int:
    ctx.clean_documents = clean_documents(ctx.raw_documents)
    # TODO: persist cleaned docs / update `raw_documents` rows.
    return len(ctx.clean_documents)


def _run_extract(ctx: PipelineContext) -> int:
    docs = ctx.clean_documents or ctx.raw_documents
    ctx.events = extract_events(docs)
    # TODO: persist ctx.events to the `intelligence_events` table.
    return len(ctx.events)


def _run_score(ctx: PipelineContext) -> int:
    ctx.events = score_events(ctx.events)
    # TODO: update opportunity_score / risk_score on `intelligence_events`.
    return len(ctx.events)


def _run_forecast(ctx: PipelineContext) -> int:
    ctx.snapshots = forecast_markets(ctx.events, snapshot_date=date.today())
    # TODO: persist ctx.snapshots to the `market_snapshots` table.
    return len(ctx.snapshots)


def _run_brief(ctx: PipelineContext) -> int:
    ctx.brief = generate_brief(
        ctx.events,
        ctx.snapshots,
        brief_date=date.today(),
        source_count=len(ctx.clean_documents or ctx.raw_documents),
    )
    # TODO: persist ctx.brief to the `daily_briefs` table.
    return 1 if ctx.brief else 0


def _run_action(ctx: PipelineContext) -> int:
    ctx.actions = generate_actions(ctx.events)
    if ctx.brief is not None:
        ctx.brief.recommended_actions = ctx.actions
    # TODO: persist ctx.actions to the `action_items` table.
    return len(ctx.actions)
