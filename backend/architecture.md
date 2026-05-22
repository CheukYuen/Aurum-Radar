# Aurum Radar 后端架构设计文档

> 本文档合并并替代原 `mvp.md`（后端实现规格）与旧版 `architecture.md`（云基础设施 + 前后端分离）。
> 是后端开发、部署、前端联调的唯一架构依据。

---

## 1. 概述

**Aurum Radar** 是一个面向周大福海外市场的战略情报 Agent：定时抓取全球公开信息，抽取为结构化市场事件，判断机会与风险，生成每日战略简报与部门行动建议，并通过看板呈现。

后端职责：

```text
采集公开信息 → 清洗去重 → 抽取结构化事件 → 评分研判
→ 生成每日简报 → 生成部门行动建议 → 通过 JSON API 提供给前端
```

MVP 范围：

```text
市场：Singapore / Thailand / Japan
数据源：新闻搜索 / RSS、竞品官网、平台公告、法规公告、金价汇率、高端商场活动
不接入企业内部数据，只用公开信息
```

---

## 2. 设计原则

| 原则 | 含义 |
|---|---|
| 简洁高效 | 单体 FastAPI 应用 + 单库 PostgreSQL + 对象存储 OSS。MVP 不引入 Redis、消息队列、微服务、OpenSearch |
| 前后端分离 | 后端只产出 JSON API，前端是纯静态资源；Nginx 单入口同源，免 CORS |
| 云资源一致性 | 本地与云端**同一套** RDS / OSS / DashScope，只差 `.env` 与运行位置 |
| 来源可追溯 | 每个事件关联 `raw_document` 与 `source_url`，结论可回溯到原文 |
| 不过度工程化 | mock / seed 数据仅用于初始化、无网络 fallback、测试；**不作为主链路** |
| Agent 流水线化 | 采集→简报拆成独立、幂等、可单独运行的阶段，由调度器串联 |

**严禁**：SQLite、本地文件存储、MockLLM 作为主运行分支；不在代码里判断"本地/云端"或写死内外网地址（一律由 `.env` 决定）。

---

## 3. 技术栈

```text
语言运行时   Python 3.11+
Web 框架     FastAPI（ASGI）+ Uvicorn
ORM / 迁移   SQLAlchemy 2.x + Alembic
配置         pydantic-settings
调度         APScheduler
HTTP / 抓取  httpx、BeautifulSoup4
LLM          openai SDK（DashScope OpenAI 兼容接口）
对象存储     oss2
数据库驱动   psycopg2-binary
日志         loguru
部署         Docker + Docker Compose + Nginx
```

云服务：阿里云 RDS PostgreSQL、阿里云 OSS、百炼 DashScope。具体已开通资源见 **附录 A**。

---

## 4. 系统架构

### 4.1 部署拓扑

```text
                       浏览器（React SPA 看板）
                              │  HTTP，/api/* 每 30–60s 轮询
                              ▼
        ┌──────────────── ECS · Nginx :80 ────────────────┐
        │   /        → 前端静态资源（HTML / JSX / CSS）     │
        │   /api/*   → 反向代理到 Uvicorn :8000             │
        └───────────────────────┬──────────────────────────┘
                                 ▼
          ┌─────────── 后端进程（同一镜像，三种角色）──────────┐
          │  web        Uvicorn + FastAPI，提供 REST API       │
          │  scheduler  APScheduler，按 cron 触发 Agent 流水线  │
          │  worker     执行 Agent 各阶段（采集/抽取/简报…）    │
          └───────┬───────────────┬───────────────┬──────────┘
                  ▼               ▼               ▼
        RDS PostgreSQL        阿里云 OSS       百炼 DashScope
        （结构化数据）        （原文/快照/导出）（LLM 抽取/简报/行动）
```

### 4.2 组件职责

| 组件 | 职责 |
|---|---|
| Nginx | 单入口；托管前端静态文件；`/api/*` 反代到后端；可选 SSE 透传 |
| FastAPI (web) | 暴露 JSON API，只读 RDS 返回数据；手动触发任务入口 |
| Scheduler | 按计划触发 Agent 流水线；MVP 用 APScheduler，受 `SCHEDULER_ENABLED` 控制 |
| Worker | 实际执行 Agent 各阶段；与 web 共用代码与镜像 |
| RDS PostgreSQL | 唯一业务库：原始文档元数据、事件、研判、简报、行动、任务记录 |
| OSS | 大文件：网页快照、PDF、截图、导出文件。Bucket 私有，前端经签名 URL 访问 |
| DashScope | 事件抽取、简报生成、行动建议生成、向量化（全部 API 调用，本机不部署模型） |

> MVP 阶段 web / scheduler / worker 可以是同一容器内的不同启动命令；数据量上来后再拆。

---

## 5. 环境设计（一致性）

`local / dev / prod` 只代表**运行位置与配置差异**，不代表技术栈差异。

| 环境 | 运行位置 | RDS 地址 | OSS Endpoint | 调度 |
|---|---|---|---|---|
| local | 本地电脑 | RDS 公网地址 | OSS 公网 Endpoint | `SCHEDULER_ENABLED=false`，手动触发 |
| dev | ECS 测试 | RDS 内网地址 | OSS 内网 Endpoint | 可开启 |
| prod | ECS 正式 | RDS 内网地址 | OSS 内网 Endpoint | `SCHEDULER_ENABLED=true` |

要求：

```text
本地开发 = 本地跑代码 + 连云端 RDS / OSS / DashScope
云端部署 = ECS 跑代码 + 连同一套 RDS / OSS / DashScope
切换环境只改 .env，永不改代码
```

---

## 6. 前后端分离 API 设计（核心）

### 6.1 设计约定

```text
前缀        所有接口以 /api 开头（API_PREFIX）
风格        REST，资源化，标准 HTTP 状态码
数据格式    请求 / 响应均为 JSON（UTF-8）
分页        列表接口支持 ?page=1&size=20，返回 { items, total, page, size }
筛选        通过 query 参数（market / event_type / priority / department …）
错误        非 2xx 返回 { "error": { "code": "...", "message": "..." } }
时间        ISO 8601 字符串（UTC）
鉴权        MVP 不做鉴权（内部 Demo）；预留 Header 注入位
```

前端与后端唯一耦合点就是这份契约。前端不含任何业务数据，挂载时 `fetch('/api/...')` 取数。

### 6.2 接口清单（映射到 4 个前端页面）

| 接口 | 方法 | 对应页面 / 用途 |
|---|---|---|
| `/api/health` | GET | 健康检查（DB / OSS / DashScope 连通性） |
| `/api/dashboard/summary` | GET | 概览页：核心指标卡片（重点事件数、高风险数、高机会市场、待处理行动） |
| `/api/overview` | GET | 概览页：世界地图各国机会 / 风险节点 |
| `/api/markets/{market}` | GET | 概览页：选中国家的国家级摘要（综合指数、亮点） |
| `/api/markets/{market}/districts` | GET | 地图洞察页：国家内部商圈节点 |
| `/api/markets/{market}/strategy-sandbox` | GET | 战略沙盘推演结果（策略库匹配 + 上中下三策，见 §17） |
| `/api/districts/{district_id}` | GET | 地图洞察页：商圈详情与建议动作 |
| `/api/events` | GET | 情报中心：事件列表，支持 `market / event_type / priority / impact_type` 筛选 + 分页 |
| `/api/events/{event_id}` | GET | 情报中心：事件详情 + 来源引用 |
| `/api/brief/latest` | GET | 每日战略简报（最新一期） |
| `/api/briefs/{brief_date}` | GET | 指定日期简报 |
| `/api/actions` | GET | 行动建议看板，支持 `department / priority / market` 筛选 |
| `/api/actions/{action_id}` | GET | 行动清单详情 |
| `/api/jobs/status` | GET | 定时任务 / 流水线状态（前端轮询用） |
| `/api/jobs/run` | POST | 手动触发 Agent 流水线（MVP 的「手动触发抓取」按钮） |

### 6.3 关键响应结构（示例）

`GET /api/overview`：

```json
{
  "as_of": "2026-05-21T08:00:00Z",
  "markets": [
    { "market": "Singapore", "region": "Southeast Asia", "tier": 1,
      "opportunity_score": 82, "risk_score": 35, "headline": "高端礼赠需求增强" },
    { "market": "Thailand", "region": "Southeast Asia", "tier": 1,
      "opportunity_score": 76, "risk_score": 41, "headline": "旅游零售恢复" }
  ]
}
```

`GET /api/events?market=Thailand&page=1&size=20`：

```json
{
  "items": [
    { "event_id": 101, "market": "Thailand", "event_type": "channel",
      "title": "Siam Paragon 高端珠宝活动热度上升", "summary": "...",
      "impact_type": "opportunity", "priority": "P1", "confidence": "medium",
      "opportunity_score": 78, "risk_score": 40,
      "source_url": "https://...", "published_at": "2026-05-20T09:30:00Z" }
  ],
  "total": 28, "page": 1, "size": 20
}
```

`POST /api/jobs/run`：

```json
// 请求
{ "markets": ["Singapore", "Thailand", "Japan"],
  "source_types": ["news", "competitor", "regulation"],
  "stages": ["ingest", "extract", "score", "forecast", "brief", "action"] }
// 响应
{ "job_run_id": 55, "status": "running", "started_at": "2026-05-21T10:00:00Z" }
```

### 6.4 实时数据策略

数据更新节奏：爬虫每 6 小时、每日简报 08:00 —— 本质不是秒级流。「实时」指**前端始终展示库内最新状态并自动刷新**。

```text
MVP：前端轮询。挂载拉一次全量，之后每 30–60s 轮询，刷新地图 / 事件流 / 行动看板。
     点「手动触发」后轮询 GET /api/jobs/status 直到完成再刷新。
增强：任务进度条 / 新情报弹窗 → 对该处单独加 SSE（FastAPI/ASGI 原生支持，Nginx 关缓冲透传）。
     双向通信场景本项目没有，不用 WebSocket。
```

---

## 7. Agent 工作流

### 7.1 流水线总览

Agent 是一条**分阶段、幂等、可单独运行**的流水线，由调度器按 cron 串联，也可经 `POST /api/jobs/run` 手动触发任意子集。

```text
[1 采集] → [2 清洗去重] → [3 抽取] → [4 评分] → [5 研判] → [6 简报] → [7 行动·战略沙盘 §17]
   每个阶段都向 job_runs 写入运行记录（开始/结束/影响行数/错误）
```

### 7.2 各阶段定义

| 阶段 | 输入 | 处理 | 输出 → 落库 |
|---|---|---|---|
| 1 采集 Ingest | 市场、关键词、Provider 配置 | 各 Provider 抓取公开信息，统一为 `RawDocumentCreate` | 内存对象列表 |
| 2 清洗去重 Clean | `RawDocumentCreate[]` | 正文清洗、语言识别、`content_hash` 去重、关键词相关性初筛 | `raw_documents` + 原文存 OSS（`oss_path`） |
| 3 抽取 Extract | 新增 `raw_documents` | 规则预分类候选 `event_type` → DashScope 结构化抽取 → JSON Schema 校验 | `intelligence_events` |
| 4 评分 Score | `intelligence_events` | 规则为主 + LLM 辅助：机会分 / 风险分 / 优先级 / 置信度 | 更新 `intelligence_events` |
| 5 研判 Forecast | 按市场聚合的当日事件 | DashScope 生成国家级综合研判（机会 / 风险 / 需关注） | `market_snapshots` |
| 6 简报 Brief | 当日事件 + 市场研判 | DashScope 生成每日战略简报（执行摘要 + 跨市场对比 + 重点事件） | `daily_briefs` |
| 7 行动 Action | 当日事件 + 市场研判 | 战略沙盘推演（§17）：变量 → 策略库匹配 → 候选方案 → 沙盘推演 → 上中下三策 → 派生行动 | `action_items`（推演中间结果 MVP 不落库） |

### 7.3 抽取阶段细节（第一版策略）

```text
规则预分类 + DashScope 抽取：
raw_document → keyword 初筛 → 判断候选 event_type
            → 调 DashScope 抽取结构化事件 → 校验 JSON schema → 入库
```

枚举值：

```text
event_type   competition / product / platform / social / regulation / pricing / channel / festival
impact_type  opportunity / risk / watch
priority     P0 / P1 / P2
confidence   high / medium / low
```

LLM 输出约束：尽量 JSON（`response_format=json_object`）、`temperature 0.2–0.4`、失败重试、失败记日志、不吞异常。

### 7.4 触发方式与可追溯性

```text
定时   APScheduler，新闻每 6h、简报每日 08:00（cron 见 §13）
手动   POST /api/jobs/run，可指定 markets / source_types / stages
记录   每个阶段每次运行写 job_runs：status / params / started_at / finished_at
       / rows_affected / error_message
追溯   event → raw_document → source_url / oss_path；brief / action → event_id
```

---

## 8. 数据模型

PostgreSQL，SQLAlchemy 2.x 定义，Alembic 迁移。核心 6 张表 + 1 张种子表。

```text
raw_documents       原始文档元数据（原文存 OSS）
intelligence_events 结构化市场事件（Agent 核心产物）
market_snapshots    国家级每日研判（机会/风险分 + 综合判断）
daily_briefs        每日战略简报
action_items        部门行动建议（由战略沙盘推演派生，见 §17）
job_runs            Agent 各阶段运行记录
districts            商圈种子数据（地图洞察页用，不参与流水线）
```

**raw_documents**

```text
id, source_type, source_name, market, region, title, summary, url,
published_at, fetched_at, language, raw_content, clean_content,
content_hash(唯一,去重), oss_path, credibility_level(S/A/B/C),
created_at, updated_at
```

**intelligence_events**

```text
id, market, region, event_type, title, summary, business_impact,
impact_type(opportunity/risk/watch), priority(P0/P1/P2), confidence,
opportunity_score(0-100), risk_score(0-100),
source_url, raw_document_id(FK), created_at, updated_at
```

**market_snapshots**

```text
id, market, region, snapshot_date, opportunity_score, risk_score,
overall_judgement, key_opportunities(jsonb), key_risks(jsonb),
watch_items(jsonb), event_count, created_at
```

**daily_briefs**

```text
id, brief_date(唯一), markets(jsonb), executive_summary,
opportunities(jsonb), risks(jsonb), watch_items(jsonb),
recommended_actions(jsonb), source_count, event_count,
created_at, updated_at
```

**action_items**

```text
id, market, department, priority(P0/P1/P2), action_title, action_detail,
reason, deadline, expected_output, success_metric,
status(pending/in_progress/done/ignored), event_id(FK),
created_at, updated_at
```

**job_runs**

```text
id, job_name, stage, trigger_type(scheduled/manual), status(running/success/failed),
params_json, started_at, finished_at, rows_affected, error_message, created_at
```

**districts**（种子数据：乌节路、滨海湾…，含门店数量、商圈画像）

```text
id, market, name, store_count, heat_level, profile(jsonb), created_at
```

关系：`intelligence_events.raw_document_id → raw_documents.id`；`action_items.event_id → intelligence_events.id`。
索引：`raw_documents.content_hash` 唯一；`intelligence_events(market, event_type, priority, created_at)`；`daily_briefs.brief_date` 唯一。
扩展：需要语义检索时 `CREATE EXTENSION vector;`，给文本表加 `embedding vector` 列（MVP 可不做）。

---

## 9. 代码结构与模块

```text
backend/
├── app/
│   ├── main.py                  # FastAPI 入口，挂载路由、中间件、生命周期
│   ├── api/                     # 路由层（仅做请求/响应，不写业务）
│   │   ├── routes_health.py
│   │   ├── routes_dashboard.py  # overview / summary / markets / districts
│   │   ├── routes_events.py
│   │   ├── routes_brief.py
│   │   ├── routes_actions.py
│   │   └── routes_jobs.py
│   ├── core/
│   │   ├── config.py            # pydantic-settings，读 .env
│   │   ├── logging.py           # loguru
│   │   └── errors.py            # 统一异常 → { error: {...} }
│   ├── database/
│   │   ├── session.py           # Engine / Session
│   │   ├── base.py
│   │   └── init_db.py           # 建表 / 灌种子数据
│   ├── models/                  # SQLAlchemy 模型（§8 七张表）
│   ├── schemas/                 # Pydantic 请求/响应模型
│   ├── services/                # 业务层 = Agent 各阶段
│   │   ├── ingestion/           # 阶段1-2：Provider + 清洗去重
│   │   ├── extraction/          # 阶段3：规则预分类 + LLM 抽取
│   │   ├── scoring/             # 阶段4：评分
│   │   ├── forecast/            # 阶段5：市场研判
│   │   ├── brief/               # 阶段6：简报生成
│   │   ├── strategy/            # 阶段7「行动」：战略沙盘推演 6 步（见 §17）
│   │   ├── action/              # 阶段7：从三策派生 action_items 落库
│   │   ├── storage/             # OSSStorageProvider
│   │   └── llm/                 # DashScopeLLMProvider
│   ├── scheduler/
│   │   ├── scheduler.py         # APScheduler 实例与启停
│   │   └── jobs.py              # job 定义，串联 services
│   └── utils/
├── alembic/                     # 迁移脚本
├── scripts/                     # 初始化 / 灌数据 / 手动跑流水线
├── tests/
├── docker/
│   ├── nginx.conf
│   └── gunicorn_conf.py
├── Dockerfile
├── docker-compose.yml           # 云端：nginx + backend + scheduler + worker
├── docker-compose.local.yml     # 本地：仅 backend
├── requirements.txt
├── .env.example
└── README.md
```

分层原则：`api` 只做协议转换 → `services` 写业务 → `models/database` 管持久化。`services` 各子目录一一对应 Agent 阶段，可独立调用与测试。

---

## 10. 数据采集 Provider 设计

统一 Provider 模式，所有 Provider 输出统一的 `RawDocumentCreate`，互不耦合，可逐个增减。

| Provider | 实现 | 监控对象 |
|---|---|---|
| NewsProvider | NewsAPIProvider / SerpAPIProvider / RSSProvider | 新闻、市场变化、竞品动态、消费趋势 |
| CompetitorProvider | SimpleWebPageProvider（+ Firecrawl placeholder） | Cartier、Tiffany、Van Cleef & Arpels、Pandora、周生生、六福 |
| PlatformPolicyProvider | 公告页抓取 | TikTok Shop / Shopee / Lazada 卖家中心公告（只抓公告，不抓商品） |
| RegulationProvider | 公告页抓取 | Singapore Customs、Enterprise Singapore、Japan METI、Thailand FDA |
| MarketDataProvider | API | GoldAPI（金价）、ExchangeRate API（汇率） |
| MallEventProvider | 活动页抓取 | Marina Bay Sands、Siam Paragon、ION Orchard |

约定：Provider 只负责"取回原始内容 + 基本元数据"，清洗、去重、相关性判断统一在阶段 2 处理。无法抓取的源（如社媒）MVP 用 seed 数据，但仅作展示补充，不进主链路。

---

## 11. 存储设计

**结构化数据进 RDS，大文件 / 原文 / 网页快照进 OSS。**

`OSSStorageProvider` 接口：

```python
class OSSStorageProvider:
    def save_text(self, path: str, content: str) -> str: ...      # 返回 oss_path
    def save_bytes(self, path: str, content: bytes) -> str: ...
    def get_signed_url(self, path: str, expires: int = 3600) -> str: ...
```

路径规则：

```text
raw_html/{market}/{yyyy-mm-dd}/{hash}.html
pdf/{market}/{yyyy-mm-dd}/{hash}.pdf
screenshots/{market}/{yyyy-mm-dd}/{hash}.png
exports/{yyyy-mm-dd}/{filename}
```

要求：Bucket 私有；前端访问文件一律由后端 `get_signed_url` 生成临时链接；不返回永久公开链接。Endpoint 由 `.env` 决定（本地公网 / 云端内网）。

---

## 12. LLM 集成（DashScope）

走百炼 DashScope 的 **OpenAI 兼容接口**（`openai` SDK，只改 `base_url`）。

`DashScopeLLMProvider` 接口：

```python
class DashScopeLLMProvider:
    def extract_event(self, document) -> dict: ...        # 阶段3
    def forecast_market(self, market, events) -> dict: ...# 阶段5
    def generate_brief(self, events, snapshots) -> dict: ...# 阶段6
    def generate_action_items(self, events) -> list: ...  # 阶段7
```

模型分级（成本控制）：

```text
规则预分类 / 轻量标签   qwen-flash
事件抽取 / 研判 / 简报 / 行动   qwen-plus
复杂推理（可选）        qwen-max
向量化（可选）          text-embedding-v3
```

事件抽取输出契约（JSON Schema 校验）：

```json
{
  "market": "Singapore", "region": "Southeast Asia",
  "event_type": "competition", "title": "", "summary": "",
  "business_impact": "", "impact_type": "opportunity",
  "priority": "P1", "confidence": "medium",
  "opportunity_score": 70, "risk_score": 30
}
```

要求：输出尽量 JSON、`temperature 0.2–0.4`、失败重试 + 退避、记录 token 与错误日志、不吞异常；注意 QPS / 每分钟 token 配额，批处理控制并发。多模态（分析门店 / 社媒图片）按需用原生 `dashscope` SDK，图片传 OSS 签名 URL。

---

## 13. 调度设计

APScheduler，受 `SCHEDULER_ENABLED` 控制（local 默认关、prod 默认开）。

| Job | 频率（cron） | 说明 |
|---|---|---|
| `fetch_public_sources_job` | 每 6 小时 | 阶段 1–2：采集 + 清洗去重 |
| `extract_events_job` | 每 6 小时（采集后） | 阶段 3–4：抽取 + 评分 |
| `daily_pipeline_job` | 每日 07:00 | 阶段 5–7：研判 + 简报 + 行动，08:00 前出当日简报 |

要求：每个 job 每个阶段写 `job_runs`（成功记 `rows_affected`，失败记 `error_message`）；所有 job 支持经 `POST /api/jobs/run` 手动触发；阶段幂等，可重跑。MVP 不引入 Celery / 消息队列，APScheduler + `job_runs` 表足够。

---

## 14. 前端整合方案

### 14.1 前端现状

`frontend/Aurum-Radar/` 是纯静态 React SPA：React 18 + Babel Standalone 从 CDN 加载，浏览器端实时编译 `.jsx`，无构建步骤、无 Node 运行时。页面文件：`overview.jsx / map-insight.jsx / intel.jsx / actions.jsx / shell.jsx / app.jsx`，入口 `Aurum Radar.html`。当前数据写死在 `.jsx` 里（mock）。

### 14.2 整合步骤（后续把静态页面整合出来）

```text
1. 入口 Aurum Radar.html 重命名为 index.html（带空格的文件名在 Nginx/URL 里别扭）
2. frontend 目录纳入部署：Nginx 挂载为静态根目录（见 §15 nginx.conf）
3. 各页面把写死的 mock 数据替换为挂载时 fetch('/api/...')，按 §6.2 契约取数
4. 顶部筛选器（时间/地区/品类）作为 query 参数透传给各接口
5. 同源部署（Nginx 单入口），不需要 CORS
6. 文件类资源（PDF/截图）用后端返回的签名 URL 展示
```

### 14.3 页面 → 接口映射

| 前端页面 | 调用接口 |
|---|---|
| `overview.jsx` 概览 | `GET /api/dashboard/summary`、`GET /api/overview`、`GET /api/markets/{market}`、`GET /api/brief/latest` |
| `map-insight.jsx` 地图洞察 | `GET /api/markets/{market}/districts`、`GET /api/districts/{id}` |
| `intel.jsx` 情报中心 | `GET /api/events`（带筛选 + 分页）、`GET /api/events/{id}` |
| `actions.jsx` 行动建议 | `GET /api/actions`（按部门筛选）、`GET /api/actions/{id}` |
| `shell.jsx` 顶栏/触发 | `GET /api/jobs/status`、`POST /api/jobs/run` |

> 可选演进：MVP 后若需要更强工程化，可把 build-less SPA 迁到 Vite 构建产物，部署方式不变（仍是 Nginx 托管静态文件 + 反代）。MVP 不要求。

---

## 15. 部署

### 15.1 Nginx（单入口）

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;       # 前端静态文件
    index index.html;

    location /api/ {                  # 反代到 Uvicorn(FastAPI)
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    location /api/stream {            # SSE（如启用）：关闭缓冲
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_read_timeout 3600s;
    }
    location / { try_files $uri $uri/ /index.html; }  # SPA 兜底
}
```

### 15.2 Docker Compose

```text
docker-compose.local.yml   只起 backend（连云端 RDS 公网 / OSS 公网）
docker-compose.yml         起 nginx + backend + scheduler + worker（连内网）
```

```yaml
# docker-compose.yml（云端）
services:
  nginx:
    image: nginx
    ports: ["80:80"]
    volumes:
      - ./frontend:/usr/share/nginx/html:ro
      - ./docker/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on: [backend]
  backend:
    image: aurum-radar-backend
    command: gunicorn -k uvicorn.workers.UvicornWorker app.main:app -b 0.0.0.0:8000
    env_file: [.env]
  scheduler:
    image: aurum-radar-backend
    command: python -m app.scheduler.scheduler
    env_file: [.env]
  worker:
    image: aurum-radar-backend
    command: python -m app.scheduler.jobs        # 或 worker 入口
    env_file: [.env]
```

后端三个服务共用同一镜像，靠 `command` 区分角色。FastAPI 用 Uvicorn worker；生产由 Gunicorn 管理。
本地开发：本地只跑 backend，直连云端 RDS 公网地址 + OSS 公网 Endpoint + DashScope；`SCHEDULER_ENABLED=false`，靠 `POST /api/jobs/run` 手动触发。

---

## 16. 实施优先级与验收标准

### 16.1 优先级

```text
P0  配置系统、数据库连接、模型、API 骨架，本地可连云资源跑通
P1  OSSStorageProvider、DashScopeLLMProvider、Provider 框架
P2  Agent 流水线：采集 / 抽取 / 评分 / 研判 / 简报 / 行动
P3  APScheduler、job_runs、Docker Compose、Nginx、前端联调
P4  真实数据源增强、向量检索、SSE
```

### 16.2 验收标准

```text
1. 本地运行 FastAPI 可连接阿里云 RDS PostgreSQL
2. 本地可把 raw_html 写入 OSS，并能生成签名 URL
3. 本地可调用 DashScope 抽取结构化事件
4. POST /api/jobs/run 可手动触发 Agent 流水线
5. GET /api/events / brief/latest / actions / overview 返回真实库内数据
6. 前端 4 个页面能从 /api/* 取数渲染（不再依赖 mock）
7. ECS 部署只改 .env 不改代码，使用 RDS / OSS 内网地址
8. 每次流水线运行在 job_runs 留有可追溯记录
```

---

## 17. 战略沙盘推演（阶段 7「行动」算法升级）

> 本节整合 `backend/strategy.md` 的需求。strategy.md 是任务说明，本节是经架构对齐后的正式设计依据。

### 17.1 定位

§7 主流水线的**阶段 7「行动」目前太泛**——当前实现是「高优先级事件 → LLM + 部门模板 → 部门任务」，产出常沦为「市场部做营销 / 法务部看合规」这类正确但无信息量的建议。

战略沙盘推演是**对阶段 7 的算法层面升级**，不是独立 Agent、不另起流程：**在同一条主流水线里**，把「行动」这一步从「一步出建议」改成「先推演、后出建议」——

```text
旧 阶段7：高优先级事件 ──────────────────────────────► 部门行动（太泛）
新 阶段7：当日事件 + 市场研判
          → 战略变量 → 策略库匹配 → 候选方案 → 沙盘推演
          → 评分排序 → 上中下三策 → 派生具体行动
```

先执行策略推演，再从选定策略的阶段行动路径派生 `action_items`。每条行动都能回溯「因为哪些信号 → 得到哪些变量 → 匹配哪些计策 → 所以这个动作」，从泛泛建议变成可解释、可比较、可验证的战略动作。

设计原则（与 §2 一致）：

- **不让大模型从情报直接跳到建议**——拆成「抽变量 → 匹配策略 → 组合方案 → 推演 → 排序 → 三策」六步，每步可单独检查、可单独重跑。
- **规则与 LLM 分工**：变量抽取 / 方案组合 / 推演 / 三策由 LLM；策略匹配、排序权重由规则。
- **策略库是结构化知识**，独立成模块，不散落在某个大 prompt 里（与 taxonomy 同思路）。
- 复用现有能力：`DashScopeLLM`（§12）、规则优先（§2）、按市场聚合（§7 forecast）、JSONB 重表（§8）。不新增基础设施、不接新库、不另起独立项目。

### 17.2 在 Agent 流程中的位置

战略沙盘推演是**主流水线阶段 7 的内部算法**，随每日 `daily_pipeline_job`（§13）运行，不是旁路、不是独立 Agent：

```text
§7 主流水线：
[1采集][2清洗][3抽取][4评分][5研判][6简报] ─► [7 行动 = 战略沙盘推演]

阶段 7 内部（按市场逐个推演）：
intelligence_events + market_snapshot
  → 1 战略变量抽取
  → 2 策略库匹配        ← 策略库位于「变量之后、推演之前」
  → 3 候选方案组合
  → 4 沙盘推演
  → 5 评分排序
  → 6 上中下三策
  → 从三策派生 action_items（落库）；六步推演的中间结果 MVP 不落库
```

术语对齐：strategy.md 的「market signals / 清洗后的市场情报」即本项目的 `intelligence_events`，**不另设 signals 概念**；`supporting_event_ids` 一律指向 `intelligence_events.id`。strategy.md 要求「为泰国补 8-12 条信号」，即「确保泰国有足够 `intelligence_events`」，由主流水线 / seed 产出。

### 17.3 六步子流程

| 步 | 名称 | 处理 | 规则 / LLM |
|---|---|---|---|
| 1 | 变量抽取 | 把市场 events + snapshot 判读为战略变量，**只判变量不给建议** | LLM |
| 2 | 策略匹配 | 规则打分匹配策略库 → LLM 解释适配理由 | 规则 + LLM |
| 3 | 方案组合 | 基于匹配策略组合 3-5 个候选战略方案 | LLM |
| 4 | 沙盘推演 | 推演每个方案的消费者 / 竞品 / 渠道 / 合规反应与短中期结果 | LLM |
| 5 | 评分排序 | LLM 评 7 维分 + 规则权重算综合分排序 | LLM + 规则 |
| 6 | 三策生成 | 排序结果转上策 / 中策 / 下策 + 阶段行动路径 + 验证指标 | LLM |

每步幂等、可单独重跑（与 §7 一致）。

### 17.4 策略库

结构化知识，作代码内常量模块（与 taxonomy 同思路），路径见 §17.10。MVP 收录 12 条策略：

```text
轻骑探路  借港登岸  避实击虚  文化定锚  小金引玉  华圈破冰
先声后店  高地占位  婚庆结盟  可退可进  避钻攻金  节庆爆点
```

每条策略字段：

```text
strategy_id          策略英文标识
strategy_name        策略名（中文）
classical_source     对应兵法 / 三十六计意象（谋士叙事，差异化亮点）
business_meaning     商业含义
suitable_conditions  适配条件 { 变量名: [允许取值] }
avoid_conditions     规避条件 { 变量名: [危险取值] }
recommended_actions / expected_benefits / key_risks
validation_metrics / example_use_case
```

`suitable_conditions` / `avoid_conditions` 的键必须是 §17.5 的战略变量名——这是匹配器（§17.6）能用规则计算的前提。

### 17.5 战略变量

14 个变量，取值统一 `low / medium / high / unknown`：

```text
market_attractiveness   competition_intensity   brand_awareness
cultural_fit            channel_maturity        regulatory_risk
trial_cost              time_window             localization_difficulty
strategic_reversibility chinese_community_base  wedding_demand
social_buzz_strength    pricing_pressure
```

每个变量保留判断依据（可追溯，呼应 §2）：

```json
{ "value": "high", "confidence": 0.82,
  "reasoning": "...", "supporting_event_ids": [101, 102] }
```

与 §7 forecast 的关系：`market_snapshot` 的 opportunity / risk 是粗粒度判断，战略变量是细粒度分解；snapshot 作变量抽取的背景输入，二者不冲突。

### 17.6 策略匹配器

轻量规则匹配器，简单稳定优先，不引入复杂算法：

```text
对每条策略：score = 0
  变量取值命中 suitable_conditions  → score += 1
  变量取值命中 avoid_conditions    → score -= 2
按 score 取 Top 5-8，每条输出 match_score / matched_variables / risk_flags
```

匹配是规则；「为什么适配」的解释由 LLM 补（§17.8 Prompt 2）。

### 17.7 持久化策略

**MVP 阶段战略推演的中间结果不落库**——`variables / matched_strategies / candidate_plans / ranked_plans / three_strategies` 不建专表，由阶段 7 在内存中产出、经 API（§17.9）即时返回。不新增第 8 张表，数据模型维持 §8 的 7 张。

唯一落库的是从三策派生的 `action_items`（沿用 §8 已有表）。**关键：部门不是固定清单。** 行动由「选定策略 → 该策略的 `recommended_actions`」生成，每条行动的 `department` 是「该动作天然归属的团队」；某部门只有被策略行动命中时才出任务——策略没涉及的部门不产生任何任务，**不做「每个部门凑一条」的填充**（区别于按部门模板逐部门出任务的旧做法）。每条行动可在 `extra` 里带 `strategy_id` / `plan_id` 与推理链摘要，保留「行动 → 计策 → 变量 → 事件」回溯。

后续如需留存历史推演、做跨期对比，再按 §8 风格补一张 `strategy_sandbox`（JSONB 重表，one row per market/run_date）——MVP 不做。

### 17.8 LLM Prompts

按 §12 的 JSON 输出约束（`response_format=json_object`、temperature 0.2-0.4、失败重试），新增 5 个 prompt，集中放 §17.10 的 `strategy/prompts.py`，不混进 §12 通用方法：

| Prompt | 步 | 关键约束 |
|---|---|---|
| signal_to_variables | 1 | 只判变量不给建议；每变量带 value / confidence / reasoning / supporting_event_ids |
| strategy_matching | 2 | 不得编造策略库不存在的 strategy_id；输出 matched_variables / why_applicable / potential_conflict / recommended_priority |
| scenario_simulation | 3-4 | 组合 3-5 方案并推演；必须体现策略库思想，不能只写「开店 / 快闪 / 观察」 |
| strategy_ranking | 5 | 7 维评分；risk_exposure / investment_cost / execution_difficulty 为负向，综合分需反向处理；维度权重由规则配置 |
| three_strategies | 6 | 上 / 中 / 下策；每策含核心逻辑、匹配策略、收益、风险、适用前提、0-3 / 3-6 / 6-12 月行动路径、验证指标。行动路径中每个动作只标注**真正涉及的部门**，未涉及的部门不生成任务 |

排序的 7 维权重作规则配置（与 taxonomy 评分权重同思路），LLM 只评单维分，综合分由规则算——保证排序可解释。

### 17.9 API

沿用 §6 REST 风格：

```text
GET /api/markets/{market}/strategy-sandbox   即时运行该市场战略推演并返回完整结果
```

因 MVP 不落库（§17.7），该接口**即时计算**：调用时跑一遍六步推演，返回 `situation_summary / strategic_variables / matched_strategies / candidate_plans / ranked_plans / three_strategies`。约 5 次 LLM 调用、有秒级延迟，前端按加载态处理；也可作为 `/api/markets/{market}` 详情里的一个 `strategy_sandbox` 字段。后续落库后改为读库即可。

### 17.10 代码结构

按 §9 风格，阶段 7「行动」的实现落在 `services/strategy/` 子包（一职责一文件），取代旧的简单 `services/action/` 生成器：

```text
backend/app/services/strategy/
├── library.py     # 策略库（§17.4，12 条策略结构化常量）
├── variables.py   # 步1：战略变量抽取（LLM）
├── matcher.py     # 步2：规则匹配器（§17.6）
├── simulator.py   # 步3-4：方案组合 + 沙盘推演（LLM）
├── ranker.py      # 步5：评分排序（LLM 评分 + 规则权重）
├── strategist.py  # 步6：上中下三策（LLM）
├── prompts.py     # §17.8 的 5 个 prompt
└── sandbox.py     # 阶段7 编排器：串 6 步 → 派生 action_items（中间结果 MVP 不落库）
```

### 17.11 前端

按 §14 现状，不重做 UI、不大改页面结构：把市场详情页原「行动建议 / 沙盘推演」区域替换为沙盘结果——当前局势判断 → 关键战略变量卡片 → Top 5 匹配策略 → 候选方案推演 → 上中下三策（含阶段行动路径与验证指标）。

### 17.12 实施建议

```text
- 它是阶段 7 的算法升级，随每日 daily_pipeline_job 运行（§13），不在 6h 高频
  cron；单市场约 5 次 LLM 调用，3 个 MVP 市场每日一轮，成本可控。
- MVP 聚焦单一市场做深（建议泰国，PRD §5.3 已给信号方向），跑通
  「情报 → 变量 → 匹配 → 方案 → 推演 → 三策 → 行动」一条链。
- 它是 demo 的差异化亮点（呼应赛题「更前瞻 / 创新的 Agent 设计」），把阶段 7
  从泛泛建议升级为可解释、可比较、可验证的战略动作。
- 依赖主流水线先产出 intelligence_events —— 实施顺序排在主流水线落库之后。
```

---

## 附录 A：已开通的云资源与连接信息

```text
地域            阿里云 新加坡 ap-southeast-1（ECS / RDS / OSS 全部同地域同 VPC）

ECS             2 vCPU / 4 GiB（ecs.e-c1m2.large），Ubuntu 22.04 LTS，x86
                系统盘 ESSD Entry 40GB；公网带宽 按量峰值 5 Mbps；按量付费
                安全组入方向：22(限本人IP) / 80 / 443；8000 不对外，走 Nginx 反代

RDS PostgreSQL  实例 pgm-t4nrl3s1kv94f574，PostgreSQL 17，基础系列单节点，2核2G
                内网地址 pgm-t4nrl3s1kv94f574.pgsql.singapore.rds.aliyuncs.com
                内网 IP 172.17.57.139，端口 5432
                白名单加 ECS 内网 IP（172.17.x.x 段）；本机调试临时加公网 IP
                数据库 aurum_radar；连接用域名不用 IP

OSS             Bucket aurum-radar-demo，标准存储，私有 ACL
                内网 Endpoint oss-ap-southeast-1-internal.aliyuncs.com（ECS 用）
                公网 Endpoint oss-ap-southeast-1.aliyuncs.com（本机调试用）

DashScope       新加坡国际站，OpenAI 兼容接口
                base_url https://dashscope-intl.aliyuncs.com/compatible-mode/v1
                模型 qwen-flash / qwen-plus / qwen-max、text-embedding-v3
```

---

## 附录 B：`.env` 配置参考

```env
APP_ENV=local                       # local / dev / prod
APP_NAME=Aurum Radar
APP_DEBUG=true
API_PREFIX=/api

# 数据库（local 用 RDS 公网地址，prod 用内网地址）
DATABASE_URL=postgresql+psycopg2://USER:PASSWORD@HOST:5432/aurum_radar

# OSS（local 用公网 Endpoint，prod 用内网 Endpoint）
OSS_ACCESS_KEY_ID=
OSS_ACCESS_KEY_SECRET=
OSS_BUCKET=aurum-radar-demo
OSS_ENDPOINT=https://oss-ap-southeast-1.aliyuncs.com

# DashScope
DASHSCOPE_API_KEY=
DASHSCOPE_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
DASHSCOPE_MODEL_EXTRACT=qwen-plus
DASHSCOPE_MODEL_SUMMARY=qwen-plus
DASHSCOPE_MODEL_ACTION=qwen-plus

# 数据源（按需）
NEWS_API_KEY=
SERPAPI_API_KEY=
GOLD_API_KEY=
EXCHANGE_RATE_API_KEY=

# 调度（local 关，prod 开）
SCHEDULER_ENABLED=false
```

约定：代码只读 `DATABASE_URL` / `OSS_ENDPOINT` / `DASHSCOPE_BASE_URL`，不在代码里判断本地还是云端，不写死内外网地址 —— 环境差异全部由 `.env` 承担。
