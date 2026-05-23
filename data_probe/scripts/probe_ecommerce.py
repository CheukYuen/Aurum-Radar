"""E-commerce platform announcement probe.

For each source in sources.yaml:ecommerce_announcements:
  - access_type=rss  → feedparser
  - access_type=html → urllib + BeautifulSoup, best-effort extract title/link/date

On parse failure, save raw HTML snapshot to output/raw/ and emit a
`parse_failed` record but do NOT crash. Lazada is known to be JS-rendered
(see data_probe/CLAUDE.md) so it will likely take the parse_failed path.
"""
from __future__ import annotations

import sys
from pathlib import Path
from urllib.parse import urljoin, urlparse

sys.path.insert(0, str(Path(__file__).parent))

import feedparser  # noqa: E402
from bs4 import BeautifulSoup  # noqa: E402
from utils import (  # noqa: E402
    detect_entities,
    fetch_html,
    load_keywords,
    load_sources,
    make_intelligence_record,
    save_jsonl,
    save_raw_snapshot,
)

GOOGLEBOT_UA = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
MAX_ITEMS_PER_SOURCE = 20


def _market_of(src: dict) -> str:
    markets = src.get("markets") or ["GLOBAL"]
    return markets[0]


def _probe_rss(src: dict, kw: dict) -> tuple[list[dict], list[dict], int, int]:
    name = src["source_name"]
    api_url = src.get("api_url") or src.get("url")
    feed = feedparser.parse(api_url)
    if feed.bozo and not feed.entries:
        print(f"    [failed] {name} → feedparser bozo: {feed.bozo_exception}")
        return [], [_failed_record(src, f"feedparser bozo: {feed.bozo_exception}")], 0, 1

    raw, normalized = [], []
    entries = feed.entries[:MAX_ITEMS_PER_SOURCE]
    for e in entries:
        title = e.get("title", "") or ""
        link = e.get("link", "") or api_url
        published = e.get("published", "") or e.get("updated", "") or ""
        summary = (e.get("summary", "") or "")[:600]
        ent = detect_entities(title + " " + summary, kw)
        raw.append({"title": title, "url": link, "published": published, "source": name})
        normalized.append(make_intelligence_record(
            source_id=src["source_id"],
            source_name=name,
            source_type="ecommerce",
            market=_market_of(src),
            language="en",
            title=title,
            url=link,
            published_at=published,
            summary=summary,
            keywords=ent["keywords"],
            brands=ent["brands"],
            products=ent["products"],
            signal_type="platform_policy",
            impact_direction="watch",
            evidence_level="official",
            confidence=0.8,
        ))
    print(f"    [rss ok] {name} → {len(entries)} entries")
    return raw, normalized, len(entries), 0


def _probe_html(src: dict, kw: dict) -> tuple[list[dict], list[dict], int, int]:
    name = src["source_name"]
    url = src.get("url")
    html, err = fetch_html(url, ua=GOOGLEBOT_UA)
    if err or not html:
        print(f"    [failed] {name} → {err or 'empty_html'}")
        return [], [_failed_record(src, err or "empty_html")], 0, 1

    soup = BeautifulSoup(html, "lxml")
    items = _extract_announcement_items(soup, url)
    if not items:
        snap = save_raw_snapshot(src["source_id"], "html", html)
        print(f"    [parse_failed] {name} → no items extracted; raw saved → {snap}")
        rec = make_intelligence_record(
            source_id=src["source_id"],
            source_name=name,
            source_type="ecommerce",
            market=_market_of(src),
            language="en",
            title=f"[parse_failed] {name}",
            url=url,
            summary=f"raw snapshot saved to {snap}",
            signal_type="platform_policy",
            impact_direction="watch",
            evidence_level="official",
            confidence=0.0,
        )
        return [{"snapshot": snap, "url": url}], [rec], 0, 1

    raw, normalized = [], []
    for it in items[:MAX_ITEMS_PER_SOURCE]:
        title = it["title"]
        link = it["url"]
        ent = detect_entities(title, kw)
        raw.append({"title": title, "url": link, "source": name})
        normalized.append(make_intelligence_record(
            source_id=src["source_id"],
            source_name=name,
            source_type="ecommerce",
            market=_market_of(src),
            language="en",
            title=title,
            url=link,
            summary="",
            keywords=ent["keywords"],
            brands=ent["brands"],
            products=ent["products"],
            signal_type="platform_policy",
            impact_direction="watch",
            evidence_level="official",
            confidence=0.6,
        ))
    print(f"    [html ok] {name} → {len(items)} items")
    return raw, normalized, len(items), 0


_ANNOUNCEMENT_HINTS = [
    "announcement", "announce", "policy", "update", "release",
    "change", "news", "notice", "guideline", "rule",
]


def _extract_announcement_items(soup: BeautifulSoup, base_url: str) -> list[dict]:
    """Best-effort extraction of (title, url) pairs from a generic platform page.

    Strategy: look for <article>, <li>, or <a> tags whose text contains an
    announcement hint OR whose href contains one. Filter very-short text.
    """
    items: list[dict] = []
    seen: set[str] = set()

    # 1) <article> nodes with an inner anchor
    for art in soup.find_all("article"):
        a = art.find("a", href=True)
        if not a:
            continue
        title = a.get_text(strip=True)
        if len(title) < 12:
            continue
        href = a["href"]
        full = href if href.startswith("http") else urljoin(base_url, href)
        if full in seen:
            continue
        seen.add(full)
        items.append({"title": title, "url": full})

    if items:
        return items

    # 2) Anchor-based heuristic: text or href matches a hint
    for a in soup.find_all("a", href=True):
        text = a.get_text(strip=True)
        if len(text) < 18:
            continue
        href = a["href"]
        combined = (text + " " + href).lower()
        if not any(h in combined for h in _ANNOUNCEMENT_HINTS):
            continue
        full = href if href.startswith("http") else urljoin(base_url, href)
        if urlparse(full).scheme not in ("http", "https"):
            continue
        if full in seen:
            continue
        seen.add(full)
        items.append({"title": text, "url": full})
        if len(items) >= MAX_ITEMS_PER_SOURCE * 2:
            break

    return items


def _failed_record(src: dict, err: str) -> dict:
    return make_intelligence_record(
        source_id=src["source_id"],
        source_name=src["source_name"],
        source_type="ecommerce",
        market=_market_of(src),
        language="en",
        title=f"[failed] {src['source_name']}",
        url=src.get("url", ""),
        summary=err,
        signal_type="platform_policy",
        impact_direction="watch",
        evidence_level="official",
        confidence=0.0,
    )


def probe_ecommerce() -> list[dict]:
    sources = load_sources().get("ecommerce_announcements") or []
    kw = load_keywords()

    all_raw: list[dict] = []
    all_normalized: list[dict] = []
    fetched = failed = 0

    for src in sources:
        if not src.get("enabled", True):
            print(f"  [skip] {src['source_name']} disabled")
            continue
        name = src["source_name"]
        access = src.get("access_type", "html")
        print(f"  → [{access.upper()}] {name}")
        try:
            if access == "rss":
                raw, normalized, f_count, fail = _probe_rss(src, kw)
            else:
                raw, normalized, f_count, fail = _probe_html(src, kw)
            all_raw.extend(raw)
            all_normalized.extend(normalized)
            fetched += f_count
            failed += fail
        except Exception as e:
            failed += 1
            print(f"    [error] {name}: {e}")
            all_normalized.append(_failed_record(src, str(e)))

    info = save_jsonl("ecommerce_announcements", all_normalized, raw=all_raw)
    print(f"  source_name        : ecommerce_announcements (multi)")
    print(f"  fetched_count      : {fetched}")
    print(f"  normalized_count   : {len(all_normalized)}")
    print(f"  saved_path         : {info['normalized_path']}")
    print(f"  failed_count       : {failed}")
    return all_normalized


if __name__ == "__main__":
    print("=== probe_ecommerce ===")
    results = probe_ecommerce()
    print(f"Done: {len(results)} records")
