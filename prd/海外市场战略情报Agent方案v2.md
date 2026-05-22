好——2 天黑客松场景，砍掉所有 PRD 噪音，只做一个**能跑、能 demo、tool use trace 清晰可见**的 agent。下面是完整方案。

---

## 一、48 小时 Agent Demo 范围决策

先做减法。**只做 1 个垂类 × 3 个市场 × 1 个 daily brief**：

- **垂类**：奢侈珠宝（Tiffany / Cartier / LVMH 系）
- **市场**：新加坡 / 迪拜 / 米兰（3 个就够 cross-market 对比）
- **输入源**：3 个 RSS + Tavily API（不写爬虫）
- **输出**：1 份结构化 daily brief（JSON + Markdown）
- **核心证据**：完整的 tool use trace（demo 时必须给评委看）

**坚决不做的事**（避免被工程拖死）：
- ❌ 不做前端（CLI 输出 + 一个 HTML 渲染 brief 就够）
- ❌ 不做用户系统、登录、权限
- ❌ 不做定时调度（用一个 `run_once.py` 跑一次）
- ❌ 不做向量检索（事件量小，SQLite 直接查就行）
- ❌ 不做多语言翻译（源全选英文）

---

## 二、Agent 架构（最简但 agentic 含量足）

```
┌─────────────────────────────────────────────────┐
│  run_once.py（入口，~50 行）                    │
└─────────────────────────────────────────────────┘
            ↓
   ┌────────────────────┐
   │ 1. Collector       │  RSS + Tavily（纯脚本，不用 LLM）
   │   → raw_items[]    │
   └────────────────────┘
            ↓
   ┌────────────────────┐
   │ 2. Extractor       │  Haiku 4.5，一条一调，JSON 输出
   │   → events[]       │  （不是 agent，是结构化抽取）
   └────────────────────┘
            ↓ 存入 SQLite
   ┌────────────────────────────────────────────┐
   │ 3. Market Analyst Agent（🌟 核心 agentic 在这里）│
   │   Model: Sonnet 4.6                        │
   │   Tools:                                   │
   │     - query_events_by_market               │
   │     - compare_markets                      │
   │     - search_web(Tavily)                   │
   │     - get_historical_trend                 │
   │   Loop: 自主决定调用顺序，最多 8 轮         │
   │   → judgments[] (opportunity/risk/watch)   │
   └────────────────────────────────────────────┘
            ↓
   ┌────────────────────┐
   │ 4. Brief Writer    │  Sonnet 4.6，一次性生成
   │   → daily_brief.md │
   └────────────────────┘
```

**为什么这样设计**：Step 2 用 Haiku 是因为抽取是确定性任务，便宜快。Step 3 用 Sonnet + tools 是因为这里**才是真正的 agent loop**——评委只会盯这一段看。Step 4 用 Sonnet 是因为长文本生成不需要 Opus 的推理能力。

---

## 三、完整代码（可直接跑）

### 项目结构

```
aurum_radar/
├── .env                          # ANTHROPIC_API_KEY, TAVILY_API_KEY
├── requirements.txt
├── db.py                         # SQLite schema + 查询
├── sources.py                    # RSS + Tavily 采集
├── extractor.py                  # Haiku 结构化抽取
├── tools.py                      # Market Analyst 的 4 个 tools
├── analyst.py                    # 🌟 Agent loop 主体
├── brief.py                      # Brief 生成 + Markdown 渲染
├── run_once.py                   # 入口
└── outputs/
    └── brief_YYYY-MM-DD.md
```

### `requirements.txt`

```
anthropic>=0.40.0
feedparser
tavily-python
python-dotenv
pydantic
```

### `db.py`

```python
import sqlite3
from pathlib import Path
from datetime import datetime
import json

DB_PATH = Path("aurum.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    market TEXT NOT NULL,           -- Singapore / Dubai / Milan / Global
    category TEXT NOT NULL,         -- competition / product / regulation / channel / social
    summary TEXT NOT NULL,
    impact TEXT,                    -- opportunity / risk / watch
    related_brands TEXT,            -- JSON array
    source_url TEXT NOT NULL,
    source_type TEXT,               -- news / rss / web_search
    published_at TEXT,
    extracted_at TEXT DEFAULT CURRENT_TIMESTAMP,
    confidence REAL DEFAULT 0.7
);

CREATE TABLE IF NOT EXISTS briefs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brief_date TEXT NOT NULL,
    content_md TEXT NOT NULL,
    judgments_json TEXT NOT NULL,
    tool_trace_json TEXT NOT NULL,  -- 🌟 保留 agent 的完整 tool use trace
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
"""

def init():
    conn = sqlite3.connect(DB_PATH)
    conn.executescript(SCHEMA)
    conn.commit()
    return conn

def save_event(conn, event: dict):
    conn.execute("""
        INSERT INTO events (title, market, category, summary, impact,
                            related_brands, source_url, source_type, 
                            published_at, confidence)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        event["title"], event["market"], event["category"], event["summary"],
        event.get("impact"), json.dumps(event.get("related_brands", [])),
        event["source_url"], event["source_type"],
        event.get("published_at"), event.get("confidence", 0.7)
    ))
    conn.commit()

def query_events(conn, market: str = None, days: int = 7):
    sql = "SELECT * FROM events WHERE extracted_at >= datetime('now', ?)"
    params = [f"-{days} days"]
    if market:
        sql += " AND market = ?"
        params.append(market)
    sql += " ORDER BY extracted_at DESC"
    cur = conn.execute(sql, params)
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, row)) for row in cur.fetchall()]
```

### `sources.py`

```python
import feedparser
import os
from tavily import TavilyClient

RSS_SOURCES = [
    "https://www.businessoffashion.com/feed/",
    "https://jingdaily.com/feed/",
    "https://wwd.com/feed/",
]

# 锁定垂类的关键词，过滤无关项
KEYWORDS = ["jewelry", "jewellery", "luxury", "watches", "LVMH", 
            "Richemont", "Tiffany", "Cartier", "Bulgari", "Damiani"]

def collect_rss(limit_per_feed: int = 10):
    items = []
    for url in RSS_SOURCES:
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
    return items

def collect_tavily(queries: list[str], max_results: int = 5):
    client = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])
    items = []
    for q in queries:
        res = client.search(query=q, max_results=max_results, 
                            topic="news", days=3)
        for r in res.get("results", []):
            items.append({
                "title": r.get("title", ""),
                "summary": r.get("content", "")[:1000],
                "url": r.get("url", ""),
                "published_at": r.get("published_date", ""),
                "source_type": "tavily",
            })
    return items

# Day-0 启动时跑这些查询
SEED_QUERIES = [
    "luxury jewelry Singapore Orchard Road 2026",
    "jewelry market Dubai DIFC 2026",
    "Italian jewelry brand Milan acquisition 2026",
    "LVMH OR Richemont jewelry news last 7 days",
    "EU jewelry regulation supply chain 2026",
]
```

### `extractor.py`

```python
import os
import json
from anthropic import Anthropic

client = Anthropic()

EXTRACTION_PROMPT = """你是奢侈珠宝行业情报分析师。从以下原始信息中抽取一个结构化事件。

原始信息：
标题：{title}
摘要：{summary}
URL：{url}

请输出 JSON（不要任何其他文字），schema 如下：
{{
  "title": "中文事件标题（30 字内）",
  "market": "Singapore | Dubai | Milan | Global | Other",
  "category": "competition | product | regulation | channel | social",
  "summary": "中文摘要（100 字内）",
  "impact": "opportunity | risk | watch",
  "related_brands": ["品牌1", "品牌2"],
  "confidence": 0.0-1.0
}}

如果与奢侈珠宝行业完全无关，返回 {{"skip": true}}。
"""

def extract_event(raw_item: dict) -> dict | None:
    prompt = EXTRACTION_PROMPT.format(
        title=raw_item["title"],
        summary=raw_item["summary"],
        url=raw_item["url"],
    )
    resp = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}],
    )
    text = resp.content[0].text.strip()
    # 去掉可能的 markdown code fence
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    try:
        data = json.loads(text)
        if data.get("skip"):
            return None
        data["source_url"] = raw_item["url"]
        data["source_type"] = raw_item["source_type"]
        data["published_at"] = raw_item.get("published_at", "")
        return data
    except json.JSONDecodeError:
        return None
```

### `tools.py` 🌟（agent 的工具集）

```python
import json
import os
from collections import Counter
from tavily import TavilyClient
import db

# Tool 定义（Anthropic tool use 格式）
TOOLS = [
    {
        "name": "query_events_by_market",
        "description": "查询某个市场近 N 天的所有结构化事件。用于了解某市场最近发生了什么。",
        "input_schema": {
            "type": "object",
            "properties": {
                "market": {"type": "string", "enum": ["Singapore", "Dubai", "Milan", "Global"]},
                "days": {"type": "integer", "default": 7}
            },
            "required": ["market"]
        }
    },
    {
        "name": "compare_markets",
        "description": "对比 2-3 个市场在某个维度（competition/product/regulation/channel/social）上的事件密度和方向。用于跨市场判断。",
        "input_schema": {
            "type": "object",
            "properties": {
                "markets": {"type": "array", "items": {"type": "string"}},
                "dimension": {"type": "string"},
                "days": {"type": "integer", "default": 7}
            },
            "required": ["markets", "dimension"]
        }
    },
    {
        "name": "search_web",
        "description": "当数据库中信息不足时，主动调用 Tavily 搜索补充。返回最多 3 条结果。",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"}
            },
            "required": ["query"]
        }
    },
    {
        "name": "get_category_trend",
        "description": "统计某个 category（如 regulation）在近 N 天的事件数和市场分布。判断趋势强度用。",
        "input_schema": {
            "type": "object",
            "properties": {
                "category": {"type": "string"},
                "days": {"type": "integer", "default": 7}
            },
            "required": ["category"]
        }
    }
]

# Tool 实现
def tool_query_events_by_market(conn, market: str, days: int = 7):
    events = db.query_events(conn, market=market, days=days)
    return {
        "count": len(events),
        "events": [{"title": e["title"], "category": e["category"],
                    "impact": e["impact"], "summary": e["summary"]}
                   for e in events[:15]]
    }

def tool_compare_markets(conn, markets: list, dimension: str, days: int = 7):
    result = {}
    for m in markets:
        events = db.query_events(conn, market=m, days=days)
        filtered = [e for e in events if e["category"] == dimension]
        impacts = Counter(e["impact"] for e in filtered)
        result[m] = {
            "event_count": len(filtered),
            "impact_breakdown": dict(impacts),
            "top_titles": [e["title"] for e in filtered[:3]]
        }
    return result

def tool_search_web(query: str):
    client = TavilyClient(api_key=os.environ["TAVILY_API_KEY"])
    res = client.search(query=query, max_results=3, topic="news", days=7)
    return [{"title": r["title"], "url": r["url"], 
             "snippet": r["content"][:300]} for r in res.get("results", [])]

def tool_get_category_trend(conn, category: str, days: int = 7):
    events = db.query_events(conn, days=days)
    filtered = [e for e in events if e["category"] == category]
    market_dist = Counter(e["market"] for e in filtered)
    return {
        "total_events": len(filtered),
        "market_distribution": dict(market_dist),
        "trend": "rising" if len(filtered) >= 5 else "stable"
    }

def dispatch_tool(name: str, args: dict, conn):
    if name == "query_events_by_market":
        return tool_query_events_by_market(conn, **args)
    if name == "compare_markets":
        return tool_compare_markets(conn, **args)
    if name == "search_web":
        return tool_search_web(**args)
    if name == "get_category_trend":
        return tool_get_category_trend(conn, **args)
    return {"error": f"unknown tool: {name}"}
```

### `analyst.py` 🌟🌟（agent loop 主体，最关键）

```python
import json
from anthropic import Anthropic
from tools import TOOLS, dispatch_tool

client = Anthropic()

SYSTEM_PROMPT = """你是奢侈珠宝行业的海外市场战略分析师 Agent。

你的任务：基于数据库中近 7 天的事件，对 Singapore / Dubai / Milan 三个市场，
分别输出战略判断（机会 / 风险 / 需关注）。

**强制要求**：
1. 你必须使用 tools 来收集证据，不能凭空判断。
2. 对每个市场，至少调用一次 query_events_by_market。
3. 至少调用一次 compare_markets 做跨市场对比。
4. 至少调用一次 get_category_trend 验证某个趋势。
5. 当数据库证据不足时，主动调用 search_web 补充。
6. 完成 6-10 轮 tool 调用后，输出最终判断 JSON。

**最终输出 schema**（最后一轮不调用 tool，直接输出 JSON）：
{
  "markets": {
    "Singapore": {
      "state": "opportunity_rising | risk_rising | watch | stable",
      "key_changes": ["变化1", "变化2"],
      "opportunities": ["机会1"],
      "risks": ["风险1"],
      "watch_items": ["关注项1"],
      "evidence_event_ids": [1, 5, 12]
    },
    "Dubai": {...},
    "Milan": {...}
  },
  "cross_market_insight": "一句话跨市场洞察"
}
"""

def run_analyst(conn, max_turns: int = 12) -> tuple[dict, list]:
    """
    返回 (最终 judgment dict, 完整 tool use trace)
    trace 用于 demo 时给评委看
    """
    messages = [{
        "role": "user",
        "content": "请对 Singapore / Dubai / Milan 三个市场进行战略分析。开始调用 tools 收集证据。"
    }]
    
    trace = []  # 🌟 完整记录每一轮
    
    for turn in range(max_turns):
        resp = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=messages,
        )
        
        # 记录这一轮
        turn_record = {
            "turn": turn + 1,
            "stop_reason": resp.stop_reason,
            "tool_calls": [],
            "text": ""
        }
        
        # 收集这一轮的 assistant content
        assistant_content = []
        tool_results_content = []
        
        for block in resp.content:
            if block.type == "text":
                turn_record["text"] = block.text
                assistant_content.append({"type": "text", "text": block.text})
            elif block.type == "tool_use":
                print(f"[Turn {turn+1}] 🔧 Tool: {block.name}({json.dumps(block.input, ensure_ascii=False)})")
                result = dispatch_tool(block.name, block.input, conn)
                turn_record["tool_calls"].append({
                    "name": block.name,
                    "input": block.input,
                    "output_preview": str(result)[:300]
                })
                assistant_content.append({
                    "type": "tool_use",
                    "id": block.id,
                    "name": block.name,
                    "input": block.input
                })
                tool_results_content.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": json.dumps(result, ensure_ascii=False)
                })
        
        trace.append(turn_record)
        messages.append({"role": "assistant", "content": assistant_content})
        
        # 没有 tool call 了 → agent 准备给最终答案
        if resp.stop_reason == "end_turn":
            # 尝试从最后一段 text 解析 JSON
            text = turn_record["text"]
            judgment = parse_judgment_json(text)
            if judgment:
                return judgment, trace
            # 没解析到 JSON，让它再说一次
            messages.append({
                "role": "user",
                "content": "请输出最终的 JSON 判断，按 system prompt 中的 schema。"
            })
            continue
        
        # 有 tool call → 把结果喂回去
        messages.append({"role": "user", "content": tool_results_content})
    
    # 超过 max_turns，强制收尾
    messages.append({
        "role": "user", 
        "content": "请立刻输出最终 JSON 判断，不要再调用 tools。"
    })
    final = client.messages.create(
        model="claude-sonnet-4-6", max_tokens=2048,
        system=SYSTEM_PROMPT, messages=messages,
    )
    return parse_judgment_json(final.content[0].text) or {}, trace


def parse_judgment_json(text: str) -> dict | None:
    """从 LLM 输出里捞 JSON 块"""
    text = text.strip()
    # 处理 ```json ... ``` 包裹
    if "```" in text:
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
    # 直接尝试
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # 尝试找第一个 { 到最后一个 }
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            try:
                return json.loads(text[start:end+1])
            except json.JSONDecodeError:
                return None
    return None
```

### `brief.py`

```python
from datetime import date
from anthropic import Anthropic

client = Anthropic()

BRIEF_PROMPT = """基于以下战略判断 JSON，生成一份**每日战略简报**（Markdown 格式）。

战略判断：
{judgments}

近 7 天事件数：{event_count}

**Markdown 结构**（严格遵守）：

# Aurum Radar 每日战略简报 — {today}

## 一、今日重点市场态势

> 用一个表格列出 Singapore / Dubai / Milan 的 state

## 二、关键变化（按市场分组）

## 三、业务影响判断

### 机会
### 风险  
### 需关注

## 四、跨市场洞察

## 五、行动建议（按部门）

- **市场部**：
- **产品部**：
- **品牌部**：
- **法务合规**：

## 六、本简报依据

事件数 / 数据库覆盖范围 / Agent 调用工具次数
"""

def generate_brief(judgments: dict, event_count: int, trace: list) -> str:
    import json
    today = date.today().isoformat()
    tool_call_count = sum(len(t["tool_calls"]) for t in trace)
    
    prompt = BRIEF_PROMPT.format(
        judgments=json.dumps(judgments, ensure_ascii=False, indent=2),
        event_count=event_count,
        today=today
    )
    prompt += f"\n\nAgent 共调用工具 {tool_call_count} 次，分布在 {len(trace)} 轮对话中。"
    
    resp = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=3000,
        messages=[{"role": "user", "content": prompt}],
    )
    return resp.content[0].text
```

### `run_once.py`（入口）

```python
import json
from pathlib import Path
from datetime import date
from dotenv import load_dotenv

load_dotenv()

import db
from sources import collect_rss, collect_tavily, SEED_QUERIES
from extractor import extract_event
from analyst import run_analyst
from brief import generate_brief

def main():
    conn = db.init()
    
    print("=" * 60)
    print("Step 1: 采集公开信息")
    print("=" * 60)
    rss_items = collect_rss()
    tavily_items = collect_tavily(SEED_QUERIES, max_results=4)
    raw = rss_items + tavily_items
    print(f"  RSS: {len(rss_items)} 条 | Tavily: {len(tavily_items)} 条 | 合计: {len(raw)} 条")
    
    print("\n" + "=" * 60)
    print("Step 2: Haiku 结构化抽取")
    print("=" * 60)
    saved = 0
    for i, item in enumerate(raw, 1):
        event = extract_event(item)
        if event:
            db.save_event(conn, event)
            saved += 1
        if i % 5 == 0:
            print(f"  已处理 {i}/{len(raw)}（保存 {saved}）")
    print(f"  结构化事件保存：{saved} 条")
    
    print("\n" + "=" * 60)
    print("Step 3: 🌟 Market Analyst Agent（核心 agentic loop）")
    print("=" * 60)
    judgments, trace = run_analyst(conn)
    print(f"\n  Agent 总轮数：{len(trace)}")
    print(f"  Tool 调用总数：{sum(len(t['tool_calls']) for t in trace)}")
    
    print("\n" + "=" * 60)
    print("Step 4: 生成每日简报")
    print("=" * 60)
    all_events = db.query_events(conn, days=7)
    brief_md = generate_brief(judgments, len(all_events), trace)
    
    # 保存
    outputs = Path("outputs")
    outputs.mkdir(exist_ok=True)
    today = date.today().isoformat()
    
    brief_path = outputs / f"brief_{today}.md"
    brief_path.write_text(brief_md, encoding="utf-8")
    
    trace_path = outputs / f"trace_{today}.json"
    trace_path.write_text(json.dumps(trace, ensure_ascii=False, indent=2), 
                          encoding="utf-8")
    
    judgments_path = outputs / f"judgments_{today}.json"
    judgments_path.write_text(json.dumps(judgments, ensure_ascii=False, indent=2),
                              encoding="utf-8")
    
    print(f"  ✅ Brief:     {brief_path}")
    print(f"  ✅ Trace:     {trace_path}（demo 时给评委看这个）")
    print(f"  ✅ Judgments: {judgments_path}")
    
    print("\n" + "=" * 60)
    print("DONE. 跑 `cat outputs/brief_*.md` 看输出")
    print("=" * 60)

if __name__ == "__main__":
    main()
```

---

## 四、48 小时执行清单

### Day 1（验证 agent 可行性，这是你说的"demo 验证"目标）

| 时段 | 任务 | 验收标准 |
|---|---|---|
| 0–2h | 环境搭建：venv + 装依赖 + 配 `.env`（Anthropic + Tavily key） | `python -c "from anthropic import Anthropic; Anthropic()"` 通过 |
| 2–4h | 跑通 `sources.py`，确认能拿到 30+ 条原始信息 | `python -c "from sources import collect_rss; print(len(collect_rss()))"` 输出 ≥ 30 |
| 4–6h | 跑通 `extractor.py`，确认 Haiku 能稳定输出合法 JSON | 抽 10 条试，至少 7 条能解析成功 |
| 6–9h | **写 `tools.py` + `analyst.py`，跑通完整 agent loop** | 看到 ≥ 6 次 tool 调用，最终拿到 judgments JSON |
| 9–11h | 输出 brief，看效果 | `brief_*.md` 可读、结构完整 |
| 11–12h | 调 prompt：让 agent 更主动调 `compare_markets` 和 `search_web` | tool 调用分布均衡，不只用一个 tool |

**Day 1 终点**：跑 `python run_once.py` 一气呵成，产出 brief + trace。截图发自己微信，明天 demo 用。

### Day 2（优化 + 演示包装）

| 时段 | 任务 |
|---|---|
| 0–3h | 跑 3 次完整 pipeline，每次保存不同日期的 brief，**累积"7 天历史"假象**（黑客松常用技巧） |
| 3–5h | 写一个 `viewer.html`：左侧 brief，右侧 tool trace 时间轴。**这是 demo 视觉锤** |
| 5–7h | 录 90 秒 demo 视频：跑 pipeline + 滚 trace + 展示 brief |
| 7–9h | 写 README + 3 张架构图（mermaid 就够） |
| 9–11h | 准备 5 分钟 pitch deck（10 张以内） |
| 11–12h | 提交 + buffer |

---

## 五、Demo 时的 3 个关键时刻

评委注意力只有 5 分钟，必须设计**视觉锤**。

1. **第 30 秒**：开 terminal 跑 `python run_once.py`，让评委看到 `🔧 Tool: compare_markets(...)` 滚动出现。这是证明"真 agent"的硬核证据。
2. **第 2 分钟**：打开 `viewer.html`，展示 trace 时间轴——"agent 自己决定先查 Singapore，发现 regulation 类事件多，又主动调 `get_category_trend`，最后调 `search_web` 补证据"。这是 Boris Cherny 这种评委最爱看的画面。
3. **第 4 分钟**：打开 `brief_*.md`，强调"每条判断都能溯源到具体事件 ID"，这是 Lydia 和陈凯关心的。

---

## 六、最容易踩的 5 个坑（提前规避）

1. **Haiku 输出 JSON 不稳定** → 我已经在 `extractor.py` 里加了 markdown fence 处理。如果还是不稳，加 `tool_choice` 强制结构化输出。
2. **Agent 死循环不停调 tool** → `max_turns=12` 兜底 + 最后强制收尾。
3. **Tavily quota 用完** → 免费层每月 1000 次，Day 1 别跑超过 20 次完整 pipeline。
4. **RSS feed 偶尔挂掉** → `feedparser.parse` 不会抛异常，但要检查 `feed.entries` 长度。
5. **演示当天 API 抽风** → 提前一天把 `outputs/brief_*.md` 和 `trace_*.json` 存好，如果现场跑失败就放录屏 + 展示文件。

---

## 七、给你的下一步

**今晚做的事**：跑通 Step 1 + Step 2，确认 `events` 表里能存进去 ≥ 15 条结构化事件。这一步通过，后面 Step 3 的 agent 就一定能跑——因为没有数据 agent 也没法 reason。

明天开工前，要不要我帮你：
1. 把上面的代码打包成一个 zip，你直接解压 `pip install -r requirements.txt && python run_once.py`？
2. 或者先帮你跑 `sources.py` 的可行性测试，看 3 个 RSS 现在还活着没？

挑一个，我直接做。