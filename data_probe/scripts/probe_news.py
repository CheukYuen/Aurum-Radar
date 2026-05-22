"""Probe news sources for gold jewellery mentions.

Supports two methods (configured per-source in sources.yaml):
  rss  — parse via feedparser, returns real article titles/links/dates
  html — fallback HTML keyword link extraction
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

NEWS_KEYWORDS = ["gold", "jewellery", "jewelry", "luxury", "collection",
                 "store", "campaign", "precious", "retail", "diamond"]

MAX_ENTRIES_PER_FEED = 20

# 抓取正文最多处理前 N 篇（DDG 请求有速率限制，避免过快）
MAX_FULLTEXT_PER_FEED = 3


def _probe_rss(src: dict, fetch_fulltext: bool = False) -> tuple[dict, list[dict]]:
    name = src["name"]
    market = src["market"]
    url = src["url"]

    feed = feedparser.parse(url)
    if feed.bozo and not feed.entries:
        raw = {"source": src, "entry_count": 0, "entries": []}
        rec = make_record("news", market, name, url, status="failed",
                          error=f"feedparser bozo: {feed.bozo_exception}")
        return raw, [rec]

    entries = feed.entries[:MAX_ENTRIES_PER_FEED]
    raw_entries = []
    normalized = []
    fulltext_count = 0

    for e in entries:
        title = e.get("title", "")
        link = e.get("link", url)
        summary = e.get("summary", "") or ""
        published = e.get("published", "") or ""

        src_obj = e.get("source", {})
        source_name = src_obj.get("title", name) if isinstance(src_obj, dict) else name
        source_domain = ""
        if isinstance(src_obj, dict):
            raw_domain = src_obj.get("href", "")
            if raw_domain:
                from urllib.parse import urlparse
                source_domain = urlparse(raw_domain).netloc  # e.g. www.channelnewsasia.com

        # 尝试抓正文（仅前 MAX_FULLTEXT_PER_FEED 篇且来源域名已知）
        fulltext = None
        real_url = None
        if fetch_fulltext and source_domain and fulltext_count < MAX_FULLTEXT_PER_FEED:
            clean_title = title.split(" - ")[0].strip()
            real_url = resolve_article_url(clean_title, source_domain)
            if real_url:
                fulltext = fetch_article_text(real_url)
                fulltext_count += 1
                status_tag = "✓" if fulltext else "url_found"
                print(f"      [{status_tag}] {source_name}: {real_url[:70]}")
            else:
                print(f"      [url_not_found] {source_name}: {clean_title[:50]}")

        raw_entries.append({
            "title": title,
            "url": real_url or link,
            "gn_url": link,
            "published": published,
            "source": source_name,
            "fulltext_chars": len(fulltext) if fulltext else 0,
        })
        normalized.append(make_record(
            "news", market, name, real_url or link,
            title=title,
            summary=fulltext[:500] if fulltext else (summary[:300] if summary else None),
            published_at=published,
            extra={
                "media_source": source_name,
                "gn_url": link,
                "fulltext": fulltext,
                "source_domain": source_domain,
            },
        ))

    raw = {"source": src, "entry_count": len(entries), "entries": raw_entries}
    return raw, normalized


def _probe_html(src: dict) -> tuple[dict, list[dict]]:
    name = src["name"]
    market = src["market"]
    url = src["url"]

    html, err = fetch_html(url)
    if err:
        raw = {"source": src, "html_length": 0, "links": []}
        return raw, [make_record("news", market, name, url, status="failed", error=err)]

    title = parse_page_title(html)
    links = extract_links_by_keywords(html, url, NEWS_KEYWORDS)
    raw = {"source": src, "html_length": len(html), "page_title": title, "links": links}

    if links:
        recs = [make_record("news", market, name, lnk["url"], title=lnk["text"] or title)
                for lnk in links[:10]]
    else:
        recs = [make_record("news", market, name, url, title=title,
                            error="no matching links found")]
    return raw, recs


def probe_news(fetch_fulltext: bool = False) -> list[dict]:
    sources = load_sources().get("news", [])
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
        print(f"    [{recs[0]['status'] if recs else 'empty'}] records={len(recs)}  success={ok}")
        if recs and recs[0]["status"] == "success":
            print(f"    sample: {recs[0].get('title','')[:70]}")

    save_outputs("news", raw_all, normalized)
    return normalized


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--fulltext", action="store_true",
                        help=f"Resolve real URLs via DuckDuckGo and fetch article text (first {MAX_FULLTEXT_PER_FEED} per feed)")
    args = parser.parse_args()

    print("=== probe_news ===")
    if args.fulltext:
        print(f"  [fulltext mode] resolving URLs + fetching content (max {MAX_FULLTEXT_PER_FEED}/feed)")
    results = probe_news(fetch_fulltext=args.fulltext)
    ok = sum(1 for r in results if r["status"] == "success")
    print(f"Done: {ok}/{len(results)} success")
