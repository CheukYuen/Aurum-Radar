"""Run the full Agent flow + strategy sandbox on the data_probe 2026-05-22
full-text snapshot, persist to the DB, and print what was inferred.

Usage (from backend/):  python -m scripts.run_strategy

Flow: ingest(seed) → clean → extract → score → forecast → brief  (main
pipeline, stages 1-6, persisted) → strategy sandbox for Singapore
(§17, 6 steps) → action_items persisted. Strategy intermediate results are
printed but NOT persisted (architecture.md §17.7).
"""
from __future__ import annotations

import json
from datetime import datetime, timezone

from app.database.session import SessionLocal
from app.schemas import RawDocumentIn, SourceType
from app.services.pipeline import run_pipeline
from app.services.strategy import run_sandbox

_NOW = datetime.now(timezone.utc)


def _doc(source_type, source_name, title, url, published, body):
    return RawDocumentIn(
        source_type=source_type,
        source_name=source_name,
        market="Singapore",
        title=title,
        url=url,
        published_at=datetime.fromisoformat(published),
        fetched_at=_NOW,
        summary=body[:200],
        raw_content=body,
    )


# 13 full-text Singapore articles — data_probe/output/DATA_SNAPSHOT_20260522_FULLTEXT.md
SEED = [
    _doc(SourceType.news, "Channel News Asia",
         "金价推动新加坡消费者从金饰转向金条",
         "https://www.channelnewsasia.com/singapore/gold-prices-singapore-consumers-bars-coins-jewellery-5800526",
         "2025-01-05",
         "新加坡黄金零售商正翻新设计、扩大以旧换新，以挽回客户——金价飙升使 2025 成为珠宝销售最弱的年份之一。"
         "三季度金饰销量同比下降 8%，而金条金币购买量同比大涨 47%，消费者把黄金视为价值储存手段。"
         "投资级金条豁免消费税(GST)，进一步推动消费者选金条而非金饰。零售商引入 3 克以下、空心设计的轻量化产品应对。"
         "退休及年长买家部分被高价挤出，更多人卖出旧饰品套现。分析师预计金价将维持高位。"),
    _doc(SourceType.news, "The Straits Times",
         "新加坡金条金币需求 2026 年一季度创历史新高",
         "https://www.straitstimes.com/business/companies-markets/demand-for-gold-bars-coins-in-singapore-hits-record-high-in-q1-2026",
         "2026-04-29",
         "2026 年一季度新加坡金条金币需求同比增长 42% 至 3.5 吨，创历史新高；同期金饰需求同比下降 13% 至 1.5 吨。"
         "2025 全年金条金币需求增长 48% 至 9.6 吨，金饰需求下降 13% 至 6 吨(世界黄金协会数据)。"
         "金价 2026 年 1 月一度冲上每盎司 5,589 美元历史高点。地缘政治风险溢价预计将持续支撑金价。"),
    _doc(SourceType.news, "VnExpress International",
         "新加坡珠宝商应对金价高企：轻量化、低克拉、以旧换新",
         "https://e.vnexpress.net/news/business/economy/singapore-gold-jewelers-pivot-5002292.html",
         "2026-03-15",
         "Kim Poh Hong 金行报告 22K 金饰需求骤降 30-40%，已暂停向批发商下单。"
         "G&J Goldsmiths 推出 3 克以下及空心设计提升可负担性。Eli J Fine Jewelry 称 20-30% 客户现偏好 14K 金(此前约 10%)。"
         "部分设计师改用铂金替代白金以应对价差。珠宝商普遍通过调整设计在销量下滑下维持销售额。"),
    _doc(SourceType.news, "Malay Mail via Yahoo News",
         "Bullion Beats Bling：新加坡买家以旧饰换金条",
         "https://malaysia.news.yahoo.com/bullion-beats-bling-gold-buyers-075543105.html",
         "2026-01-06",
         "金条金币购买量同比激增 47%，金饰销量同比下降 8%。零售商以更轻、空心的设计应对。"
         "包括退休人员在内的客户主动以旧饰品套现。新加坡珠宝商协会会长指投资级金条的 GST 豁免是推动金条优于饰品的关键。"),
    _doc(SourceType.news, "Malay Mail via Yahoo News",
         "Gold Rush 2026：珠宝商、典当行、年轻投资者全面入场",
         "https://malaysia.news.yahoo.com/gold-rush-hits-singapore-jewellers-011334679.html",
         "2026-03-18",
         "金价 1 月 28 日触及每盎司 5,589 美元纪录后回落，3 月初因美以伊军事紧张反弹至 5,300 美元上方。"
         "Indigo Precious Metals 2026 年需求翻倍以上，Silver Bullion 年销售增长约 350%。"
         "年轻消费者出于长期财富保值大量进入黄金投资市场。多家机构扩充库存与仓储。"),
    _doc(SourceType.report, "Yahoo Finance Singapore",
         "2026 年一季度全球金条需求深度数据",
         "https://sg.finance.yahoo.com/news/roaring-demand-gold-bullion-1q2026-220000162.html",
         "2026-04-29",
         "一季度全球金条需求达 473.6 吨，同比增 140 吨。中国大陆 206.9 吨，新加坡 3.5 吨(同比 +1 吨，历史新高)。"
         "黄金 ETF 需求下跌，黄金首饰需求下跌 137 吨至 299.7 吨。世界黄金协会指消费者正将首饰消费转向实物金条，尤其在中国和印度。"),
    _doc(SourceType.news, "Vietnam+",
         "新加坡金零售商大幅补库存应对需求激增",
         "https://en.vietnamplus.vn/singapores-gold-retailers-boost-inventories-post339491.vnp",
         "2026-03-18",
         "新加坡贵金属零售商大幅扩充库存以应对避险需求与降息预期带动的购金热。"
         "20-30 岁年轻投资者与传统中年买家一同入场，把黄金视为长期投资。"
         "瑞士、英国、香港的精炼产能与物流瓶颈推高溢价，新加坡零售商建立 100 克金条与 1 盎司金币的缓冲库存。"),
    _doc(SourceType.news, "Vietnam+",
         "新加坡力争成为全球黄金交易枢纽",
         "https://en.vietnamplus.vn/singapore-aims-to-become-global-gold-trading-hub-post340079.vnp",
         "2026-03-27",
         "新加坡力争成为亚洲首要黄金交易中心，与迪拜、上海、香港竞争。"
         "MAS 与新加坡金银市场协会公布计划：开发黄金资本市场产品提升价格发现与流动性、建立 OTC 大宗黄金清算结算系统、"
         "MAS 直接向外国央行提供金库服务，并批准三家金库运营商。"),
    _doc(SourceType.news, "Vietnam+",
         "新加坡考虑扩建黄金储存设施支撑枢纽目标",
         "https://en.vietnamplus.vn/singapore-considers-expanding-gold-storage-capacity-post340287.vnp",
         "2026-04-02",
         "MAS 正评估多个新建仓储选址，并考虑改造现有设施，拟选址樟宜机场附近以贴近运输枢纽。"
         "香港目前主导区域市场、是黄金流入中国的主要门户。全球央行持有约 39,000 吨黄金。"),
    _doc(SourceType.competitor, "Alvinology",
         "本地品牌 RISIS 50 周年：Jubilee 系列与文化兰花晚会",
         "https://alvinology.com/2026/04/11/risis-celebrates-50-years-jubilee/",
         "2026-04-11",
         "新加坡本土珠宝品牌 RISIS(1976 年创立)迎来 50 周年，推出五章节 Jubilee Capsule 系列，"
         "题材含 24K 瑞士金封存兰花、峇峇娘惹镂空丝网工艺，并首次进军制表。"
         "与本地甜品师 Janice Wong 联名推出兰花胸针(定价 $368-398)。举办定位「兰花界 Met Gala」的文化兰花晚会为公益筹款。"),
    _doc(SourceType.competitor, "VnExpress International",
         "新加坡奢侈品牌 Aupen 携手 LVMH 推出首个珠宝线",
         "https://e.vnexpress.net/news/business/companies/aupen-jewelry-lvmh-4957674.html",
         "2025-10-29",
         "新加坡奢侈箱包品牌 Aupen(2022 年创立)与 LVMH Métiers d'Art 合作推出首个高级珠宝系列，含黄金与钻石单品。"
         "品牌曾获 Taylor Swift、Selena Gomez 等名人加持。LVMH 合作为年轻奢侈品牌提供工坊背书，并将生产基地从新加坡迁往法国。"),
    _doc(SourceType.competitor, "Sassy Mama Singapore",
         "新加坡 19 个平价及独立珠宝品牌指南",
         "https://www.sassymamasg.com/where-to-buy-fashion-jewellery-in-singapore/",
         "2026-05-01",
         "新加坡涌现大量本土独立珠宝品牌：By Invite Only(回收纯金、防过敏、多门店)、Curious Creatures(永久珠宝、定制)、"
         "EDEN+ELIE(社会责任、传统珠串)、PYAR(可持续采购)。国际连锁 Pandora、Swarovski、Monica Vinader、Lovisa 在新设店。"
         "本土设计、可持续、个性化定制成为年轻消费者关注重点。"),
    _doc(SourceType.mall, "VnExpress International",
         "AP × Swatch Royal Pop 新加坡发售引发排队热潮",
         "https://e.vnexpress.net/news/business/companies/ap-swatch-royal-pop-singapore-5075203.html",
         "2026-05-18",
         "Audemars Piguet × Swatch 联名 Royal Pop 怀表在新加坡 ION Orchard、滨海湾金沙、VivoCity 发售，零售价约 S$535-570。"
         "ION 早上 8 时排队 150-200 人、一小时售罄；VivoCity 因人潮提前关店。当天 Carousell 出现 80+ 转售帖，最高叫价为零售价 18 倍。"
         "全球多地发售引发骚乱，被业界称为「十年来最成功的 PR 事件」。"),
]


def _print_strategy(r: dict) -> None:
    print("\n" + "=" * 72)
    print(f"战略沙盘推演结果 —— {r['market']}（基于 {r['event_count']} 条情报）")
    print("=" * 72)
    print(f"\n【局势判断】\n{r.get('situation_summary', '')}")

    print("\n【战略变量】")
    for name, v in r.get("strategic_variables", {}).items():
        print(f"  {name:24} {str(v.get('value','?')):8} (conf {v.get('confidence','?')})")

    print("\n【Top 匹配策略】")
    for m in r.get("matched_strategies", []):
        print(f"  [{m['match_score']:+d}] {m['strategy_name']}（{m['classical_source']}）"
              f" — {m.get('why_applicable', m['business_meaning'])[:70]}")

    print("\n【候选方案排序】")
    for p in r.get("ranked_plans", []):
        print(f"  #{p['rank']} {p['plan_name']}  综合分 {p['weighted_score']}")

    three = r.get("three_strategies", {})
    for key, label in [("best_strategy", "上策"), ("middle_strategy", "中策"), ("low_strategy", "下策")]:
        s = three.get(key, {})
        if not s:
            continue
        print(f"\n【{label}】{s.get('plan_name','')}")
        print(f"  核心逻辑：{s.get('core_logic','')}")
        print(f"  匹配计策：{'、'.join(s.get('matched_strategies', []))}")
        print(f"  为何此策：{s.get('why_this_tier','')}")
        paths = s.get("action_paths", [])
        if paths:
            print("  行动路径：")
            for a in paths:
                print(f"    [{a.get('phase','')}|{a.get('department','')}] {a.get('action','')}")
    print(f"\n【谋士结论】\n{three.get('agent_conclusion','')}")
    print(f"\n落库行动项：{r.get('derived_action_count', 0)} 条")
    print("=" * 72)


def main() -> None:
    print(f"== 主流水线：{len(SEED)} 篇真实文章 → 抽取 / 评分 / 研判 / 简报 ==")
    result = run_pipeline(
        markets=["Singapore"],
        seed_documents=SEED,
        stages=["ingest", "clean", "extract", "score", "forecast", "brief"],
        trigger_type="manual",
        persist=True,
    )
    for s in result.stages:
        print(f"  {s.stage.value:9} {s.status.value:8} rows={s.rows_affected}"
              + (f"  ERROR: {s.error_message}" if s.error_message else ""))

    print("\n== 战略沙盘推演（§17，Singapore）==")
    db = SessionLocal()
    try:
        strategy = run_sandbox(db, "Singapore")
    finally:
        db.close()
    _print_strategy(strategy)

    # also dump the full reasoning chain as JSON for inspection
    with open("strategy_singapore_output.json", "w", encoding="utf-8") as f:
        json.dump(strategy, f, ensure_ascii=False, indent=2)
    print("完整推理链已写入 backend/strategy_singapore_output.json")


if __name__ == "__main__":
    main()
