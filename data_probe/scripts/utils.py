"""Shared utilities for all probe scripts."""
from __future__ import annotations

import json
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests
import yaml
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv()

ROOT = Path(__file__).parent.parent
OUTPUT_RAW = ROOT / "output" / "raw"
OUTPUT_NORMALIZED = ROOT / "output" / "normalized"
SOURCES_PATH = ROOT / "config" / "sources.yaml"

OUTPUT_RAW.mkdir(parents=True, exist_ok=True)
OUTPUT_NORMALIZED.mkdir(parents=True, exist_ok=True)

TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "15"))
USER_AGENT = os.getenv("USER_AGENT", "AurumRadarDataProbe/0.1")

HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept-Language": "en-US,en;q=0.9",
}


def load_sources() -> dict:
    with open(SOURCES_PATH, encoding="utf-8") as f:
        return yaml.safe_load(f)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def timestamp_slug() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def fetch_html(url: str) -> tuple[str | None, str | None]:
    """Fetch a URL and return (html_text, error_message)."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        resp.raise_for_status()
        return resp.text, None
    except requests.exceptions.Timeout:
        return None, "timeout"
    except requests.exceptions.HTTPError as e:
        return None, f"http_error:{e.response.status_code}"
    except Exception as e:
        return None, str(e)


def parse_page_title(html: str) -> str:
    soup = BeautifulSoup(html, "lxml")
    tag = soup.find("title")
    return tag.get_text(strip=True) if tag else ""


def extract_links_by_keywords(html: str, base_url: str, keywords: list[str]) -> list[dict]:
    """Return links whose href or text contains any of the keywords (case-insensitive)."""
    soup = BeautifulSoup(html, "lxml")
    results = []
    seen = set()
    kw_lower = [k.lower() for k in keywords]
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        text = a.get_text(strip=True)
        combined = (href + " " + text).lower()
        if any(kw in combined for kw in kw_lower):
            if href.startswith("http"):
                full = href
            elif href.startswith("/"):
                from urllib.parse import urlparse
                p = urlparse(base_url)
                full = f"{p.scheme}://{p.netloc}{href}"
            else:
                continue
            if full not in seen:
                seen.add(full)
                results.append({"text": text, "url": full})
    return results


def make_record(
    source_type: str,
    market: str,
    entity: str,
    url: str,
    title: str | None = None,
    summary: str | None = None,
    published_at: str | None = None,
    status: str = "success",
    error: str | None = None,
    extra: dict | None = None,
) -> dict:
    record = {
        "source_type": source_type,
        "market": market,
        "entity": entity,
        "title": title,
        "summary": summary,
        "url": url,
        "published_at": published_at,
        "fetched_at": now_iso(),
        "status": status,
        "error": error,
    }
    if extra:
        record.update(extra)
    return record


def save_outputs(source_type: str, raw: list[dict], normalized: list[dict]) -> None:
    slug = timestamp_slug()
    raw_path = OUTPUT_RAW / f"{source_type}_{slug}.json"
    norm_path = OUTPUT_NORMALIZED / f"{source_type}_{slug}.json"

    with open(raw_path, "w", encoding="utf-8") as f:
        json.dump(raw, f, ensure_ascii=False, indent=2)
    with open(norm_path, "w", encoding="utf-8") as f:
        json.dump(normalized, f, ensure_ascii=False, indent=2)

    print(f"  [saved] raw      → {raw_path.relative_to(ROOT)}")
    print(f"  [saved] normalized → {norm_path.relative_to(ROOT)}")
