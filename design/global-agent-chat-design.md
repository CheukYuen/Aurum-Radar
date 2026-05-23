# Aurum Radar — Global Agent Chat 设计方案

> 版本：v1.1 | 日期：2026-05-23 | 状态：进行中

**职责划分：**
- 本文档负责人：Global Agent Chat（后端 API + 前端 ChatDrawer）
- 上游依赖：管道 Stage 3-7 落库，由另一同事负责，Agent Chat 等其交付后接入

---

## 目录

0. [前置依赖与交接契约](#0-前置依赖与交接契约)
1. [现有 Agent 架构总览](#1-现有-agent-架构总览)
2. [设计目标](#2-设计目标)
3. [方案概述](#3-方案概述)
4. [后端新增组件](#4-后端新增组件)
5. [API 规范](#5-api-规范)
6. [前端组件设计](#6-前端组件设计)
7. [上下文注入策略](#7-上下文注入策略)
8. [会话管理](#8-会话管理)
9. [实现阶段](#9-实现阶段)

---

## 0. 前置依赖与交接契约

### 0.1 当前数据库状态（2026-05-23）

| 表 | 行数 | 说明 |
|----|------|------|
| `raw_documents` | 1482 | ✅ 已落库，Tavily/GDELT/Google News/Reddit 等来源 |
| `intelligence_events` | 0 | ❌ 等待同事运行 Stage 3-4 |
| `market_snapshots` | 0 | ❌ 等待同事运行 Stage 5 |
| `daily_briefs` | 0 | ❌ 等待同事运行 Stage 6 |
| `council_reports` | 0 | ❌ 等待同事运行 Stage 7 |
| `action_items` | 0 | ❌ 等待同事运行 Stage 7 |

**管道命令（同事负责执行）：**
```bash
cd backend
python scripts/run_pipeline.py --markets SG JP TH --stages 3 4 5 6 7
```

### 0.2 交接契约

Agent Chat 依赖以下表结构，**不修改这些表，只读取**：

| 表 | Agent Chat 读取的字段 |
|----|----------------------|
| `daily_briefs` | `brief_date`, `executive_summary`, `opportunities`, `risks`, `recommended_actions` |
| `council_reports` | `market`, `report_date`, `report`（JSON，含 `council_summary`, `key_signals`, `strategic_options`, `department_actions`）|
| `intelligence_events` | `id`, `market`, `summary`, `signal_direction`, `priority`, `intensity`, `env_factors`, `confidence`, `extra`（含 source_name, credibility, url）|
| `action_items` | `id`, `market`, `department`, `priority`, `action_title`, `rationale`, `status` |
| `market_snapshots` | `market`, `snapshot_date`, `opportunity_score`, `risk_score`, `overall_judgement` |

### 0.3 开发策略

在同事完成落库之前，Agent Chat 的开发按以下策略推进：

1. **后端**：context_builder 全部写完，但当表为空时返回 `None`（graceful degradation），prompt_builder 对空字段跳过对应章节而不报错
2. **前端**：ChatDrawer 完整实现，空数据时展示占位提示 "今日情报数据处理中，请稍后"
3. **联调**：同事落库后，直接接入，无需改代码

---

## 1. 现有 Agent 架构总览

### 1.1 整体管道架构

```
数据层                      处理层（7阶段流水线）                     存储层
─────────────────────────────────────────────────────────────────────────────

data_probe/
  output/normalized/   ──→  Stage 1: Ingest (providers.py / stubbed)
                       ──→  Stage 2: Clean & Dedup          ──→  raw_documents
                       ──→  Stage 3: Extract (LLM, 双坐标轴) ──→  ┐
                       ──→  Stage 4: Score (rule-based)      ──→  intelligence_events
                       ──→  Stage 5: Forecast (LLM)          ──→  market_snapshots
                       ──→  Stage 6: Brief (LLM)             ──→  daily_briefs
                       ──→  Stage 7: Council ─────────────── ──→  council_reports
                                    (AGENT SYSTEM)           ──→  action_items
```

### 1.2 Stage 7：现有 Agent 系统（Jewelry Intelligence Council）

```
intelligence_events (DB)
         │
         ▼
  adapter.py (build_batch)
         │  构建 input_schema.json 格式的 intelligence_batch
         ▼
  orchestrator.py (run_council)
         │
         ├──────────────────────────────────────────────────────────┐
         │  Thread Pool（5 个专家并行，互相不可见）                    │
         │                                                          │
         ├─ product_marketing_strategist    (新品/价格带/营销节点)      │
         ├─ competitor_strategy_analyst     (竞品门店/定价/渠道)       │
         ├─ consumer_insight_analyst        (婚庆/悦己/客群/情绪)      │
         ├─ risk_compliance_analyst         (金价/汇率/关税/合规)       │
         └─ military_strategist             (孙子兵法 + 毛选 + 12策略库) │
                                                                   │
         └──────────────────────────────────────────────────────────┘
                  │  所有专家输出汇总
                  ▼
         chief_strategy_officer (串行综合)
                  │  输入：5份专家报告 + 原始批次 + synthesis_prompt
                  ▼
         council_report (JSON)
                  │
         ┌────────┴────────┐
         ▼                 ▼
  council_reports     derive_actions()
      (DB)                 │
                           ▼
                      action_items (DB)
```

**关键特性：**
- 专家系统是**批处理模式**——每天管道运行一次，结果落库
- 专家文件为 Markdown 格式，通过 `loader.py` 自动发现
- military_strategist 注入孙子兵法（vendored SKILL.md）+ 毛选框架 + 12 策略库
- 每个判断必须有 `evidence_ids` 回溯到 intelligence_events
- LLM 后端：Aliyun DashScope（Qwen 系列，OpenAI 兼容接口）

### 1.3 现有 API 全貌

```
GET  /health
GET  /dashboard/summary
GET  /overview
GET  /markets/{market}
GET  /markets/{market}/council        ← council_report（批处理结果）
GET  /council/latest
GET  /brief/latest                    ← daily_brief（批处理结果）
GET  /briefs/{date}
GET  /events                          ← intelligence_events（可过滤）
POST /events/batch
GET  /events/{id}
GET  /actions                         ← action_items
GET  /actions/{id}
```

**缺口：** 所有 API 均为只读查询，无实时交互式 Agent 能力。

### 1.4 数据库关系图

```
raw_documents ──(1:N)──→ intelligence_events ──(N:M)──→ council_reports
                                    │                          │
                                    └────────(1:N)──→ action_items
intelligence_events ──(N:1)──→ market_snapshots
market_snapshots ──(N:1)──→ daily_briefs
```

---

## 2. 设计目标

### 核心目标
让 Aurum Radar 从"展示情报"升级为"可持续追问的战略辅助 Agent"：
```
公开信息扫描 → 情报筛选 → 市场判断 → 每日战略简报
                                              │
                                              ▼
                                    Agent 连续追问 ← [NEW]
                                              │
                                              ▼
                                    部门行动建议（动态生成）← [NEW]
```

### 约束条件
- 不压缩左侧全球地图，Agent Chat 使用右侧抽屉，不常驻
- 不新增过多卡片，保持高级珠宝战略情报看板风格
- MVP 优先：单 LLM 调用（不重新触发 5 专家并行）
- 会话状态轻量管理（内存 + 可选 Redis）

---

## 3. 方案概述

### 3.1 整体新增架构

```
[前端] ChatDrawer (React, 420px, 右侧滑出)
        │
        │  POST /api/agent/chat
        ▼
[后端] routes_agent.py  ←─ 新建
        │
        ▼
[后端] app/services/agent_chat/  ←─ 新建
        ├── chat_service.py        ← 主调度器
        ├── context_builder.py     ← 从 DB 构建上下文
        ├── prompt_builder.py      ← 组装 system prompt + 用户消息
        └── response_parser.py     ← 解析 LLM 输出
        │
        ├── 读取 ──→ daily_briefs (DB)
        ├── 读取 ──→ council_reports (DB)
        ├── 读取 ──→ intelligence_events (DB, 按相关性过滤)
        ├── 读取 ──→ action_items (DB)
        └── 读取 ──→ market_snapshots (DB)
        │
        ▼
[LLM] DashScope (qwen-max)  ← 复用现有 services/llm/dashscope.py
        │
        ▼
[前端] 结构化响应渲染
        ├── 直接结论
        ├── 判断依据
        ├── 相关事件（可点击，跳转 events 详情）
        ├── 来源引用
        └── 建议下一步
```

### 3.2 与现有系统的关系

| 维度           | 现有 Council Agent             | 新增 Global Agent Chat        |
|----------------|-------------------------------|-------------------------------|
| 触发方式       | 管道批处理（每天一次）           | 用户实时提问（按需）            |
| 专家数量       | 5 专家并行 + 1 综合              | 单次 LLM（带完整上下文）         |
| 输入           | intelligence_events 批次        | 用户自然语言问题 + 数据库上下文  |
| 输出           | 结构化 council_report           | 结构化对话回复（含引用）         |
| 延迟           | 批处理（分钟级）                | 实时（5-15秒）                  |
| 会话能力       | 无（单次）                      | 多轮对话（session 管理）        |
| LLM 模型       | qwen-max（每专家独立调用）       | qwen-max（单次，注入全上下文）   |
| 目的           | 生成战略简报                    | 解释/追问/推导行动建议          |

---

## 4. 后端新增组件

### 4.1 目录结构

```
backend/app/
├── api/
│   └── routes_agent.py          [NEW] POST /agent/chat, GET /agent/sessions/{id}
├── schemas/
│   └── agent_chat.py            [NEW] ChatRequest, ChatResponse, ChatMessage
└── services/
    └── agent_chat/              [NEW]
        ├── __init__.py
        ├── chat_service.py      ← 主入口：orchestrate context + LLM call
        ├── context_builder.py   ← 从 DB 加载相关数据，构建结构化上下文
        ├── prompt_builder.py    ← 组装 system prompt（含完整上下文注入）
        ├── response_parser.py   ← 解析 LLM JSON 输出 → ChatResponse
        └── session_store.py     ← 内存会话状态（含 TTL）
```

**约束：** 遵循项目约定（`feedback_no_new_top_level_modules.md`），在现有 `services/` 下新增子目录，不新建顶层模块。

### 4.2 核心类设计

#### `context_builder.py`

```python
class AgentContextBuilder:
    """从 DB 拉取当前上下文，供 prompt_builder 使用。
    
    所有字段均允许 None（上游管道未跑完时 graceful degradation）。
    """

    def build(
        self,
        db: Session,
        brief_date: str | None,
        market: str | None,
        event_ids: list[str] | None,
    ) -> AgentContext:
        """
        返回 AgentContext，各字段在表为空时为 None 而非报错：
        - brief: daily_briefs 最新一条（或指定日期），表空则 None
        - council_report: 对应市场最新 council_report，表空则 None
        - top_events: intelligence_events 最多 20 条，表空则 []
        - actions: action_items (pending + P0/P1)，表空则 []
        - snapshot: market_snapshots 最新快照，表空则 None
        """
```

#### `prompt_builder.py`

```python
SYSTEM_PROMPT_TEMPLATE = """
你是 Aurum Radar 的战略情报助理，服务于珠宝品牌的战略决策团队。

## 当前情报上下文（{brief_date}）

### 今日战略简报摘要
{brief_summary}

### 市场判断快照
{market_snapshots}

### 高优先级情报事件（P0/P1）
{top_events_json}

### 当前行动建议
{action_items_json}

### 专家委员会核心判断
{council_summary}

## 你的回答规范
每次回答必须包含以下结构（JSON）：
{{
  "conclusion": "直接结论（2-3句）",
  "reasoning": "判断依据（引用具体事件和信号）",
  "evidence_ids": ["intel-001", ...],
  "sources": [{{"title": "...", "url": "...", "credibility": "A"}}],
  "next_steps": ["具体建议1", "具体建议2"],
  "related_action_ids": ["action-001", ...]
}}

规则：
- 结论必须有证据支撑（引用 evidence_ids）
- 弱信号或不确定的判断需标明置信度
- 涉及具体行动建议时，优先引用已有 action_items
- 不要超出今日情报上下文范围臆测
"""
```

#### `session_store.py`

```python
@dataclass
class ChatSession:
    session_id: str
    created_at: datetime
    last_active: datetime
    messages: list[dict]        # [{role, content, message_id, timestamp}]
    context_snapshot: dict      # brief_date, market 等，首条消息时锁定
    ttl_seconds: int = 3600     # 默认 1 小时过期

class InMemorySessionStore:
    """
    生产阶段可替换为 Redis。
    MVP 阶段：进程内字典 + 后台清理协程（asyncio）。
    """
    _sessions: dict[str, ChatSession] = {}
```

### 4.3 `routes_agent.py` 注册方式

在 `app/main.py` 中 include：
```python
from app.api import routes_agent
app.include_router(routes_agent.router, prefix="/api")
```

---

## 5. API 规范

### 5.1 发起/续接对话

```
POST /api/agent/chat
```

**Request Body:**
```json
{
  "session_id": "uuid-optional",
  "message": "为什么今天新加坡被判断为机会增强？",
  "context": {
    "brief_date": "2026-05-23",
    "market": "Singapore",
    "event_ids": []
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `session_id` | string? | 不传则新建会话，返回新 session_id |
| `message` | string | 用户问题（必填）|
| `context.brief_date` | string? | ISO 日期，默认今日 |
| `context.market` | string? | 市场过滤，默认不过滤 |
| `context.event_ids` | string[]? | 指定关注的情报事件 ID |

**Response Body:**
```json
{
  "session_id": "550e8400-e29b-41d4-a716",
  "message_id": "msg-0042",
  "response": {
    "conclusion": "新加坡今日判断为机会增强，主因是本地婚庆季启动叠加通胀预期回落，消费者购买力信心边际回升。",
    "reasoning": "综合3项P1事件（intel-007、intel-012、intel-019）：婚庆档期临近（+20%历史均值），同期新加坡CPI数据回落至2.1%，奢侈品消费情绪指数上升。专家委员会将其归因于F3（需求迁移）+ F5（价格传导缓解）共振。",
    "evidence_ids": ["intel-007", "intel-012", "intel-019"],
    "sources": [
      {
        "title": "Singapore CPI May 2026",
        "url": "https://singstat.gov.sg/...",
        "credibility": "S"
      }
    ],
    "next_steps": [
      "关注本周婚庆展销数据，确认需求是否实际转化",
      "评估P0行动建议 action-003 的执行时机"
    ],
    "related_action_ids": ["action-003", "action-007"]
  },
  "context_used": {
    "brief_date": "2026-05-23",
    "events_referenced": 3,
    "council_report_date": "2026-05-23",
    "market": "Singapore"
  }
}
```

### 5.2 获取会话历史

```
GET /api/agent/sessions/{session_id}
```

**Response:**
```json
{
  "session_id": "550e8400-...",
  "created_at": "2026-05-23T09:00:00Z",
  "messages": [
    {
      "message_id": "msg-0001",
      "role": "user",
      "content": "为什么今天新加坡被判断为机会增强？",
      "timestamp": "2026-05-23T09:00:01Z"
    },
    {
      "message_id": "msg-0002",
      "role": "assistant",
      "content": { /* 同上 response 结构 */ },
      "timestamp": "2026-05-23T09:00:08Z"
    }
  ],
  "context_snapshot": {
    "brief_date": "2026-05-23",
    "market": "Singapore"
  }
}
```

### 5.3 获取建议问题

```
GET /api/agent/suggested-questions?brief_date=2026-05-23&market=Singapore
```

**Response:**
```json
{
  "questions": [
    {
      "id": "sq-1",
      "text": "为什么今天新加坡被判断为机会增强？",
      "category": "market_judgement",
      "context": { "market": "Singapore" }
    },
    {
      "id": "sq-2",
      "text": "金价高位对哪些产品线影响最大？",
      "category": "price_signal",
      "context": {}
    },
    {
      "id": "sq-3",
      "text": "今天有哪些 P0 / P1 行动建议？",
      "category": "actions",
      "context": {}
    },
    {
      "id": "sq-4",
      "text": "哪些判断有最高可信来源？",
      "category": "source_quality",
      "context": {}
    }
  ],
  "context_chips": [
    { "id": "chip-brief", "label": "今日战略简报", "type": "brief", "date": "2026-05-23" },
    { "id": "chip-sg", "label": "新加坡市场判断", "type": "market", "market": "Singapore" },
    { "id": "chip-p0", "label": "高优先级事件", "type": "priority", "count": 5 },
    { "id": "chip-actions", "label": "部门行动建议", "type": "actions", "count": 8 }
  ]
}
```

---

## 6. 前端组件设计

### 6.1 组件树

```
App
└── Dashboard (现有)
    ├── TopBar (现有)
    │   └── [NEW] AskAgentButton  ← 「Ask Agent」按钮
    ├── GlobalMap (现有，不压缩)
    ├── BriefViewer (现有)
    │   └── [NEW] BriefActionBar  ← 「继续追问」「解释这个判断」等按钮
    └── [NEW] ChatDrawer          ← 核心新组件（右侧滑出）
        ├── DrawerHeader
        ├── ContextChips
        ├── SuggestedQuestions
        ├── MessageThread
        │   └── MessageBubble (user/assistant)
        │       └── StructuredResponse (for assistant)
        │           ├── ConclusionSection
        │           ├── ReasoningSection
        │           ├── EvidenceChips (可点击，跳转事件详情)
        │           ├── SourceList
        │           └── NextStepsSection
        └── ChatInput
```

### 6.2 ChatDrawer 视觉规范

```
┌─────────────────────────────────────────┐  ← 右侧滑出，宽度 420px
│  Aurum Agent                        [×] │  ← 顶部标题栏
│  继续追问今日战略简报                       │  ← 副标题
├─────────────────────────────────────────┤
│  [今日战略简报] [新加坡市场判断]             │  ← Context Chips（米白 + 浅金边框）
│  [高优先级事件 ×5] [部门行动建议 ×8]         │
├─────────────────────────────────────────┤
│  你可以这样问：                             │  ← Suggested Questions
│  ┌─────────────────────────────────────┐│
│  │ 为什么今天新加坡被判断为机会增强？      ││
│  │ 金价高位对哪些产品线影响最大？          ││
│  │ 今天有哪些 P0/P1 行动建议？            ││
│  │ 哪些判断有最高可信来源？               ││
│  └─────────────────────────────────────┘│
├─────────────────────────────────────────┤
│  [消息区域，可滚动]                         │
│                                          │
│  ┌─ Aurum Agent ───────────────────────┐│
│  │ 结论：新加坡今日判断为机会增强，主因...  ││
│  │                                      ││
│  │ 依据：                                ││
│  │  · 婚庆季启动 [intel-007]             ││
│  │  · CPI 回落 2.1% [intel-012]         ││
│  │                                      ││
│  │ 来源：Singapore CPI ★★★              ││
│  │                                      ││
│  │ 下一步：                              ││
│  │  → 关注婚庆展销数据                    ││
│  └──────────────────────────────────── ┘│
│                                          │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐│
│  │ Ask about market signals, brief...   ││  ← 输入框
│  └─────────────────────────────[Send]─┘│
└─────────────────────────────────────────┘
```

**样式规范：**
- 背景：`#FAF8F3`（米白）
- 边框：`1px solid #C9A84C`（浅金）
- 标题字体：珠宝行业衬线风格，`#2C1A0E`（深棕）
- Chip 样式：`background: #F5EDD8; border: 1px solid #C9A84C; border-radius: 4px`
- 用户消息气泡：右对齐，`background: #C9A84C20`
- Agent 回复：左对齐，无气泡，结构化排版
- Evidence Chips：`background: #2C1A0E10; border: 1px solid #2C1A0E30`，点击可跳转

### 6.3 入口设计

**入口 1：TopBar 按钮（主入口）**
```
[查看今日战略简报]  [Ask Agent ▿]
```
- 点击打开 ChatDrawer，加载今日简报上下文

**入口 2：简报 Quick Actions（联动入口）**
在 BriefViewer 底部增加行动条：
```
[继续追问]  [解释这个判断]  [查看来源]  [生成部门行动]
```
- 点击后自动打开 ChatDrawer，并预填对应问题
- 携带当前简报 brief_date 和 market 作为上下文

**入口 3：底部浮动输入框（辅助入口，可选）**
页面右下角（不遮挡地图）：
```
┌──────────────────────────────────────┐
│ Ask Aurum Agent about today's brief…  │
└──────────────────────────────────────┘
```

### 6.4 联动行为映射

| 触发来源 | 预填问题 | 携带上下文 |
|--------|---------|-----------|
| 「继续追问」 | 无（空白，显示 suggested questions） | brief_date, market |
| 「解释这个判断」 | "请解释今日 {market} 市场的整体战略判断" | brief_date, market |
| 「查看来源」 | "今日哪些判断来源最可信？请列出关键事件的原始来源" | brief_date |
| 「生成部门行动」 | "基于今日简报，为各部门生成具体执行建议" | brief_date, market |
| 点击 Evidence Chip | "请详细解释事件 {event_id} 的意义和影响" | event_ids: [event_id] |
| 点击 Action Item | "如何执行行动建议「{action_title}」？需要哪些资源和步骤？" | action_id |

---

## 7. 上下文注入策略

### 7.1 上下文层级（Token 预算分配）

```
Total budget: ~8000 tokens for context injection

Priority 1 (必注入，~2000 tokens):
  - daily_brief.executive_summary
  - daily_brief.opportunities (top 3)
  - daily_brief.risks (top 3)
  - market_snapshot.overall_judgement (相关市场)

Priority 2 (按需注入，~3000 tokens):
  - council_report.council_summary
  - council_report.key_signals (top 5)
  - council_report.strategic_options

Priority 3 (相关事件，~2500 tokens):
  - intelligence_events (P0: all, P1: top 10)
  - 字段：id, summary, signal_direction, env_factors, confidence, source

Priority 4 (行动项，~500 tokens):
  - action_items (status=pending, priority in P0/P1)
  - 字段：id, department, priority, action_title, rationale

```

### 7.2 相关性过滤

当用户问题提及特定关键词时，动态加载对应数据：

```python
TOPIC_QUERY_MAP = {
    "金价|黄金|gold": {"env_factor": "F1,F5", "source_category": "macro"},
    "婚庆|wedding|bridal": {"env_factor": "F3", "tags": ["婚庆"]},
    "竞品|competitor|cartier": {"source_category": "competition"},
    "P0|P1|行动": {"extra_actions": True, "all_priorities": True},
    "来源|source|可信": {"include_sources": True, "sort_by": "credibility"},
    "法规|合规|关税": {"env_factor": "F4", "source_category": "regulation"},
}
```

### 7.3 多轮对话上下文管理

```
Turn 1: 用户问 "为什么新加坡机会增强？"
  → 注入全量上下文（brief + council + top events）

Turn 2: 用户问 "那金价影响呢？"（指代关系）
  → 保留 Turn 1 的 session context
  → 追加加载 macro 类型事件（F1/F5 因子）
  → 历史消息压缩：Turn 1 的 assistant 回复缩减为 summary

Turn 3+:
  → 历史消息滚动窗口（保留最近 6 轮）
  → 原始 DB 上下文仅在首轮注入（session 锁定 context_snapshot）
```

---

## 8. 会话管理

### 8.1 Session 生命周期

```
客户端请求（无 session_id）
    │
    ▼
新建 ChatSession
    ├── session_id = uuid4()
    ├── context_snapshot = { brief_date, market }（首次锁定）
    ├── messages = []
    └── TTL = 3600s（1小时无活动后清理）
    │
    ▼
每次请求追加 messages
    │
    ▼
Session 过期 → 自动删除（后台协程 cleanup_expired_sessions）
```

### 8.2 消息结构

```python
@dataclass
class ChatMessage:
    message_id: str       # "msg-{session_prefix}-{n}"
    role: Literal["user", "assistant"]
    content: str | ChatResponse
    timestamp: datetime
    tokens_used: int | None
```

### 8.3 并发控制

- 同一 session 同时只允许一个进行中的请求（使用 `asyncio.Lock`）
- 请求排队超时 30 秒返回 409 Conflict
- 不同 session 互不阻塞

---

## 9. 实现阶段

### Phase 0：等待上游落库（同事负责，不在本人工作范围）

- [ ] 同事执行管道 Stage 3-7，生成 intelligence_events / market_snapshots / daily_briefs / council_reports / action_items
- [ ] 联调确认各表数据格式符合第 §0.2 节的交接契约

### Phase 1：后端 API（本人负责，可在 Phase 0 完成前并行开发）

- [ ] 新建 `app/schemas/agent_chat.py`（ChatRequest / ChatResponse / ChatMessage）
- [ ] 新建 `app/services/agent_chat/context_builder.py`
- [ ] 新建 `app/services/agent_chat/prompt_builder.py`（system prompt 模板）
- [ ] 新建 `app/services/agent_chat/session_store.py`（内存 store + TTL 清理）
- [ ] 新建 `app/services/agent_chat/chat_service.py`（主入口）
- [ ] 新建 `app/services/agent_chat/response_parser.py`
- [ ] 新建 `app/api/routes_agent.py`（POST /agent/chat, GET /agent/sessions/{id}, GET /agent/suggested-questions）
- [ ] 在 `app/main.py` 注册新路由

### Phase 2：前端核心组件（预计 3-4 天）

- [ ] 新建 `ChatDrawer` 组件（右侧滑出，420px，关闭/打开动画）
- [ ] 新建 `ContextChips` 组件
- [ ] 新建 `SuggestedQuestions` 组件
- [ ] 新建 `MessageThread` + `MessageBubble` 组件
- [ ] 新建 `StructuredResponse` 组件（含 EvidenceChip、SourceList）
- [ ] 新建 `ChatInput` 组件
- [ ] 接入 `POST /api/agent/chat`（含 loading 状态和错误处理）

### Phase 3：前端联动（预计 1-2 天）

- [ ] TopBar 新增 `AskAgentButton`，控制 ChatDrawer 开关
- [ ] BriefViewer 新增 `BriefActionBar`（继续追问、解释这个判断、查看来源、生成部门行动）
- [ ] 点击 Evidence Chip → 预填问题打开 Drawer
- [ ] 点击 Action Item → 预填问题打开 Drawer
- [ ] （可选）页面右下角浮动输入框

### Phase 4：体验优化（预计 1 天）

- [ ] 流式输出（SSE）替换一次性返回（降低等待感知）
- [ ] Evidence Chip 点击后高亮对应事件卡片
- [ ] Session 持久化到 localStorage（刷新后恢复对话）
- [ ] Suggested Questions 根据今日简报动态生成（复用 `/agent/suggested-questions`）

---

## 附录：关键文件路径速查

| 文件 | 说明 |
|------|------|
| `backend/app/services/council/orchestrator.py` | 现有 5 专家 Agent 系统 |
| `backend/app/services/llm/dashscope.py` | LLM 调用客户端（复用） |
| `backend/app/api/routes_brief.py` | 简报 API（参考模式） |
| `backend/app/models/daily_brief.py` | 简报数据模型 |
| `backend/app/models/council_report.py` | 专家委员会报告模型 |
| `backend/app/models/intelligence_event.py` | 情报事件模型（含双坐标轴）|
| `backend/app/database/session.py` | DB Session 工厂 |
