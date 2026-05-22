"""Shared enumerations — the pipeline data contract.

Values are aligned with backend/architecture.md §7.3 and §8.
"""
from __future__ import annotations

from enum import Enum


class SourceType(str, Enum):
    news = "news"
    competitor = "competitor"
    platform = "platform"
    regulation = "regulation"
    market_data = "market_data"
    mall = "mall"
    social = "social"
    report = "report"


class EventType(str, Enum):
    competition = "competition"
    product = "product"
    platform = "platform"
    social = "social"
    regulation = "regulation"
    pricing = "pricing"
    channel = "channel"
    festival = "festival"


class ImpactType(str, Enum):
    opportunity = "opportunity"
    risk = "risk"
    watch = "watch"


class Priority(str, Enum):
    P0 = "P0"
    P1 = "P1"
    P2 = "P2"


class Confidence(str, Enum):
    high = "high"
    medium = "medium"
    low = "low"


class CredibilityLevel(str, Enum):
    S = "S"
    A = "A"
    B = "B"
    C = "C"


class PipelineStage(str, Enum):
    ingest = "ingest"
    clean = "clean"
    extract = "extract"
    score = "score"
    forecast = "forecast"
    brief = "brief"
    action = "action"


class StageStatus(str, Enum):
    running = "running"
    success = "success"
    failed = "failed"
    skipped = "skipped"


class ActionStatus(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    done = "done"
    ignored = "ignored"
