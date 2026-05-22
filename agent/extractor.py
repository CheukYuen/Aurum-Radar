import os
import json
from pathlib import Path
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent / ".env", override=True)
if os.getenv("ANTHROPIC_BASE_URL"):
    os.environ.pop("ANTHROPIC_AUTH_TOKEN", None)

client = Anthropic(base_url=os.getenv("ANTHROPIC_BASE_URL"))
MODEL = os.environ["MODEL_ID"]

EXTRACTION_PROMPT = """You are a luxury jewelry industry intelligence analyst.
Extract a structured event from the raw input below.

Title: {title}
Summary: {summary}
URL: {url}

Output ONLY valid JSON, no markdown fences, no commentary.
Schema:
{{
  "title": "event title in Chinese (≤30 chars)",
  "market": "Singapore | Dubai | Milan | Global | Other",
  "category": "competition | product | regulation | channel | social",
  "summary": "Chinese summary (≤100 chars)",
  "impact": "opportunity | risk | watch",
  "related_brands": ["brand1", "brand2"],
  "confidence": 0.0
}}

If completely unrelated to the luxury jewelry/watches industry, output: {{"skip": true}}
"""


def _parse_json(text: str):
    text = text.strip()
    if text.startswith("```"):
        parts = text.split("```")
        for p in parts:
            p = p.strip()
            if p.startswith("json"):
                p = p[4:].strip()
            if p.startswith("{"):
                try:
                    return json.loads(p)
                except json.JSONDecodeError:
                    continue
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start >= 0 and end > start:
            try:
                return json.loads(text[start : end + 1])
            except json.JSONDecodeError:
                pass
    return None


def extract_event(raw_item: dict):
    prompt = EXTRACTION_PROMPT.format(
        title=raw_item["title"],
        summary=raw_item["summary"],
        url=raw_item["url"],
    )
    try:
        resp = client.messages.create(
            model=MODEL,
            max_tokens=800,
            messages=[{"role": "user", "content": prompt}],
        )
        text = next((b.text for b in resp.content if b.type == "text"), "")
        data = _parse_json(text)
        if not data or data.get("skip"):
            return None
        data["source_url"] = raw_item["url"]
        data["source_type"] = raw_item["source_type"]
        data["published_at"] = raw_item.get("published_at", "")
        return data
    except Exception as e:
        print(f"  [warn] extractor error: {e}")
        return None
