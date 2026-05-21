"""SQLAlchemy model — intelligence_events (architecture.md §8). Output of stages 3-4."""
from datetime import datetime

from sqlalchemy import DateTime, Index, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base


class IntelligenceEvent(Base):
    __tablename__ = "intelligence_events"
    __table_args__ = (
        Index("ix_events_filter", "market", "event_type", "priority", "created_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    market: Mapped[str | None] = mapped_column(String)
    region: Mapped[str | None] = mapped_column(String)
    event_type: Mapped[str | None] = mapped_column(String)
    title: Mapped[str | None] = mapped_column(Text)
    summary: Mapped[str | None] = mapped_column(Text)
    business_impact: Mapped[str | None] = mapped_column(Text)
    impact_type: Mapped[str | None] = mapped_column(String)
    priority: Mapped[str | None] = mapped_column(String)
    confidence: Mapped[str | None] = mapped_column(String)
    opportunity_score: Mapped[int | None] = mapped_column(Integer)
    risk_score: Mapped[int | None] = mapped_column(Integer)
    source_url: Mapped[str | None] = mapped_column(Text)

    # soft reference to raw_documents.id — no hard FK, to keep tables decoupled
    raw_document_id: Mapped[int | None] = mapped_column(Integer, index=True)

    # escape hatch for fields not yet modelled
    extra: Mapped[dict | None] = mapped_column(JSONB)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
