"""Domain taxonomy & tunable knowledge for the Agent pipeline.

Keyword maps and scoring weights live here so they can be tuned without
touching stage logic. Aligned with prd/prd.md and backend/architecture.md.
"""
from __future__ import annotations

from app.schemas.enums import CredibilityLevel, EventType, Priority, SourceType

# --- markets (MVP scope: architecture.md §1) -------------------------------
MVP_MARKETS: list[str] = ["Singapore", "Thailand", "Japan"]

MARKET_REGION: dict[str, str] = {
    "Singapore": "Southeast Asia",
    "Thailand": "Southeast Asia",
    "Japan": "East Asia",
    # TODO: extend when more markets enter scope (PRD §5.2)
}

# --- relevance filter (stage 2) --------------------------------------------
# A document must mention at least one of these to be jewellery-relevant.
JEWELLERY_KEYWORDS: list[str] = [
    "jewellery", "jewelry", "gold", "diamond", "jade", "luxury",
    "watch", "bridal", "wedding", "bullion", "gemstone", "precious metal",
    "珠宝", "黄金", "钻石", "翡翠", "婚庆", "首饰",
]

# --- rule pre-classification (stage 3): keyword -> candidate EventType ------
KEYWORD_EVENT_TYPE: dict[EventType, list[str]] = {
    EventType.channel: [
        "boutique", "flagship", "opens", "opening", "new store", "mall",
        "airport", "duty free", "duty-free", "pop-up", "popup", "retail",
    ],
    EventType.pricing: [
        "gold price", "bullion", "gold rally", "per ounce", "per oz",
        "price surge", "金价", "价格",
    ],
    EventType.platform: [
        "shopee", "lazada", "tiktok shop", "seller", "commission", "policy",
        "fee", "category", "marketplace", "e-commerce", "platform",
    ],
    EventType.regulation: [
        "customs", "regulation", "regulatory", "precious metal", "import",
        "compliance", "money laundering", "aml", "kyc", "tax", "duty",
        "declare", "监管", "合规", "法规",
    ],
    EventType.competition: [
        "cartier", "tiffany", "van cleef", "bvlgari", "bulgari", "pandora",
        "harry winston", "chow tai fook", "luk fook", "chow sang sang",
        "老铺", "六福", "周生生", "周大福", "acquire", "acquisition", "merger",
    ],
    EventType.product: [
        "collection", "launch", "new design", "lab-grown", "lab grown",
        "lightweight", "craftsmanship", "古法金", "工艺", "设计",
    ],
    EventType.social: [
        "tiktok", "instagram", "viral", "influencer", "kol", "social media",
        "种草", "小红书",
    ],
    EventType.festival: [
        "chinese new year", "lunar new year", "cny", "valentine", "festive",
        "gifting", "婚庆", "礼赠", "节庆",
    ],
}

# --- source credibility (stage 2), architecture.md §9 / PRD §9.4 ----------
# Per-source credibility, keyed by a case-insensitive substring of source_name.
SOURCE_CREDIBILITY: dict[str, CredibilityLevel] = {
    # S — 政府 / 监管 / 平台官方公告
    "customs": CredibilityLevel.S,
    "monetary authority": CredibilityLevel.S,
    "shopee help": CredibilityLevel.S,
    "tiktok shop": CredibilityLevel.S,
    "world gold council": CredibilityLevel.S,
    # A — 主流权威媒体 / 权威机构
    "straits times": CredibilityLevel.A,
    "business times": CredibilityLevel.A,
    "channel news asia": CredibilityLevel.A,
    "reuters": CredibilityLevel.A,
    "bloomberg": CredibilityLevel.A,
    "yahoo finance": CredibilityLevel.A,
    # B — 垂直 / 区域媒体、品牌官网、商场
    "vnexpress": CredibilityLevel.B,
    "vietnam+": CredibilityLevel.B,
    "malay mail": CredibilityLevel.B,
    "cna luxury": CredibilityLevel.B,
    "cna lifestyle": CredibilityLevel.B,
    "alvinology": CredibilityLevel.B,
    "sassy mama": CredibilityLevel.B,
    "vogue": CredibilityLevel.B,
    "tatler": CredibilityLevel.B,
    "tiffany": CredibilityLevel.B,
    "cartier": CredibilityLevel.B,
    "chow tai fook": CredibilityLevel.B,
}

# fallback by source_type when source_name is not matched above
DEFAULT_CREDIBILITY: dict[SourceType, CredibilityLevel] = {
    SourceType.regulation: CredibilityLevel.S,
    SourceType.platform: CredibilityLevel.S,
    SourceType.market_data: CredibilityLevel.A,
    SourceType.news: CredibilityLevel.A,
    SourceType.report: CredibilityLevel.A,
    SourceType.competitor: CredibilityLevel.B,
    SourceType.mall: CredibilityLevel.B,
    SourceType.social: CredibilityLevel.C,
}

# numeric rank (lower = more credible) — for comparison / dedup tie-break
CREDIBILITY_RANK: dict[CredibilityLevel, int] = {
    CredibilityLevel.S: 0,
    CredibilityLevel.A: 1,
    CredibilityLevel.B: 2,
    CredibilityLevel.C: 3,
}


def credibility_for(source_name: str | None, source_type: SourceType) -> CredibilityLevel:
    """Resolve credibility — by source name first, else by source_type."""
    name = (source_name or "").lower()
    for key, level in SOURCE_CREDIBILITY.items():
        if key in name:
            return level
    return DEFAULT_CREDIBILITY.get(source_type, CredibilityLevel.B)

# --- rule scoring (stage 4) ------------------------------------------------
# base (opportunity_bias, risk_bias) per event type, 0-100 before adjustment.
EVENT_TYPE_BASE_SCORE: dict[EventType, tuple[int, int]] = {
    EventType.channel: (60, 30),
    EventType.product: (58, 32),
    EventType.festival: (62, 25),
    EventType.social: (52, 35),
    EventType.competition: (45, 55),
    EventType.pricing: (40, 60),
    EventType.platform: (42, 52),
    EventType.regulation: (35, 65),
}

# A weak source yields a weaker score — we are less sure the signal is real.
CREDIBILITY_MULTIPLIER: dict[CredibilityLevel, float] = {
    CredibilityLevel.S: 1.0,
    CredibilityLevel.A: 0.92,
    CredibilityLevel.B: 0.78,
    CredibilityLevel.C: 0.60,
}

PRIORITY_ADJUSTMENT: dict[Priority, int] = {
    Priority.P0: 15,
    Priority.P1: 5,
    Priority.P2: -10,
}

def region_for(market: str) -> str:
    """Best-effort region lookup for a market."""
    return MARKET_REGION.get(market, "Unknown")
