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

# --- credibility fallback (stage 2) ----------------------------------------
# TODO: real credibility should come from per-source config
#       (data_probe/config/sources.yaml). This is a coarse fallback by type.
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

# --- department action templates (stage 7), PRD §9.7 ----------------------
DEPARTMENTS: list[str] = [
    "管理层", "商品团队", "市场营销团队", "渠道团队",
    "电商运营团队", "法务合规团队", "数据情报团队",
]

# event_type -> departments most likely to own follow-up (PRD §9.7)
EVENT_TYPE_DEPARTMENTS: dict[EventType, list[str]] = {
    EventType.competition: ["管理层", "商品团队", "渠道团队"],
    EventType.product: ["商品团队", "市场营销团队"],
    EventType.platform: ["电商运营团队", "法务合规团队"],
    EventType.social: ["市场营销团队"],
    EventType.regulation: ["法务合规团队", "管理层"],
    EventType.pricing: ["商品团队", "管理层"],
    EventType.channel: ["渠道团队", "市场营销团队"],
    EventType.festival: ["市场营销团队", "商品团队"],
}


def region_for(market: str) -> str:
    """Best-effort region lookup for a market."""
    return MARKET_REGION.get(market, "Unknown")
