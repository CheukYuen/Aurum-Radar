import os
import feedparser

RSS_SOURCES = [
    "https://www.businessoffashion.com/feed/",
    "https://jingdaily.com/feed/",
    "https://wwd.com/feed/",
]

KEYWORDS = [
    "jewelry", "jewellery", "luxury", "watches",
    "LVMH", "Richemont", "Tiffany", "Cartier", "Bulgari", "Damiani",
]

SEED_QUERIES = [
    "luxury jewelry Singapore Orchard Road 2026",
    "jewelry market Dubai DIFC 2026",
    "Italian jewelry brand Milan acquisition 2026",
    "LVMH OR Richemont jewelry news",
    "EU jewelry regulation supply chain 2026",
]


def collect_rss(limit_per_feed: int = 15) -> list[dict]:
    items = []
    for url in RSS_SOURCES:
        try:
            feed = feedparser.parse(url)
            for entry in feed.entries[:limit_per_feed]:
                text = (entry.get("title", "") + " " + entry.get("summary", "")).lower()
                if any(kw.lower() in text for kw in KEYWORDS):
                    items.append({
                        "title": entry.get("title", ""),
                        "summary": entry.get("summary", "")[:1000],
                        "url": entry.get("link", ""),
                        "published_at": entry.get("published", ""),
                        "source_type": "rss",
                    })
        except Exception as e:
            print(f"  [warn] RSS {url} failed: {e}")
    return items


def collect_tavily(queries: list[str], max_results: int = 5) -> list[dict]:
    from cache import cache_get, cache_set

    key = os.environ.get("TAVILY_API_KEY", "").strip()
    if not key:
        print("  [skip] TAVILY_API_KEY not set — RSS only")
        return []
    try:
        from tavily import TavilyClient
        client = TavilyClient(api_key=key)
        items = []
        hit, miss = 0, 0
        for q in queries:
            cached = cache_get(q)
            if cached is not None:
                items.extend(cached)
                hit += 1
                continue
            res = client.search(query=q, max_results=max_results, topic="news", days=7)
            results = [
                {
                    "title": r.get("title", ""),
                    "summary": r.get("content", "")[:1000],
                    "url": r.get("url", ""),
                    "published_at": r.get("published_date", ""),
                    "source_type": "tavily",
                }
                for r in res.get("results", [])
            ]
            cache_set(q, results)
            items.extend(results)
            miss += 1
        print(f"  Tavily: {miss} API call(s), {hit} cache hit(s)")
        return items
    except Exception as e:
        print(f"  [warn] Tavily failed: {e}")
        return []
