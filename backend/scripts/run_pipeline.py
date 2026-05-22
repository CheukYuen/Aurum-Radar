"""Manually run the Agent pipeline (architecture.md §9 scripts/).

Usage (from the backend/ directory):
    python -m scripts.run_pipeline

Runs the pipeline on a small built-in sample of real Singapore documents so
the database tables get populated end-to-end. Once the live providers in
app/services/ingestion are ported, this sample can be replaced with
ingestion.load_seed_documents(<data_probe export>).
"""
from __future__ import annotations

from datetime import datetime, timezone

from app.schemas import RawDocumentIn, SourceType
from app.services.pipeline import run_pipeline

_NOW = datetime.now(timezone.utc)


def _doc(source_type, source_name, title, url, published, summary, body=None):
    return RawDocumentIn(
        source_type=source_type,
        source_name=source_name,
        market="Singapore",
        title=title,
        url=url,
        published_at=datetime.fromisoformat(published),
        fetched_at=_NOW,
        summary=summary,
        raw_content=body,
    )


# Real Singapore jewellery-market documents (data_probe snapshot, 2026-05-21).
SAMPLE_DOCUMENTS = [
    _doc(
        SourceType.news, "The Straits Times",
        "Singapore gold sellers bring in more stock, build vaults amid Mid-East crisis",
        "https://news.google.com/rss/articles/CBMi6AFBVV95cUxOcHI0NnB",
        "2026-05-17",
        "Singapore gold retailers are boosting inventories and building vault "
        "capacity as Middle-East uncertainty drives record demand for bullion.",
    ),
    _doc(
        SourceType.news, "The Straits Times",
        "Demand for gold bars, coins in Singapore hits record high in Q1 2026",
        "https://news.google.com/rss/articles/CBMiwAFBVV95cUxOcE9Mcmd",
        "2026-04-29",
        "Q1 2026 gold bar and coin demand in Singapore hit a record as buyers "
        "shift from gold jewellery and ETFs into physical bullion.",
    ),
    _doc(
        SourceType.news, "The Business Times",
        "Singapore jeweller Ishtara eyes overseas expansion amid gold price rally",
        "https://news.google.com/rss/articles/CBMi3AFBVV95cUxNaU9md2F",
        "2026-05-13",
        "Local jeweller Ishtara plans overseas expansion and a stronger online "
        "presence in gold jewellery, using the high gold price as momentum.",
    ),
    _doc(
        SourceType.news, "The Straits Times",
        "Jewellery giant Chow Tai Fook steps up global expansion with high-end Singapore store",
        "https://news.google.com/rss/articles/CBMi3AFBVV95cUxNaU9md2Fx",
        "2025-09-24",
        "Chow Tai Fook opened a high-end store in Singapore as part of a "
        "stepped-up global expansion of its luxury jewellery footprint.",
    ),
    _doc(
        SourceType.mall, "CNA Luxury",
        "Van Cleef & Arpels opens new duplex boutique at ION Orchard",
        "https://news.google.com/rss/articles/CBMiogFBVV95cUxNQ0toOFVzdUgt",
        "2025-11-21",
        "Van Cleef & Arpels opened its first South-east Asian duplex boutique "
        "at ION Orchard, expanding luxury jewellery retail on Orchard Road.",
    ),
    _doc(
        SourceType.mall, "The Straits Times",
        "Long queues at ION Orchard and MBS ahead of AP x Swatch Royal Pop launch",
        "https://news.google.com/rss/articles/CBMiwwFBVV95cUxOc0R4RlgtMTBK",
        "2026-05-15",
        "Long queues formed at ION Orchard and Marina Bay Sands ahead of the "
        "Audemars Piguet x Swatch luxury watch pop-up launch.",
    ),
    _doc(
        SourceType.competitor, "Tiffany & Co.",
        "Tiffany Blue Book 2026: Hidden Garden high jewellery collection",
        "https://www.tiffany.com/high-jewelry/blue-book/2026-hidden-garden.html",
        "2026-01-15",
        "Tiffany & Co. unveiled its 2026 Blue Book high jewellery collection, "
        "themed Hidden Garden — its flagship annual luxury launch.",
    ),
    _doc(
        SourceType.competitor, "Chow Tai Fook",
        "Chow Tai Fook launches 618 MOMENT jewellery promotion",
        "https://www.chowtaifook.com/en-hk/eshop/event/promotion/preserve-the-glorious-moment",
        "2026-05-10",
        "Chow Tai Fook launched its 618 MOMENT promotional campaign across its "
        "gold and diamond jewellery collections.",
    ),
    _doc(
        SourceType.regulation, "Singapore Customs",
        "Singapore Customs media release on undeclared dutiable goods enforcement",
        "https://www.customs.gov.sg/",
        "2026-05-20",
        "Singapore Customs reported enforcement action against undeclared "
        "dutiable goods, underscoring import declaration requirements.",
        "Singapore Customs requires accurate declaration of dutiable and "
        "controlled goods on import. High-value goods including precious "
        "metals and jewellery are subject to declaration and GST requirements.",
    ),
    _doc(
        SourceType.platform, "Shopee Help Centre",
        "Shopee Prohibited and Restricted Items Policy — precious metals require registration",
        "https://help.shopee.sg/portal/4/article/77151-Prohibited%20and%20Restricted%20Items%20Policy",
        "2026-02-02",
        "Shopee's policy requires sellers of precious metals, stones and "
        "related jewellery products to hold the relevant legal registrations.",
        "Sellers are responsible for ensuring listings comply with applicable "
        "law. The sale of precious and regulated metals and stones, including "
        "related jewellery products, requires relevant registrations. Raw jade "
        "stone scams and mystery-box lottery-style sales are prohibited.",
    ),
]


def main() -> None:
    print(f"Running Agent pipeline on {len(SAMPLE_DOCUMENTS)} sample documents...\n")
    result = run_pipeline(
        markets=["Singapore"],
        seed_documents=SAMPLE_DOCUMENTS,
        trigger_type="manual",
        persist=True,
    )
    print(f"Pipeline finished — {result.job_name}")
    for s in result.stages:
        line = f"  {s.stage.value:9} {s.status.value:8} rows={s.rows_affected}"
        if s.error_message:
            line += f"  ERROR: {s.error_message}"
        print(line)


if __name__ == "__main__":
    main()
