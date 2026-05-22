import json
from pathlib import Path
from datetime import datetime, timedelta

_CACHE_FILE = Path(__file__).parent / "outputs" / "tavily_cache.json"
_TTL_HOURS = 24


def _load() -> dict:
    if _CACHE_FILE.exists():
        return json.loads(_CACHE_FILE.read_text(encoding="utf-8"))
    return {}


def _save(data: dict):
    _CACHE_FILE.parent.mkdir(exist_ok=True)
    _CACHE_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def cache_get(query: str):
    entry = _load().get(query)
    if not entry:
        return None
    age = datetime.now() - datetime.fromisoformat(entry["cached_at"])
    if age > timedelta(hours=_TTL_HOURS):
        return None
    return entry["results"]


def cache_set(query: str, results):
    data = _load()
    data[query] = {"results": results, "cached_at": datetime.now().isoformat()}
    _save(data)
