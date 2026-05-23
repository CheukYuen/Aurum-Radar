"""Google News RSS enricher — resolves GN redirect URLs and fetches article full text.

Reads:
  output/normalized/google_news_rss_YYYYMMDD.jsonl  (normalized records)
  output/raw/google_news_rss_YYYYMMDD.jsonl          (raw records, has source_domain)
Writes:
  output/normalized/google_news_rss_enriched_YYYYMMDD.jsonl

Two-step enrichment per record:
  1. Skip if raw_text already present (idempotent).
  2. Try following the GN redirect URL directly (urllib follows 30x redirects).
  3. If resolved URL is still on news.google.com, fall back to DDG two-step
     using source_domain from the raw side-car file.
  4. Fetch article body from the resolved real URL via fetch_article_text().
  5. Write enriched record: url → real URL, raw_text → body, gn_url → original.

Rate limiting: DDG_DELAY between DuckDuckGo calls, ARTICLE_DELAY between fetches.
Full run (~654 records) ≈ 30–40 min. Use --max 20 to test first.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from utils import (  # noqa: E402
    OUTPUT_NORMALIZED,
    OUTPUT_RAW,
    ROOT,
    TIMEOUT,
    fetch_article_text,
    now_iso,
    resolve_article_url,
)

DDG_DELAY = 2.5     # seconds between DuckDuckGo requests (avoid 429)
ARTICLE_DELAY = 1.0 # seconds between article page fetches

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 Chrome/124 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
}

_DDG_TEST_URL = "https://html.duckduckgo.com/html/?q=gold+jewelry+market"
_DDG_BOT_SIGNATURES = ["anomaly.js", "cc=botnet", "cc=sre", "challenge-form"]


def preflight_ddg_check() -> bool:
    """Return True if DDG HTML search is reachable and not bot-blocked.

    DDG returns a JS challenge page (containing 'anomaly.js') when it detects
    datacenter IPs (e.g. Cursor sandbox proxy). Run this script from your
    system terminal where the real VPN proxy (127.0.0.1:7897) is active.
    """
    req = urllib.request.Request(_DDG_TEST_URL, headers=_HEADERS)
    try:
        html = urllib.request.urlopen(req, timeout=10).read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"  [warn] DDG preflight error: {e}")
        return False
    blocked = any(sig in html for sig in _DDG_BOT_SIGNATURES)
    return not blocked


# ── helpers ────────────────────────────────────────────────────────────────

def _is_gn_url(url: str) -> bool:
    return "news.google.com" in url


def _follow_redirect(url: str) -> str | None:
    """Follow HTTP 30x redirects and return the final URL.

    urllib.request.urlopen() already follows redirects automatically;
    we just need the final URL from resp.geturl().
    Returns None on any network error.
    """
    req = urllib.request.Request(url, headers=_HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return resp.geturl()
    except Exception:
        return None


def load_domain_map(raw_path: Path) -> dict[str, str]:
    """Build title → source_domain from the raw side-car JSONL.

    probe_global_news.py writes source_domain (e.g. 'reuters.com') into the raw
    records but not the normalized ones (which only carry author_or_account = media
    title). This map lets us look it up by title for DDG fallback.
    """
    mapping: dict[str, str] = {}
    if not raw_path.exists():
        return mapping
    with open(raw_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
                title = rec.get("title", "")
                domain = rec.get("source_domain", "")
                if title and domain:
                    mapping[title] = domain
            except json.JSONDecodeError:
                continue
    return mapping


# ── core enrichment logic ───────────────────────────────────────────────────

def enrich_record(rec: dict, domain_map: dict[str, str]) -> dict:
    """Return a new dict with url + raw_text enriched where possible.

    enrich_status values:
      skipped_has_text  — raw_text was already non-empty, no work done
      ok                — real URL found AND article body fetched
      url_resolved      — real URL found but article body fetch returned nothing
      url_not_resolved  — could not resolve a real URL (GN redirect + DDG both failed)
    """
    out = dict(rec)
    title = rec.get("title", "")
    url = rec.get("url", "")

    if rec.get("raw_text"):
        out["enrich_status"] = "skipped_has_text"
        return out

    real_url: str | None = None

    if _is_gn_url(url):
        # Step 1 — follow the GN redirect directly.
        resolved = _follow_redirect(url)
        if resolved and not _is_gn_url(resolved):
            real_url = resolved
        else:
            # Step 2 — DDG two-step fallback.
            source_domain = domain_map.get(title, "")
            if source_domain:
                time.sleep(DDG_DELAY)
                real_url = resolve_article_url(title, source_domain)
    else:
        # Already a real URL, skip redirect step.
        real_url = url

    if not real_url:
        out["enrich_status"] = "url_not_resolved"
        out["gn_url"] = url
        return out

    out["gn_url"] = url   # preserve original GN URL for traceability
    out["url"] = real_url

    # Step 3 — fetch article body.
    time.sleep(ARTICLE_DELAY)
    text = fetch_article_text(real_url)
    if text:
        out["raw_text"] = text
        out["enrich_status"] = "ok"
    else:
        out["enrich_status"] = "url_resolved"

    return out


# ── entry point ─────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Enrich Google News RSS JSONL with real URLs and article body text."
    )
    parser.add_argument(
        "--date", default=None,
        help="YYYYMMDD date slug of source file (default: today UTC)",
    )
    parser.add_argument(
        "--max", type=int, default=0,
        help="Max records to process, 0 = all (use 20 to test first)",
    )
    parser.add_argument(
        "--min-chars", type=int, default=200,
        help="Min raw_text length to count as 'has body' in summary (default: 200)",
    )
    args = parser.parse_args()

    date_slug = args.date or datetime.now(timezone.utc).strftime("%Y%m%d")

    norm_path = OUTPUT_NORMALIZED / f"google_news_rss_{date_slug}.jsonl"
    raw_path  = OUTPUT_RAW        / f"google_news_rss_{date_slug}.jsonl"
    out_path  = OUTPUT_NORMALIZED / f"google_news_rss_enriched_{date_slug}.jsonl"

    if not norm_path.exists():
        print(f"[error] source file not found: {norm_path.relative_to(ROOT)}")
        print("  Run `python scripts/probe_global_news.py` first.")
        sys.exit(1)

    print("=== probe_global_news_enrich ===")
    print(f"  date    : {date_slug}")
    print(f"  source  : {norm_path.relative_to(ROOT)}")
    print(f"  raw     : {raw_path.relative_to(ROOT)}"
          f" ({'found' if raw_path.exists() else 'NOT FOUND — DDG fallback disabled'})")
    print(f"  output  : {out_path.relative_to(ROOT)}")

    domain_map = load_domain_map(raw_path)
    print(f"  domain_map entries : {len(domain_map)}")

    # Pre-flight: verify DDG is reachable (fails from Cursor sandbox / datacenter IPs).
    print()
    print("  [preflight] checking DDG availability ...", end=" ", flush=True)
    ddg_ok = preflight_ddg_check()
    if ddg_ok:
        print("OK — DDG reachable, two-step enrichment will run.")
    else:
        print("BLOCKED — aborting.")
        print()
        print("  DDG is returning a bot-challenge page (anomaly.js).")
        print("  This happens via datacenter IPs (e.g. Cursor sandbox proxy :58423).")
        print("  DDG only works through a residential/VPN proxy (e.g. :7897).")
        print()
        print("  Run from your system terminal (iTerm2 / Terminal.app) instead:")
        print("    cd data_probe && source .venv/bin/activate")
        max_hint = f"--max {args.max}" if args.max else ""
        print(f"    python scripts/probe_global_news_enrich.py {max_hint}".rstrip())
        sys.exit(1)

    records: list[dict] = []
    with open(norm_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    records.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
    print(f"  records loaded     : {len(records)}")

    if args.max and args.max < len(records):
        records = records[: args.max]
        print(f"  capped to          : {args.max}")

    estimated_min = len(records) * (DDG_DELAY + ARTICLE_DELAY) / 60
    print(f"  estimated time     : ~{estimated_min:.0f} min (worst case)")
    print()

    enriched: list[dict] = []
    status_counts: dict[str, int] = {}
    total = len(records)

    for i, rec in enumerate(records, 1):
        title_short = (rec.get("title") or "")[:55]
        market = rec.get("market", "??")
        print(f"  [{i:>3}/{total}] [{market}] {title_short:<55}", end=" ", flush=True)

        result = enrich_record(rec, domain_map)

        status = result.get("enrich_status", "unknown")
        status_counts[status] = status_counts.get(status, 0) + 1
        text_len = len(result.get("raw_text") or "")
        print(f"→ {status} ({text_len:>5} chars)")

        enriched.append(result)

    # Write output (overwrite — this is a derived file).
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        for rec in enriched:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    ok_count    = status_counts.get("ok", 0)
    url_only    = status_counts.get("url_resolved", 0)
    no_url      = status_counts.get("url_not_resolved", 0)
    skipped     = status_counts.get("skipped_has_text", 0)
    with_body   = sum(1 for r in enriched if len(r.get("raw_text") or "") >= args.min_chars)

    print()
    print("─" * 55)
    print(f"  done at           : {now_iso()}")
    print(f"  total processed   : {total}")
    print(f"  ok (url+body)     : {ok_count}")
    print(f"  url resolved only : {url_only}")
    print(f"  url not resolved  : {no_url}")
    print(f"  skipped (had text): {skipped}")
    print(f"  ≥{args.min_chars} chars body   : {with_body} "
          f"({with_body / total * 100:.1f}%)")
    print(f"  output            : {out_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
