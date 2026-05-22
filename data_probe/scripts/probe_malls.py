"""Probe luxury mall websites for jewellery / event signals.

Methods:
  rss  — Google News RSS search (primary, no SSL issues)
  html — direct page scraping for structured event/store listings
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import feedparser
from utils import (
    extract_links_by_keywords,
    fetch_article_text,
    fetch_html,
    load_sources,
    make_record,
    parse_page_title,
    resolve_article_url,
    save_outputs,
)

MALL_KEYWORDS = ["jewellery", "jewelry", "luxury", "event", "popup",
                 "pop-up", "promotion", "watch", "campaign", "exclusive",
                 "boutique", "diamond", "gold", "gem"]

MAX_RSS_ENTRIES = 20
MAX_FULLTEXT_PER_FEED = 3


def _probe_rss(src: dict, fetch_fulltext: bool = False) -> tuple[dict, list[dict]]:
    name = src["name"]
    market = src["market"]
    url = src["url"]

    feed = feedparser.parse(url)
    if feed.bozo and not feed.entries:
        return ({"source": src, "entry_count": 0},
                [make_record("mall", market, name, url, status="failed",
                             error=f"feedparser bozo: {feed.bozo_exception}")])

    entries = feed.entries[:MAX_RSS_ENTRIES]
    raw_entries, normalized = [], []
    fulltext_count = 0

    for e in entries:
        from urllib.parse import urlparse
        title = e.get("title", "")
        link = e.get("link", url)
        summary = e.get("summary", "") or ""
        published = e.get("published", "") or ""
        src_obj = e.get("source", {}) or {}
        source_name = src_obj.get("title", name) if isinstance(src_obj, dict) else name
        domain = urlparse(src_obj.get("href", "")).netloc if isinstance(src_obj, dict) else ""

        fulltext = None
        real_url = None
        if fetch_fulltext and domain and fulltext_count < MAX_FULLTEXT_PER_FEED:
            clean_title = title.split(" - ")[0].strip()
            real_url = resolve_article_url(clean_title, domain)
            if real_url:
                fulltext = fetch_article_text(real_url)
                fulltext_count += 1
                print(f"      [{'✓' if fulltext else 'url_found'}] {source_name}: {real_url[:70]}")
            else:
                print(f"      [url_not_found] {source_name}: {clean_title[:50]}")

        raw_entries.append({"title": title, "url": real_url or link, "gn_url": link,
                            "published": published, "source": source_name,
                            "fulltext_chars": len(fulltext) if fulltext else 0})
        normalized.append(make_record(
            "mall", market, name, real_url or link,
            title=title,
            summary=fulltext[:500] if fulltext else (summary[:300] if summary else None),
            published_at=published,
            extra={"media_source": source_name, "gn_url": link,
                   "fulltext": fulltext, "source_domain": domain},
        ))

    raw = {"source": src, "entry_count": len(entries), "entries": raw_entries}
    return raw, normalized


def _probe_html(src: dict) -> tuple[dict, list[dict]]:
    name = src["name"]
    market = src["market"]
    url = src["url"]

    html, err = fetch_html(url)
    if err:
        return ({"source": src, "html_length": 0, "links": []},
                [make_record("mall", market, name, url, status="failed", error=err)])

    title = parse_page_title(html)
    links = extract_links_by_keywords(html, url, MALL_KEYWORDS)
    raw = {"source": src, "html_length": len(html), "page_title": title, "links": links}

    if links:
        recs = [make_record("mall", market, name, lnk["url"], title=lnk["text"] or title)
                for lnk in links[:15]]
    else:
        recs = [make_record("mall", market, name, url, title=title,
                            error="no matching links found")]
    return raw, recs


def probe_malls(fetch_fulltext: bool = False) -> list[dict]:
    sources = load_sources().get("malls", [])
    raw_all, normalized = [], []

    for src in sources:
        name = src["name"]
        method = src.get("method", "html")
        print(f"  → [{method.upper()}] {name}")

        if method == "rss":
            raw, recs = _probe_rss(src, fetch_fulltext=fetch_fulltext)
        else:
            raw, recs = _probe_html(src)

        raw_all.append(raw)
        normalized.extend(recs)

        ok = sum(1 for r in recs if r["status"] == "success")
        print(f"    [{recs[0]['status'] if recs else 'empty'}] records={len(recs)} success={ok}")
        if recs and recs[0]["status"] == "success":
            print(f"    sample: {recs[0].get('title','')[:70]}")

    save_outputs("mall", raw_all, normalized)
    return normalized


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--fulltext", action="store_true",
                        help=f"Resolve real URLs + fetch article text (first {MAX_FULLTEXT_PER_FEED} per feed)")
    args = parser.parse_args()

    print("=== probe_malls ===")
    results = probe_malls(fetch_fulltext=args.fulltext)
    ok = sum(1 for r in results if r["status"] == "success")
    print(f"Done: {ok}/{len(results)} success")
