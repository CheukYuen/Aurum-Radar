"""Shared utilities for all probe scripts."""
from __future__ import annotations

import json
import os
import time
import urllib.parse
import urllib.request
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


_BOILERPLATE_PHRASES = [
    "Advertisement", "Subscribe", "Sign up", "Cookie", "Terms of Use",
    "Privacy Policy", "WhatsApp", "Facebook", "Telegram", "Bookmark",
    "Copyright©", "All rights reserved", "download the mobile app",
    "upgrade to a supported browser", "breaking news",
]

_URLLIB_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
}


def resolve_article_url(title: str, source_domain: str) -> str | None:
    """Use DuckDuckGo HTML search to find the real article URL from title + source domain.

    Uses urllib (not requests) to avoid LibreSSL 2.8.3 incompatibility.
    Returns the first matching URL, or None if not found.
    """
    query = f"site:{source_domain} {title[:80]}"
    qs = urllib.parse.urlencode({"q": query})
    ddg_url = f"https://html.duckduckgo.com/html/?{qs}"
    req = urllib.request.Request(ddg_url, headers=_URLLIB_HEADERS)
    try:
        html = urllib.request.urlopen(req, timeout=TIMEOUT).read().decode("utf-8", errors="replace")
    except Exception:
        return None

    soup = BeautifulSoup(html, "lxml")
    for a in soup.select("a.result__a"):
        href = a.get("href", "")
        params = urllib.parse.parse_qs(urllib.parse.urlparse(href).query)
        real = urllib.parse.unquote(params.get("uddg", [""])[0])
        if real.startswith("http") and source_domain in real:
            return real
    return None


def fetch_article_text(url: str, min_para_len: int = 60, max_paras: int = 30) -> str | None:
    """Fetch a news article URL and return cleaned paragraph text.

    Filters out navigation, ads, and boilerplate. Uses urllib to avoid LibreSSL issues.
    Returns joined paragraph text, or None on fetch failure.
    """
    req = urllib.request.Request(url, headers=_URLLIB_HEADERS)
    try:
        html = urllib.request.urlopen(req, timeout=TIMEOUT).read().decode("utf-8", errors="replace")
    except Exception:
        return None

    soup = BeautifulSoup(html, "lxml")
    paras = []
    for p in soup.find_all("p"):
        txt = p.get_text(strip=True)
        if len(txt) < min_para_len:
            continue
        if any(phrase in txt for phrase in _BOILERPLATE_PHRASES):
            continue
        paras.append(txt)
        if len(paras) >= max_paras:
            break

    return "\n\n".join(paras) if paras else None


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
