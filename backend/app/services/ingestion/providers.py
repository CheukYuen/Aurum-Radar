"""Stage 1 — Ingest: fetch public information into RawDocumentIn objects.

Working, validated fetch logic already exists in ``data_probe/`` (see
data_probe/scripts/probe_*.py). The TODO bodies below are where that logic
should be ported in. Until then the pipeline can run on seed documents via
``load_seed_documents`` (architecture.md §10).
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from loguru import logger

from app.schemas import RawDocumentIn, SourceType
from app.services.taxonomy import region_for


class Provider:
    """Base data-source provider. Each subclass returns RawDocumentIn objects."""

    source_type: SourceType

    def fetch(self, markets: list[str]) -> list[RawDocumentIn]:
        raise NotImplementedError


class NewsProvider(Provider):
    source_type = SourceType.news

    def fetch(self, markets: list[str]) -> list[RawDocumentIn]:
        # TODO: port data_probe/scripts/probe_news.py (Google News RSS).
        #       Per market query: news.google.com/rss/search?q=...&gl=<cc>
        logger.warning("NewsProvider.fetch not implemented — port from data_probe")
        return []


class CompetitorProvider(Provider):
    source_type = SourceType.competitor

    def fetch(self, markets: list[str]) -> list[RawDocumentIn]:
        # TODO: port data_probe/scripts/probe_competitors.py (brand sites).
        logger.warning("CompetitorProvider.fetch not implemented — port from data_probe")
        return []


class PlatformPolicyProvider(Provider):
    source_type = SourceType.platform

    def fetch(self, markets: list[str]) -> list[RawDocumentIn]:
        # TODO: port data_probe/scripts/probe_platform_policy.py (Shopee / Lazada).
        logger.warning("PlatformPolicyProvider.fetch not implemented — port from data_probe")
        return []


class RegulationProvider(Provider):
    source_type = SourceType.regulation

    def fetch(self, markets: list[str]) -> list[RawDocumentIn]:
        # TODO: port data_probe/scripts/probe_regulations.py (Customs / MAS).
        logger.warning("RegulationProvider.fetch not implemented — port from data_probe")
        return []


class MarketDataProvider(Provider):
    source_type = SourceType.market_data

    def fetch(self, markets: list[str]) -> list[RawDocumentIn]:
        # TODO: port data_probe/scripts/probe_market_data.py (gold / FX).
        #       NOTE: gold / FX are numeric values, not documents — architecture.md
        #       has no table for them. Inject as brief context, not raw_documents.
        logger.warning("MarketDataProvider.fetch not implemented — port from data_probe")
        return []


class MallEventProvider(Provider):
    source_type = SourceType.mall

    def fetch(self, markets: list[str]) -> list[RawDocumentIn]:
        # TODO: port data_probe/scripts/probe_malls.py (mall event pages).
        logger.warning("MallEventProvider.fetch not implemented — port from data_probe")
        return []


# registry: source_type value -> provider instance
_PROVIDERS: dict[str, Provider] = {
    SourceType.news.value: NewsProvider(),
    SourceType.competitor.value: CompetitorProvider(),
    SourceType.platform.value: PlatformPolicyProvider(),
    SourceType.regulation.value: RegulationProvider(),
    SourceType.market_data.value: MarketDataProvider(),
    SourceType.mall.value: MallEventProvider(),
}


def collect_documents(
    markets: list[str],
    source_types: list[str] | None = None,
) -> list[RawDocumentIn]:
    """Stage 1 entrypoint — run providers and return raw documents."""
    selected = source_types or list(_PROVIDERS.keys())
    docs: list[RawDocumentIn] = []
    for st in selected:
        provider = _PROVIDERS.get(st)
        if provider is None:
            logger.warning(f"No provider for source_type={st}")
            continue
        try:
            fetched = provider.fetch(markets)
            logger.info(f"{provider.__class__.__name__}: {len(fetched)} docs")
            docs.extend(fetched)
        except Exception as exc:  # noqa: BLE001 - one provider must not abort the rest
            logger.error(f"{provider.__class__.__name__} failed: {exc}")
    return docs


def load_seed_documents(path: str | Path) -> list[RawDocumentIn]:
    """Load RawDocumentIn objects from a data_probe normalized-export JSON.

    Lets the pipeline run end-to-end before the live providers are ported.
    Expects the normalized record shape from data_probe (README "Output Format").
    """
    p = Path(path)
    if not p.exists():
        # TODO: export data_probe/output/normalized/*.json and point here.
        logger.warning(f"Seed file not found: {p}")
        return []
    records = json.loads(p.read_text(encoding="utf-8"))
    docs: list[RawDocumentIn] = []
    for r in records:
        if r.get("status") != "success":
            continue
        market = r.get("market", "")
        docs.append(
            RawDocumentIn(
                source_type=_normalize_source_type(r.get("source_type", "news")),
                source_name=r.get("entity", "unknown"),
                market=market,
                region=region_for(market),
                title=r.get("title") or "",
                summary=r.get("summary"),
                url=r.get("url", ""),
                published_at=_parse_dt(r.get("published_at")),
                fetched_at=_parse_dt(r.get("fetched_at")) or datetime.now(timezone.utc),
                # TODO: data_probe RSS records have no body — raw_content is None.
                raw_content=None,
            )
        )
    logger.info(f"Loaded {len(docs)} seed documents from {p}")
    return docs


def _normalize_source_type(value: str) -> SourceType:
    """data_probe uses platform_policy / mall — map to canonical SourceType."""
    mapping = {
        "platform_policy": SourceType.platform,
        "mall": SourceType.mall,
    }
    if value in mapping:
        return mapping[value]
    try:
        return SourceType(value)
    except ValueError:
        return SourceType.news


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
