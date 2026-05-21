from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter()

MOCK_EVENTS = [
    {
        "event_id": "e1", "cat": "竞争", "priority": "high", "new": True,
        "title": "Maison Aurelia 收购意大利高级珠宝品牌 Damasco 多数股权",
        "summary": "Maison Aurelia 集团已签署协议收购意大利高级珠宝品牌 Damasco 的多数股权，进一步强化其在高端珠宝市场的布局。",
        "source": "行业报告", "src_detail": "Aurum Insight Quarterly", "time": "05/31 09:30",
        "impact": [
            {"kind": "competitive", "title": "竞争格局", "text": "Maison Aurelia 在高端珠宝领域的版图进一步扩大，提升议价与渠道整合能力。"},
            {"kind": "brand",       "title": "品牌策略", "text": "Damasco 有望获得全球渠道资源与品牌曝光支持，同业品牌定位面临升级压力。"},
            {"kind": "trend",       "title": "市场趋势", "text": "意大利工艺与设计价值被进一步强化，利好同类品牌的定位升级。"},
        ],
        "markets": ["欧洲", "北美", "中东", "亚太 (高端)"],
        "brands": ["Maison Aurelia", "Damasco", "Lune Atelier", "Cartelle"],
        "citation": "Aurum Insight Quarterly – Luxury Goods Market Outlook 2026",
        "citation_time": "2026/05/31 09:30",
    },
    {
        "event_id": "e2", "cat": "产品", "priority": "high", "new": False,
        "title": "实验室培育钻石价格持续下行，需求分化加剧",
        "summary": "5 月份培育钻石毛坯价格环比下降 6%–9%，进入消费淡季后，性价比产品需求走弱，高品质大克拉需求相对稳定。",
        "source": "行业报告", "src_detail": "Tenoris.BI", "time": "05/30 16:45",
        "impact": [
            {"kind": "competitive", "title": "竞争格局", "text": "天然钻石与培育钻石定价差距继续扩大，分层销售策略空间放大。"},
            {"kind": "brand",       "title": "品牌策略", "text": "高端品牌可以强化天然钻石稀缺叙事；轻奢线可以借力培育钻石性价比。"},
            {"kind": "trend",       "title": "市场趋势", "text": "消费者教育成本上升，可追溯性与认证成为关键卖点。"},
        ],
        "markets": ["北美", "欧洲", "亚太"],
        "brands": ["Pandora", "Maison Aurelia", "Lab Origin", "Brilliant Earth"],
        "citation": "Tenoris.BI – Diamond Price Monthly · May 2026",
        "citation_time": "2026/05/30 16:45",
    },
    {
        "event_id": "e3", "cat": "社媒", "priority": "mid", "new": False,
        "title": "TikTok 上「Old Money 珠宝风」热度上升",
        "summary": "#OldMoneyJewelry 话题播放量环比增长 38%，复古黄金与珍珠设计受 Z 世代青睐，欧美市场讨论度显著提升。",
        "source": "社媒", "src_detail": "TikTok Creative Center", "time": "05/30 11:20",
        "impact": [
            {"kind": "competitive", "title": "竞争格局", "text": "复古风系列受到 DTC 品牌追捧，相关 SKU 售罄率上升。"},
            {"kind": "brand",       "title": "品牌策略", "text": "适合推出复古金饰胶囊系列，借助社媒话题快速触达 Z 世代。"},
            {"kind": "trend",       "title": "市场趋势", "text": "「低调奢华」叙事正在与 Old Money 美学融合，长尾内容增长可期。"},
        ],
        "markets": ["北美", "欧洲", "东南亚"],
        "brands": ["Lune Atelier", "Aurum Maison", "Cartelle", "Heritage Co."],
        "citation": "TikTok Creative Center – Trend Pulse · May 2026",
        "citation_time": "2026/05/30 11:20",
    },
    {
        "event_id": "e4", "cat": "法规", "priority": "high", "new": False,
        "title": "欧盟通过新规限制黄金供应链尽职调查标准",
        "summary": "欧盟理事会通过新版尽职调查指令，要求贵金属与钻石供应链加强来源透明度，企业需在 2027 年前完成合规升级。",
        "source": "政府官网", "src_detail": "EUR-Lex", "time": "05/29 18:05",
        "impact": [
            {"kind": "competitive", "title": "竞争格局", "text": "中小型供应商合规成本上升，集中度有望进一步提高。"},
            {"kind": "brand",       "title": "品牌策略", "text": "需要前置披露供应链来源与可追溯证书，强化品牌信任。"},
            {"kind": "trend",       "title": "市场趋势", "text": "ESG 与供应链透明度成为高端市场准入门槛。"},
        ],
        "markets": ["欧洲", "全球"],
        "brands": ["全行业适用"],
        "citation": "EUR-Lex – Council Directive on Due Diligence (2026/337)",
        "citation_time": "2026/05/29 18:05",
    },
    {
        "event_id": "e5", "cat": "渠道", "priority": "mid", "new": False,
        "title": "亚马逊推出珠宝新品类流量扶持计划",
        "summary": "面向美国站珠宝类目的卖家推出广告补贴与新品流量激励，持续 90 天，最高可获 15% 广告花费返还。",
        "source": "新闻", "src_detail": "Amazon Newsroom", "time": "05/29 09:10",
        "impact": [
            {"kind": "competitive", "title": "竞争格局", "text": "电商珠宝新品上架窗口期机会显著，DTC 品牌活跃度提升。"},
            {"kind": "brand",       "title": "品牌策略", "text": "适合借助流量扶持窗口测试新品类与定价策略。"},
            {"kind": "trend",       "title": "市场趋势", "text": "电商平台与品牌侧投放联动趋势加强。"},
        ],
        "markets": ["北美"],
        "brands": ["Amazon", "DTC 品牌"],
        "citation": "Amazon Newsroom – Jewelry Seller Boost Program",
        "citation_time": "2026/05/29 09:10",
    },
    {
        "event_id": "e6", "cat": "竞争", "priority": "mid", "new": False,
        "title": "Cartelle 新加坡乌节路旗舰店翻新启动",
        "summary": "Cartelle 宣布对新加坡乌节路旗舰店进行为期 3 个月的翻新升级，期间将开设临时体验店。",
        "source": "新闻", "src_detail": "Straits Times Lifestyle", "time": "05/28 14:25",
        "impact": [
            {"kind": "competitive", "title": "竞争格局", "text": "乌节路核心商圈短期内将释放约 5% 高端客流分流机会。"},
            {"kind": "brand",       "title": "品牌策略", "text": "建议在翻新窗口期加强乌节路曝光与会员邀约。"},
            {"kind": "trend",       "title": "市场趋势", "text": "旗舰店体验升级成为奢侈品零售竞争重点。"},
        ],
        "markets": ["亚太", "新加坡"],
        "brands": ["Cartelle"],
        "citation": "Straits Times Lifestyle · May 28, 2026",
        "citation_time": "2026/05/28 14:25",
    },
    {
        "event_id": "e7", "cat": "产品", "priority": "mid", "new": False,
        "title": "彩色宝石（碧玺、坦桑石）询价量持续走高",
        "summary": "Q2 彩色宝石询价指数环比增长 22%，高端定制订单占比扩大，年轻消费者偏好色彩个性化。",
        "source": "行业报告", "src_detail": "Color Stone Insight", "time": "05/28 10:40",
        "impact": [
            {"kind": "competitive", "title": "竞争格局", "text": "彩色宝石供应商议价能力上升，库存周转率成关键。"},
            {"kind": "brand",       "title": "品牌策略", "text": "建议丰富彩色宝石 SKU，强化「色彩 × 个性」叙事。"},
            {"kind": "trend",       "title": "市场趋势", "text": "彩色宝石与古典金属工艺组合成为新热点。"},
        ],
        "markets": ["亚太", "北美"],
        "brands": ["Color Atelier", "Aurum Maison", "Lune Atelier"],
        "citation": "Color Stone Insight – Q2 Demand Pulse",
        "citation_time": "2026/05/28 10:40",
    },
]


@router.get("/events")
def list_events(
    category: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
):
    items = MOCK_EVENTS
    if category and category != "全部":
        items = [e for e in items if e["cat"] == category]
    total = len(items)
    start = (page - 1) * size
    return {"items": items[start: start + size], "total": total, "page": page, "size": size}


@router.get("/events/{event_id}")
def get_event(event_id: str):
    for e in MOCK_EVENTS:
        if e["event_id"] == event_id:
            return e
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Event not found")
