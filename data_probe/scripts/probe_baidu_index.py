"""Optional Baidu Index probe.

Baidu Index is useful for China-side search heat, but the public product is a
JavaScript app that requires login/session state for keyword index data. This
probe records that access boundary as a structured failed placeholder instead
of treating the shell HTML as real trend data.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from utils import (  # noqa: E402
    fetch_html,
    make_intelligence_record,
    save_jsonl,
    save_raw_snapshot,
)

SOURCE_ID = "baidu_index"
SOURCE_NAME = "Baidu Index / 百度指数"
INDEX_URL = "https://index.baidu.com/v2/index.html#/"
HELP_URL = "https://index.baidu.com/Helper/?tpl=help"


def probe_baidu_index() -> list[dict]:
    html, err = fetch_html(INDEX_URL)
    summary_parts = []

    if err:
        summary_parts.append(f"index page fetch failed: {err}")
    else:
        raw_path = save_raw_snapshot(SOURCE_ID, "html", html or "")
        summary_parts.append(f"index shell fetched; raw snapshot saved to {raw_path}")

    help_html, help_err = fetch_html(HELP_URL)
    if help_err:
        summary_parts.append(f"help page fetch failed: {help_err}")
    elif help_html:
        summary_parts.append("help page reachable, but keyword index data still requires the JS app/session flow")

    summary_parts.append(
        "No normalized Baidu Index time series was extracted. Production needs official access, "
        "a compliant authenticated browser workflow, or a licensed data provider."
    )

    record = make_intelligence_record(
        source_id=SOURCE_ID,
        source_name=SOURCE_NAME,
        source_type="trend",
        market="CN",
        language="zh",
        title="[failed] Baidu Index requires JS/login for keyword trend data",
        url=INDEX_URL,
        summary="; ".join(summary_parts),
        keywords=["百度指数", "黄金首饰", "钻石首饰", "培育钻石", "周大福"],
        products=["gold jewelry", "diamond jewelry", "lab grown diamond"],
        brands=["周大福"],
        signal_type="product_trend",
        impact_direction="watch",
        evidence_level="third_party_report",
        confidence=0.0,
    )

    info = save_jsonl(SOURCE_ID, [record])
    print(f"  source_name        : {SOURCE_NAME}")
    print("  normalized_count   : 1 failed placeholder")
    print(f"  saved_path         : {info['normalized_path']}")
    return [record]


if __name__ == "__main__":
    print("=== probe_baidu_index ===")
    results = probe_baidu_index()
    print(f"Done: {len(results)} records")
