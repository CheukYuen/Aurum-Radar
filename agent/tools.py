import os
import json
from collections import Counter
import db

TOOLS = [
    {
        "name": "query_events_by_market",
        "description": "Query all structured events for a specific market in the last N days. Use this to understand what happened in a market recently.",
        "input_schema": {
            "type": "object",
            "properties": {
                "market": {
                    "type": "string",
                    "enum": ["Singapore", "Dubai", "Milan", "Global"],
                },
                "days": {"type": "integer", "default": 7},
            },
            "required": ["market"],
        },
    },
    {
        "name": "compare_markets",
        "description": "Compare 2-3 markets on a specific dimension (competition/product/regulation/channel/social). Use for cross-market pattern detection.",
        "input_schema": {
            "type": "object",
            "properties": {
                "markets": {"type": "array", "items": {"type": "string"}},
                "dimension": {"type": "string"},
                "days": {"type": "integer", "default": 7},
            },
            "required": ["markets", "dimension"],
        },
    },
    {
        "name": "search_web",
        "description": "Search web via Tavily when database evidence is insufficient. Returns up to 3 fresh news results.",
        "input_schema": {
            "type": "object",
            "properties": {"query": {"type": "string"}},
            "required": ["query"],
        },
    },
    {
        "name": "get_category_trend",
        "description": "Count events in a category (e.g. 'regulation') over the last N days and show market distribution. Use to confirm trend strength.",
        "input_schema": {
            "type": "object",
            "properties": {
                "category": {"type": "string"},
                "days": {"type": "integer", "default": 7},
            },
            "required": ["category"],
        },
    },
]


def _query_events_by_market(conn, market: str, days: int = 7) -> dict:
    events = db.query_events(conn, market=market, days=days)
    return {
        "count": len(events),
        "events": [
            {
                "id": e["id"],
                "title": e["title"],
                "category": e["category"],
                "impact": e["impact"],
                "summary": e["summary"],
            }
            for e in events[:15]
        ],
    }


def _compare_markets(conn, markets: list, dimension: str, days: int = 7) -> dict:
    result = {}
    for m in markets:
        events = db.query_events(conn, market=m, days=days)
        filtered = [e for e in events if e["category"] == dimension]
        impacts = Counter(e["impact"] for e in filtered if e["impact"])
        result[m] = {
            "event_count": len(filtered),
            "impact_breakdown": dict(impacts),
            "top_titles": [e["title"] for e in filtered[:3]],
        }
    return result


def _search_web(query: str):
    from cache import cache_get, cache_set

    cached = cache_get(query)
    if cached is not None:
        return cached

    key = os.environ.get("TAVILY_API_KEY", "").strip()
    if not key:
        return {"error": "TAVILY_API_KEY not set"}
    try:
        from tavily import TavilyClient
        client = TavilyClient(api_key=key)
        res = client.search(query=query, max_results=3, topic="news", days=7)
        results = [
            {"title": r["title"], "url": r["url"], "snippet": r["content"][:300]}
            for r in res.get("results", [])
        ]
        cache_set(query, results)
        return results
    except Exception as e:
        return {"error": str(e)}


def _get_category_trend(conn, category: str, days: int = 7) -> dict:
    events = db.query_events(conn, days=days)
    filtered = [e for e in events if e["category"] == category]
    market_dist = Counter(e["market"] for e in filtered)
    return {
        "total_events": len(filtered),
        "market_distribution": dict(market_dist),
        "trend": "rising" if len(filtered) >= 5 else "stable",
    }


def dispatch_tool(name: str, args: dict, conn) -> dict:
    if name == "query_events_by_market":
        return _query_events_by_market(conn, **args)
    if name == "compare_markets":
        return _compare_markets(conn, **args)
    if name == "search_web":
        return _search_web(**args)
    if name == "get_category_trend":
        return _get_category_trend(conn, **args)
    return {"error": f"unknown tool: {name}"}
