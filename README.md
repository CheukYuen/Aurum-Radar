# Aurum Radar · 全球市场战略情报 Agent

面向高级珠宝品牌的海外市场战略情报系统。后端通过多 Agent 流水线对外部信号进行采集、清洗、抽取、打分、预测，并由「珠宝情报议会」（5 位专家 + 首席战略官）合成每日战略简报与部门行动建议；前端以世界地图为入口，可视化呈现各市场判断、情报事件流与行动看板。

---

## 项目说明

仓库为单体多模块结构，各目录独立可运行：

| 目录 | 说明 |
|------|------|
| `backend/` | FastAPI 服务，承载 7 阶段情报流水线与 JSON API |
| `frontend/` | Vite + React + TypeScript 单页应用，战略情报看板 |
| `data_probe/` | 数据采集探针，输出 JSONL 至 `output/normalized/`（独立 venv） |
| `agent/` | Agent 相关原型、提示词与实验脚本 |
| `design/` | 设计稿与视觉规范 |
| `prd/` | 产品需求文档 |

### 7 阶段流水线（后端核心）

```
Ingest → Clean → Extract → Score → Forecast → Brief → Council
 采集    清洗    抽取     打分     预测       简报     议会（合成行动）
```

第 7 阶段「珠宝情报议会」并联运行 5 位专家（产品营销 / 竞品战略 / 消费者洞察 / 风险合规 / 兵法谋士），再由首席战略官汇总输出 `council_reports` 与 `action_items`。详见 [backend/architecture.md](backend/architecture.md)。

### 前端页面

- **概览** Overview — 世界地图 + 国家判断面板 + 每日战略简报抽屉
- **情报中心** Intel — 情报事件流与详情
- **行动建议** Actions — 部门行动清单与详情
- **Agent Chat** — 右滑抽屉，针对当日判断进行追问

---

## 依赖环境

### 后端
- Python **>= 3.9**（推荐 3.11）
- PostgreSQL（建议直接使用阿里云 RDS）
- 阿里云 OSS（可选，MVP 阶段未启用写入）
- 百炼 DashScope API Key（调用 `qwen-flash` / `qwen-plus` / `qwen-max`）
- 包管理：[uv](https://github.com/astral-sh/uv)（推荐）或 `pip`
- 主要库：FastAPI 0.115 · Uvicorn 0.32 · SQLAlchemy 2.0 · Alembic 1.14 · psycopg2 · APScheduler 3.10 · OpenAI SDK 1.55 · loguru · oss2 · stevedore

### 前端
- Node.js **>= 18**（推荐 20+）
- npm（或兼容的 pnpm / yarn）
- 主要库：React 18 · TypeScript 5.6 · Vite 6 · Tailwind CSS 3.4

---

## 安装步骤

```bash
git clone https://github.com/<your-org>/Aurum-Radar.git
cd Aurum-Radar
```

### 1. 后端

```bash
cd backend

# 推荐：使用 uv 按 uv.lock 同步依赖
uv sync
source .venv/bin/activate

# 或：传统方式
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

配置环境变量：

```bash
cp .env.example .env
```

至少填写以下字段：

| 字段 | 说明 |
|------|------|
| `DATABASE_URL` | `postgresql+psycopg2://USER:PASSWORD@HOST:5432/aurum_radar` |
| `DASHSCOPE_API_KEY` | 百炼 DashScope Key |
| `OSS_ACCESS_KEY_ID` / `OSS_ACCESS_KEY_SECRET` | 阿里云 OSS 密钥（可选） |
| `DATA_PROBE_OUTPUT_DIR` | data_probe 输出目录，默认 `../data_probe/output/normalized` |

> ⚠️ 务必在项目 `.venv` 内运行，避免使用 Homebrew/系统 Python，否则会缺少 `stevedore`、`apscheduler` 等依赖。

应用数据库迁移（如需）：

```bash
alembic upgrade head
```

### 2. 前端

```bash
cd frontend
npm install
```

前端开发模式下，`/api/*` 请求会通过 `vite.config.ts` 代理到 `http://localhost:8000`。

---

## 使用方法

### 启动后端 API

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

- API 文档：http://localhost:8000/docs
- 健康检查：http://localhost:8000/api/health（返回 `{"status":"ok","db":"connected"}`）

### 启动前端

```bash
cd frontend
npm run dev        # http://localhost:5173
npm run build      # 生产构建（tsc -b && vite build）
npm run preview    # 本地预览生产产物
```

### 运行流水线

```bash
# 摄取 data_probe 爬取数据到 RDS
python -m scripts.ingest_crawl_data                     # 摄取今天
python -m scripts.ingest_crawl_data --date 2026-05-23
python -m scripts.ingest_crawl_data --all
python -m scripts.ingest_crawl_data --dry-run

# 基于 RDS 已有 raw_documents 跑 Stage 3-6 + Council + Evaluation
python -m scripts.run_council
#   --market Singapore        仅跑指定市场
#   --since 30d               最近 N 天
#   --until 2026-05-22        截止日期
#   --limit 50                文档数量上限
#   --no-evaluation           跳过评估
```

### 通过 API 手动触发流水线

```bash
curl -X POST http://localhost:8000/api/jobs/run \
  -H "Content-Type: application/json" \
  -d '{"markets": ["Singapore"], "stages": ["ingest", "extract"]}'
```

`SCHEDULER_ENABLED` 本地默认 `false`，定时任务不会自动触发；需要时使用上述 API 或脚本入口手动触发。

---

## 常见问题

| 报错 | 处理 |
|------|------|
| `ModuleNotFoundError: stevedore` / `apscheduler` / `oss2` | 未激活 `.venv`，执行 `source backend/.venv/bin/activate` 或 `uv sync` |
| `/api/health` 返回 `db: disconnected` | 检查 `.env` 的 `DATABASE_URL` 与 RDS 白名单 |
| DashScope 启动报错 | 确认 `DASHSCOPE_API_KEY` 已正确配置 |
| 前端接口 404 / 跨域 | 确认后端已在 8000 端口运行，`vite.config.ts` 代理生效 |

---

## 子模块文档

- 后端详细说明：[backend/README.md](backend/README.md)
- 前端详细说明：[frontend/README.md](frontend/README.md)
- 架构与接口契约：[backend/architecture.md](backend/architecture.md)
