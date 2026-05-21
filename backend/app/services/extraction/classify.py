"""Stage 3a — Rule pre-classification.

A cheap keyword pass that guesses a candidate event_type before the LLM call,
so the LLM gets a hint and we spend fewer tokens. Pure rule logic.
architecture.md §7.3.
"""
from __future__ import annotations

from app.schemas import EventType, RawDocumentIn
from app.services.taxonomy import KEYWORD_EVENT_TYPE


def classify_document(doc: RawDocumentIn) -> EventType | None:
    """Return the best-guess EventType, or None if no keyword matches."""
    haystack = f"{doc.title} {doc.summary or ''} {doc.clean_content or ''}".lower()
    best: EventType | None = None
    best_hits = 0
    for event_type, keywords in KEYWORD_EVENT_TYPE.items():
        hits = sum(1 for kw in keywords if kw in haystack)
        if hits > best_hits:
            best_hits = hits
            best = event_type
    return best
