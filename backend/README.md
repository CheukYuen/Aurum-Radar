# Aurum Radar Backend

FastAPI + Uvicorn 后端，提供 JSON API 供前端调用。

技术栈：FastAPI · Uvicorn · SQLAlchemy 2.x · PostgreSQL · APScheduler · DashScope

---

## 本地运行

### 1. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

打开 `.env`，至少填写以下字段才能启动：

| 字段 | 说明 |
|------|------|
| `DATABASE_URL` | RDS PostgreSQL 公网地址，格式：`postgresql+psycopg2://USER:PASSWORD@HOST:5432/aurum_radar` |
| `OSS_ACCESS_KEY_ID` / `OSS_ACCESS_KEY_SECRET` | 阿里云 OSS 密钥 |
| `DASHSCOPE_API_KEY` | 百炼 DashScope API Key |

其余字段有默认值，可按需修改。`SCHEDULER_ENABLED` 本地默认 `false`，不会自动触发定时任务。

### 3. 启动服务

```bash
uvicorn app.main:app --reload --port 8000
```

服务启动后：

- API 文档：`http://localhost:8000/docs`
- 健康检查：`http://localhost:8000/api/health`（会真正连接 RDS，返回 `{"status": "ok", "db": "connected"}`）

---

## 项目结构

```
backend/
├── .env.example          # 环境变量模板
├── requirements.txt      # Python 依赖
└── app/
    ├── main.py           # FastAPI 入口，挂载路由与异常处理
    ├── core/
    │   └── config.py     # 读取 .env 的全局配置（pydantic-settings）
    ├── database/
    │   └── session.py    # 数据库 Engine / Session / get_db 依赖
    └── api/
        ├── routes_health.py     # GET /api/health
        ├── routes_dashboard.py  # GET /api/overview, /api/markets/{market} 等
        ├── routes_events.py     # GET /api/events, /api/events/{id}
        ├── routes_brief.py      # GET /api/brief/latest, /api/briefs/{date}
        ├── routes_actions.py    # GET /api/actions, /api/actions/{id}
        └── routes_jobs.py       # GET /api/jobs/status, POST /api/jobs/run
```

---

## API 接口

| 接口 | 方法 | 状态 | 说明 |
|------|------|------|------|
| `/api/health` | GET | 已实现 | 健康检查，验证 DB 连通性 |
| `/api/dashboard/summary` | GET | 待实现 | 概览页核心指标 |
| `/api/overview` | GET | 待实现 | 世界地图各市场节点 |
| `/api/markets/{market}` | GET | 待实现 | 国家级摘要 |
| `/api/markets/{market}/districts` | GET | 待实现 | 商圈节点列表 |
| `/api/districts/{district_id}` | GET | 待实现 | 商圈详情 |
| `/api/events` | GET | 待实现 | 情报事件列表（支持筛选 + 分页） |
| `/api/events/{event_id}` | GET | 待实现 | 事件详情 |
| `/api/brief/latest` | GET | 待实现 | 最新每日战略简报 |
| `/api/briefs/{brief_date}` | GET | 待实现 | 指定日期简报 |
| `/api/actions` | GET | 待实现 | 行动建议看板 |
| `/api/actions/{action_id}` | GET | 待实现 | 行动详情 |
| `/api/jobs/status` | GET | 待实现 | 流水线运行状态 |
| `/api/jobs/run` | POST | 待实现 | 手动触发 Agent 流水线 |

完整接口契约见 [architecture.md](./architecture.md) 第 6 节。

---

## 手动触发流水线（开发阶段）

本地 `SCHEDULER_ENABLED=false`，定时任务不会自动运行。实现 `POST /api/jobs/run` 后，可通过以下方式手动触发：

```bash
curl -X POST http://localhost:8000/api/jobs/run \
  -H "Content-Type: application/json" \
  -d '{"markets": ["Singapore"], "stages": ["ingest", "extract"]}'
```

---

## 详细架构

见 [architecture.md](./architecture.md)。
