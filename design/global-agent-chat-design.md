# Aurum Radar — Global Agent Chat 设计方案

> 版本：v1.2 | 日期：2026-05-23 | 状态：进行中

**职责划分：**
- 本文档负责人：Global Agent Chat（后端 API + 前端 ChatDrawer）
- 上游依赖：管道 Stage 3-7 落库，由另一同事负责（TH 市场已完成）

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

### 0.1 当前数据库状态（2026-05-23 已核实）

| 表 | 行数 | 说明 |
|----|------|------|
| `raw_documents` | 1487 | ✅ SG/JP/TH/MY/KR/VN/PH/ID/US/CN，Tavily/GDELT/Google News/Reddit 等来源 |
| `intelligence_events` | **14** | ✅ TH 市场，P0×3 / P1×9 / P2×2 |
| `market_snapshots` | **1** | ✅ TH，opp=28 / risk=26 |
| `daily_briefs` | **1** | ✅ TH，2026-05-23 |
| `council_reports` | **1** | ✅ TH，5份专家报告 + 综合判断 |
| `action_items` | **7** | ✅ TH，P0×6 + P1×1，全部 pending |

**覆盖市场：目前仅 TH（泰国），SG/JP 等市场待同事继续落库。**

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

TH 市场数据已就绪，可直接开发并真实联调。其他市场（SG/JP）待同事继续落库，context_builder 对空表 graceful degradation（返回 None / []，prompt_builder 跳过对应章节）。

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

system prompt 分两层：**模板（代码中定义）** + **运行时填充（从 DB 注入）**。

```python
SYSTEM_PROMPT_TEMPLATE = """
你是 Aurum Radar 的战略情报助理，服务于周大福珠宝品牌的战略决策团队。
你的职责是围绕每日战略简报，解释判断依据、追问信号、推导行动建议。
你只能基于以下注入的今日情报上下文作答，不得超出范围臆测。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 今日战略简报（{brief_date} · {markets}）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 综合研判
{brief_executive_summary}

### 机会信号
{brief_opportunities}

### 风险信号
{brief_risks}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 市场快照（{snapshot_market} · opp={opp_score} / risk={risk_score}）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{snapshot_judgement}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 专家委员会核心判断（置信度：{council_confidence}）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 综合研判
{council_summary}

### 关键信号
{council_key_signals}

### 战略选项
{council_strategic_options}

### 专家分歧
{council_disagreements}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 高优先级情报事件
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{top_events}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 当前行动建议
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{action_items}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 回答规范
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

每次回答必须以 JSON 格式输出：
{{
  "conclusion": "直接结论（2-3句）",
  "reasoning": "判断依据（引用具体事件 #id）",
  "evidence_ids": [44, 45],
  "sources": [{{"title": "...", "url": "...", "credibility": "S|A|B|C"}}],
  "next_steps": ["具体建议1", "具体建议2"],
  "related_action_ids": [48, 49]
}}

规则：
- evidence_ids 必须是上方情报事件的真实数字 ID
- 弱信号判断需标明"中等置信度"或"低置信度"
- 行动建议优先引用已有 action_items 的 ID
- 若上下文中无相关信息，直接说明"当前情报上下文中无此数据"
"""
```

**完整填充后的 system prompt 示例（基于 2026-05-23 TH 真实数据）：**

```
你是 Aurum Radar 的战略情报助理，服务于周大福珠宝品牌的战略决策团队。
你的职责是围绕每日战略简报，解释判断依据、追问信号、推导行动建议。
你只能基于以下注入的今日情报上下文作答，不得超出范围臆测。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 今日战略简报（2026-05-23 · TH）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 综合研判
泰国市场进入战略再校准关键窗口：宏观基本面（GDP超预期、家庭/女性旅游热度上升、
黄金珠宝搜索走强）与品牌势能（周大福搜索热度持续攀升）构成坚实增长底座；但政策端
双重冲击——90国免签终止（P0级通道断点）直接削弱旅游零售核心动线，叠加数据基建失效
（GDELT查询连续失败）导致需求监测失焦，正加速放大培育钻石渗透与金价传导压力。
短期须以'敏捷渠道重构+场景化产品快反'对冲客流结构剧变，中期需在6–12个月偏好迁移
窗口内完成从'免税依赖型'向'本地生活嵌入型'运营范式的系统性切换。

### 机会信号
1. 女性结伴旅行场景爆发带来轻奢金饰快闪店与双人定制礼盒的高潜力落地机会
2. 泰国Q1 GDP达2.8%超预期，中产消费意愿提升利好婚庆黄金及轻奢钻石品类动销
3. 周大福在泰搜索热度持续上升，可借势推动渠道商优先铺货与联合营销资源倾斜
4. 黄金珠宝整体搜索热度上升，为线上精准获客与数字化投放ROI优化提供窗口

### 风险信号
1. 90国免签政策终止（P0）导致国际游客客流下降5–15%，曼谷核心商圈转化率承压
2. 旅游零售主渠道受阻，中印及中东婚庆采购需求加速向迪拜、新加坡分流
3. GDELT数据源连续失效（P2），致使黄金首饰线上兴趣与市场竞争态势研判失准
4. 培育钻石搜索热度上升（P1），天然金饰品牌面临价值沟通与客群心智防御双重挑战

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 市场快照（TH · opp=28 / risk=26）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

泰国市场呈现'热度上升但通道收窄'的矛盾格局：品牌声量（周大福搜索热度）、品类需求
（黄金/珠宝整体搜索）、经济基础（GDP超预期）与细分客群动能（女性结伴旅行、家庭暑期
游）均释放积极信号；但政策端显著收紧（90国免签终止）直接削弱旅游零售核心渠道，叠加
数据基础设施薄弱（GDELT查询失败）与培育钻石渗透加速，构成结构性挑战。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 专家委员会核心判断（置信度：medium）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 综合研判
泰国珠宝市场正经历结构性窗口期：旅游渠道塌陷（免签终止）与本地悦己消费动能初显
（女性结伴旅行+GDP上行）形成尖锐矛盾。周大福线上声量上升是虚势，而黄金搜索热度+
女性客群仪式化需求构成实基。默认推荐中策——'借港登岸+避实击虚'，即依托曼谷高端
百货与机场免税店快速落点，主推轻量化双人金饰与入门级培育钻石，以最低试错成本验证
本地化适配度。

### 关键信号
[S1] 黄金悦己消费（置信度 high）| evidence: #37 #47 #41
  黄金饰品搜索热度上升（#37）与GDP超预期（#47）共同指向悦己型轻奢金饰结构性扩张；
  金价上涨（#41）抑制克重消费，但强化设计溢价空间。

[S2] 女性旅行场景（置信度 medium）| evidence: #46
  女性结伴旅行被定位为泰国终极目的地，驱动联名款、双人礼盒、刻字定制等高社交属性
  悦己金饰的即兴与仪式化购买需求，属文化偏好迁移而非短期情绪。

[S3] 免签政策终止（置信度 high）| evidence: #44 #45
  系统性削弱国际游客婚庆/投资类高客单消费，旅游零售主干道塌陷，已直接触发渠道重构
  必要性。

[S4] 培育钻石渗透（置信度 medium）| evidence: #36
  培育钻石搜索热度上升进入偏好形成期，天然钻石叙事缺位加剧替代风险，预示其正从脉冲
  兴趣转向结构性渗透临界点。

### 战略选项
- 上策（进攻）：快速在曼谷顶级商圈开设旗舰店，主打高端定制培育钻石
- 中策（默认推荐）：借港登岸+避实击虚——依托现有渠道，主推轻量化双人金饰+入门级
  培育钻石，以最低试错成本验证本地化
- 下策（防守）：收缩旅游零售敞口，转向线上渠道维持品牌声量，等待政策明朗

### 专家分歧
[D1] 周大福TH热度驱动源：竞品分析师认为应立即响应抢占转化断点；消费者洞察分析师
  认为热度仅表注意力迁移，非购买意愿。→ 裁定为 watch_item，暂不驱动资源倾斜。
[D2] 女性旅行营销的佛教文化风险：'姐妹同行''灵魂共鸣'等表述是否过度世俗化？
  → 需本地宗教事务顾问确认后方可落地。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 高优先级情报事件
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[P0][#44] TH | negative | opp=31 risk=58
泰国政府宣布结束对大多数外国游客实施的60天免签入境政策。该政策调整自2026年5月起
生效，影响范围覆盖包括中国、印度、俄罗斯等主要客源国。

[P0][#45] TH | negative | opp=12 risk=47
泰国政府正式宣布取消面向90个国家公民的60天免签停留政策。该调整自2026年5月起生效，
意味着外国游客须提前申请签证或符合新入境条件。

[P0][#43] TH | neutral | opp=10 risk=38
泰国CAAT（民航局）等多个政府机构在DronTech Asia 2026发布会上共同亮相，聚焦无人机
技术应用。

[P1][#46] TH | positive | opp=39 risk=14
《国家法律评论》指出泰国正崛起为女性群体结伴旅行的终极目的地，暗示旅游场景重构与
女性消费动因强化。

[P1][#47] TH | positive | opp=38 risk=16
路透社：泰国2026年Q1实际GDP同比增长2.8%，超出市场普遍预测，反映宏观经济基本面稳健。

[P1][#37] TH | positive | opp=37 risk=13
Google Trends：泰国市场 'gold jewelry' 关键词搜索量呈上升趋势，反映消费者对黄金
饰品关注度提升。

[P1][#34] TH | positive | opp=38 risk=22
Google Trends：周大福（TH）关键词在泰国地区搜索量呈上升趋势，品牌认知活跃度变化。

[P1][#35] TH | positive | opp=38 risk=22
Google Trends：周大福（Chow Tai Fook）在泰国搜索趋势出现上升信号。

[P1][#36] TH | mixed | opp=30 risk=19
Google Trends：泰国 'lab grown diamond' 关键词搜索趋势呈上升态势，反映消费者对
培育钻石关注度提升。

[P1][#40] TH | positive | opp=33 risk=17
标题暗示泰国作为家庭暑期旅行目的地持续受欢迎，可能增强旅游零售生态活力。

[P1][#42] TH | negative | opp=25 risk=45
Forbes标题：美国零售商对2026年FIFA世界杯带动零售销售的预期趋于谨慎，渠道端信心
减弱。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 当前行动建议（7条，全部 pending）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[P0][action#48] 法务合规团队：下线所有含'免签购金''落地即提'表述的广告文案
  依据：ID44/45明确免签政策终止构成虚假宣传风险，是解阻后续行动的前提。

[P0][action#49] 法务合规团队：启用TH子公司黄金期货合约对冲比例提升至70%
  依据：ID41金价数据触发三路传导风险，叠加免签取消导致停留缩短。

[P0][action#43] 商品团队：上线'Siam Sister'双人悦己金饰系列（含刻字手镯+叠戴细链）
  依据：女性结伴旅行文化强化（ID46）与黄金搜索热度上升（ID37）共同驱动。

[P0][action#44] 市场营销团队：TikTok Thailand发起#MySiamSister挑战赛
  依据：ID46女性结伴旅行、ID40旅游渠道客流季节性提升。

[P0][action#46] 渠道团队：入驻曼谷CentralWorld百货专柜并铺设'Siam Sister'快闪点
  依据：ID40旅游零售渠道客流季节性提升，ID46女性结伴旅行文化势能。

[P0][action#47] 管理层：批准中策'借港登岸+避实击虚'执行预算（4.2M THB）与资源调配
  依据：中策预设条件均可在P0级达成，成本仅为上策33%。

[P1][action#45] 市场营销团队：LINE OA上线'Lab-Grown Gem Guide'互动H5
  依据：ID36培育钻石搜索热度上升处于认知迁移初期，需教育内容填补认知缺口。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## 回答规范
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

每次回答必须以 JSON 格式输出：
{
  "conclusion": "直接结论（2-3句）",
  "reasoning": "判断依据（引用具体事件 #id）",
  "evidence_ids": [44, 45],
  "sources": [{"title": "...", "url": "...", "credibility": "S|A|B|C"}],
  "next_steps": ["具体建议1", "具体建议2"],
  "related_action_ids": [48, 49]
}

规则：
- evidence_ids 必须是上方情报事件的真实数字 ID
- 弱信号判断需标明"中等置信度"或"低置信度"
- 行动建议优先引用已有 action_items 的 ID
- 若上下文中无相关信息，直接说明"当前情报上下文中无此数据"
```

**Token 估算（实际 TH 数据）：**

| 章节 | 约 tokens |
|------|-----------|
| 角色定义 + 规则 | ~150 |
| 今日战略简报 | ~600 |
| 市场快照 | ~300 |
| 专家委员会判断 | ~800 |
| 高优先级事件（P0×3 + P1×8） | ~1200 |
| 行动建议（7条） | ~700 |
| **合计** | **~3750 tokens** |

qwen-max 上下文窗口 32k，多轮对话历史（6轮 × ~500 tokens ≈ 3000 tokens）+ system prompt（3750 tokens）总计约 7000 tokens，充裕。

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

基于 TH 市场实际数据的估算（见 §4.2 system prompt 示例）：

```
System prompt 总计：~3750 tokens（qwen-max 32k 窗口的 12%）

必注入（~900 tokens）：
  - daily_brief.executive_summary          ← 综合研判全文
  - daily_brief.opportunities              ← top 4 条
  - daily_brief.risks                      ← top 4 条
  - market_snapshot.overall_judgement      ← 市场快照判断 + opp/risk 分

必注入（~800 tokens）：
  - council_report.council_summary         ← 专家综合研判
  - council_report.key_signals             ← top 4 条，含 evidence_ids
  - council_report.strategic_options       ← 上/中/下三策摘要
  - council_report.expert_disagreements    ← 分歧摘要（不含专家全文）

必注入（~1200 tokens）：
  - intelligence_events P0（全部 3 条）
  - intelligence_events P1（前 8 条，按 opp+risk 降序）
  - 字段：id, priority, market, signal_direction, opp_score, risk_score, summary

必注入（~700 tokens）：
  - action_items (status=pending，全部 7 条)
  - 字段：id, priority, department, action_title, rationale

不注入（按需追问时才加载）：
  - council_report.expert_analyses         ← 5 份完整专家报告（~4000 tokens）
  - intelligence_events P2                 ← 低优先级噪音信号
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

### 7.3 多轮对话调用架构

现有 `dashscope.py` 的 `_chat_json` 只支持单轮（system + 一条 user）。Agent Chat 需要在 `dashscope.py` 中**新增一个多轮方法**：

```python
# dashscope.py 新增
def chat_json_multi_turn(
    self,
    *,
    system: str,                  # 完整 system prompt（含 DB 上下文，session 创建时构建）
    messages: list[dict],         # 完整对话历史 [{"role": "user"/"assistant", "content": ...}]
    model: str | None = None,
    temperature: float = 0.4,
) -> dict[str, Any]:
    """多轮对话调用，messages 为完整历史列表（不含 system）。"""
    full_messages = [{"role": "system", "content": system}] + messages
    # 同现有 _chat_json 的 retry 逻辑
    ...
```

**每轮对话的 messages 数组结构：**

```python
# Session 创建时（Turn 1）：
messages = [
    {"role": "system",    "content": SYSTEM_PROMPT_WITH_ALL_DB_CONTEXT},  # ← 固定，session 锁定
    {"role": "user",      "content": "90国免签终止对我们的影响有多大？"},
]

# Turn 2（追加历史）：
messages = [
    {"role": "system",    "content": SYSTEM_PROMPT_WITH_ALL_DB_CONTEXT},  # ← 不变
    {"role": "user",      "content": "90国免签终止对我们的影响有多大？"},
    {"role": "assistant", "content": '{"conclusion": "...", "evidence_ids": [44, 45], ...}'},
    {"role": "user",      "content": "那金价上涨的影响呢？"},              # ← 当前问题
]

# Turn 6+（滚动窗口，最多保留 6 轮）：
messages = [
    {"role": "system",    "content": SYSTEM_PROMPT_WITH_ALL_DB_CONTEXT},
    # 保留最近 6 轮 user/assistant 对
    {"role": "user",      "content": "..."},
    {"role": "assistant", "content": "..."},
    ...
    {"role": "user",      "content": "当前问题"},
]
```

**关键设计决策：**
- DB 上下文注入在 `system` 中，**session 创建时一次性构建，之后不再重新查询**
- `assistant` 的历史消息存储完整 JSON 字符串（前端可解析展示，LLM 也能理解）
- 6 轮滚动窗口足够维持对话连贯性，同时控制 token 用量

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

### Phase 0：上游落库（同事负责）

- [x] TH 市场已完成：intelligence_events×14 / market_snapshots×1 / daily_briefs×1 / council_reports×1 / action_items×7
- [ ] SG、JP 等其他市场待续

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
