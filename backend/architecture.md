Demo 级别我建议别上复杂架构，直接用 **ECS + RDS PostgreSQL + OSS + 百炼 + SLS**。够跑一个「海外市场战略情报系统」闭环。

# 推荐默认配置

## 方案 A：最推荐，Demo 稳一点

| 产品 | 推荐配置 | 用途 |
|---|---|---|
| ECS | 2 vCPU / 4 GiB，经济型 e 或共享型 s6 | 跑 Flask + Gunicorn、爬虫、调度器、轻量 worker |
| 系统盘 | ESSD Entry / ESSD PL0，40-80GB | 放代码、Docker、日志缓存 |
| 带宽 | 3-5 Mbps 固定带宽 | 前端访问、API 调用、爬虫访问 |
| RDS PostgreSQL | 2 核 2GB 起步，20-50GB 存储 | 业务库、情报事件、行动建议 |
| OSS | 标准存储，20-100GB | 存网页快照、PDF、图片、原始 HTML |
| 百炼 DashScope | 按量调用 | Qwen 做抽取、总结、行动建议 |
| SLS 日志服务 | 基础日志项目 | 记录爬虫、LLM、API 错误 |

这个配置适合：

```text
前端演示 + 5-20 个国家 + 几百到几千条情报数据 + 每天定时跑任务
```

ECS 经济型 e 实例官方定位就是开发测试、中小型网站、轻量级应用等，2核4G 对应 `ecs.e-c1m2.large`；共享型 s6 也有 2核4G 的 `ecs.s6-c1m2.large`，适合轻量 Web 应用、开发环境和轻量级数据库/缓存场景。 [oai_citation:0‡阿里云帮助中心](https://help.aliyun.com/zh/ecs/user-guide/shared-instance-families?utm_source=chatgpt.com)

---

# 我会怎么配

## 1. ECS

首选：

```text
实例规格：ecs.e-c1m2.large
CPU / 内存：2 vCPU / 4 GiB
系统：Ubuntu 22.04 LTS
磁盘：ESSD Entry 80GB
带宽：5 Mbps
部署方式：Docker Compose
```

你这台 ECS 上跑：

```text
backend-flask（Gunicorn）
crawler-worker
scheduler
redis 可选
nginx 可选
```

也就是：

```text
一台机器跑完整 Demo
```

2核4G 可以跑，但注意：**不要在本机部署大模型**。LLM 全部调用百炼 API。本机只负责 API、任务调度、爬虫和数据处理。

---

## 2. 数据库 RDS

**为什么用 PostgreSQL 而不是 MySQL**：本项目重度依赖向量检索（pgvector）、JSONB / 数组字段（情报事件的嵌套结构、来源数组、影响部门数组）和内置全文检索 —— 这些 PostgreSQL 原生支持且强，MySQL 要么没有要么偏弱。FastAPI + SQLAlchemy 对两者支持一致，没有迁移成本差。结论：用 PostgreSQL。

推荐：

```text
RDS PostgreSQL
版本：PostgreSQL 17（购买页能选到更高版本也可，新版 .0 求稳可留 17）
规格：2 核 2GB（当前可选最小规格，Demo 够用）
存储：20GB ESSD Entry，建议开启存储自动扩容兜底
网络：和 ECS 放同一个 VPC
```

如果预算允许、想边开发边演示更稳，可上 2 核 4GB / 50GB。

你的表大概就这些：

```text
market_country
brand
store_location
raw_document
intel_event
market_insight
action_recommendation
job_run
```

阿里云 RDS PostgreSQL 已支持 PostgreSQL 17，并提供数据库运维、备份、恢复、监控等托管能力；Demo 阶段用 RDS 可以少踩很多数据库运维坑。 [oai_citation:1‡AlibabaCloud](https://www.alibabacloud.com/help/zh/rds/apsaradb-rds-for-postgresql/apsaradb-rds-for-postgresql-supports-postgresql-17?utm_source=chatgpt.com)

---

## 3. OSS

推荐：

```text
OSS 标准存储
Bucket：market-intel-demo
容量：20GB 起步
权限：私有读写
```

存这些：

```text
raw_html/
pdf/
screenshots/
images/
exports/
```

原则：

```text
结构化数据进 RDS
大文件、原文、网页快照进 OSS
```

OSS 官方定位是海量、安全、低成本、高可靠的对象存储，适合存放任意类型文件，容量和处理能力可以弹性扩展。 [oai_citation:2‡AlibabaCloud](https://www.alibabacloud.com/help/zh/oss/?utm_source=chatgpt.com)

---

## 4. 百炼 / DashScope

Demo 阶段不用自己部署模型，直接用：

```text
百炼 DashScope API
```

模型建议：

| 任务 | 模型 |
|---|---|
| 分类、标签、国家识别、品牌识别 | Qwen Flash |
| 情报事件抽取 | Qwen Plus |
| 市场洞察生成 | Qwen Plus |
| 行动建议生成 | Qwen Plus |
| 复杂推理/最终报告 | Qwen Max，可选 |
| 向量化 | text-embedding 系列 |

百炼支持通过 API 调用千问模型，并支持 OpenAI 兼容接口和 DashScope SDK；这对你后端接入最友好。 [oai_citation:3‡AlibabaCloud](https://www.alibabacloud.com/help/zh/model-studio/first-api-call-to-qwen?utm_source=chatgpt.com)

我的建议是：

```text
不要全用最强模型。
分类/清洗用便宜模型，最终洞察和行动建议用 Plus。
```

---

# 三档配置建议

## 省钱版：能跑，但别压太狠

适合你自己开发、录屏演示。

```text
ECS：2核2G
RDS：2核2G / 20-50GB
OSS：20GB
带宽：3Mbps
LLM：百炼按量调用
```

缺点：

```text
2GB 内存跑 Docker + Python + 爬虫容易紧张
Playwright 这类浏览器爬虫可能卡
```

我不太推荐，除非只是纯 API + 少量假数据。

---

## 推荐版：最适合 Demo

```text
ECS：2核4G
RDS PostgreSQL：2核2G 或 2核4G
OSS：50GB
带宽：5Mbps
SLS：开基础日志
百炼：按量调用
```

这是我最建议你买的。

能承载：

```text
Flask + Gunicorn
Docker Compose
定时任务
轻量爬虫
LLM 调用
前端演示
```

---

## 增强版：Demo 更丝滑

适合现场演示、多人访问、数据稍多。

```text
ECS：4核8G
RDS PostgreSQL：2核4G / 100GB
OSS：100GB
Redis / Tair：可选
带宽：5-10Mbps
SLS：开启
```

什么时候需要这个？

```text
1. 你要跑 Playwright 浏览器爬虫
2. 同时跑多个 worker
3. 前端多人访问
4. 要做向量检索 / embedding 批处理
5. 原始数据超过几万条
```

---

# 是否需要 Redis？

Demo 第一版可以不要。

除非你要做：

```text
异步任务队列
任务进度实时刷新
热点 API 缓存
爬虫限流
```

否则先用：

```text
RDS job_run 表 + APScheduler / 独立 worker 进程
```

够了。

后面再加：

```text
Redis / Tair
```

---

# 是否需要 OpenSearch？

Demo 第一版也可以不要。

你的检索可以先用：

```text
PostgreSQL LIKE / full-text search
```

或者：

```text
pgvector
```

什么时候上 OpenSearch？

```text
1. 文章和报告数量多
2. 要做全文搜索
3. 要做 RAG 语义召回
4. 要做多国家、多品牌、多主题复杂检索
```

Demo 阶段先别上，容易分散精力。

---

# 最小购买清单

我建议你直接买这个：

```text
1. ECS：2核4G，Ubuntu，80GB 云盘，5Mbps
2. RDS PostgreSQL：2核2G，50GB
3. OSS：标准存储 Bucket，私有权限
4. 百炼 DashScope：开通 API Key
5. SLS：创建日志项目
```

这个就是你的 Demo 后端基础设施。

---

# Docker Compose 推荐部署

ECS 上跑：

```yaml
services:
  backend:
    image: market-intel-backend
    ports:
      - "8000:8000"
    env_file:
      - .env

  scheduler:
    image: market-intel-backend
    command: python -m app.jobs.scheduler
    env_file:
      - .env

  worker:
    image: market-intel-backend
    command: python -m app.jobs.worker
    env_file:
      - .env

  nginx:
    image: nginx
    ports:
      - "80:80"
```

Demo 阶段可以先不放 Redis。

---

# 资源拆分建议

不要把 PostgreSQL 也装在 ECS 里。

虽然最省钱是：

```text
ECS 上 Docker 跑 PostgreSQL
```

但我不建议。原因：

```text
1. ECS 重启/误删容易丢数据
2. 备份麻烦
3. 演示前数据库挂了很难受
4. 后续迁移麻烦
```

更稳的方式是：

```text
ECS 跑服务
RDS 跑数据库
OSS 存文件
百炼跑模型
```

这就是最小但靠谱的云上架构。

---

# Demo 架构图

```text
浏览器（React SPA）
        │  /api/*  每 30–60s 轮询
        ▼
ECS · Nginx :80
        ├── 静态资源 → 前端文件
        └── /api/* 反代 → Gunicorn(Flask) :8000 → RDS / OSS

ECS 定时任务
        ↓
爬虫 / API 采集
        ↓
raw_document
        ↓
百炼 Qwen 抽取
        ↓
intel_event
        ↓
百炼 Qwen 生成洞察
        ↓
market_insight / action_recommendation
```

---

# 前后端分离架构

## 现状与目标

```text
现状：前端是纯静态 React SPA，数据写死在 .jsx 里（mock）
目标：前后端分离 —— 前端只负责渲染，所有数据通过 HTTP API 从后端实时获取
本次只更新架构文档，暂不改代码
```

前端（React SPA）现状：

```text
React 18 + ReactDOM + Babel Standalone，从 CDN 加载；浏览器端实时编译 .jsx
无构建步骤 / 无 Node 运行时；入口 Aurum Radar.html
```

注意：前端依赖 unpkg、Google Fonts 等海外 CDN —— 这也是 ECS 必须选海外地域的原因之一。若要更稳，可把 React / Babel / 字体本地化。

## 分离后的职责边界

```text
前端：静态资源（HTML / JSX / CSS），只做渲染和交互，不含任何业务数据
后端：Flask（WSGI）+ Gunicorn，暴露 JSON REST API，从 RDS 读数据返回
两者通过 /api/* 通信，可独立开发、独立部署
```

## 部署拓扑（Nginx + Gunicorn + Flask）

后端是 Flask（WSGI 应用）。**生产不能用 `flask run` 自带开发服务器**，要用 Gunicorn 启动 Flask。请求链路：

```text
浏览器
  │  http://<ECS公网IP>/
  ▼
Nginx :80                          ← 单入口
  ├── /api/*  → 反向代理到 Gunicorn :8000 → Flask
  └── 其它     → 返回前端静态文件
```

Nginx 同源提供静态资源 + 反向代理 API，同源就**不需要处理 CORS**。

`nginx.conf` 示例：

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # API：反代到 Gunicorn（Flask）
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # SSE 实时推送（如启用）：必须关闭缓冲
    location /api/stream {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_read_timeout 3600s;
    }

    # SPA 兜底
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

> 建议把前端入口 `Aurum Radar.html` 重命名为 `index.html` —— 带空格的文件名在 Nginx / URL 里很别扭。
> 若以后前端单独部署（如 OSS 静态网站托管），则不再同源，需在 Flask 开启 CORS（`flask-cors`）。

## API 契约（前端按页面取数，待实现）

| 接口 | 对应页面 / 用途 |
|---|---|
| `GET /api/overview` | 概览页：世界地图 + 各国机会 / 风险摘要 |
| `GET /api/markets/{market}` | 国家详情：综合指数、亮点 |
| `GET /api/markets/{market}/districts` | 地图洞察页：商圈节点 |
| `GET /api/events?type=&market=` | 情报中心：事件列表（带筛选） |
| `GET /api/events/{event_id}` | 事件详情 + 来源引用 |
| `GET /api/brief/latest` | 每日战略简报 |
| `GET /api/actions?department=` | 行动建议看板 |
| `GET /api/jobs/status` | 定时任务状态（轮询用） |
| `POST /api/jobs/run` | 手动触发抓取（MVP 的「手动触发按钮」） |

前端改造方向：把 `.jsx` 里写死的 mock 数据，换成挂载时 `fetch('/api/...')`。

## 实时数据方案

数据更新节奏（PRD）：爬虫每 6 小时、每日简报 08:00 —— 数据本质不是秒级流。「实时」指**前端始终展示数据库最新状态并自动刷新**，无需手动 reload。

| 方案 | 说明 | 用在哪 |
|---|---|---|
| 轮询 Polling | 前端定时 `fetch`（如每 30–60s） | **MVP 主方案**，简单稳健，匹配 6h 数据节奏 |
| SSE | 后端单向推送（`text/event-stream`） | 可选增强；Flask 用 SSE 需配 gevent / gthread worker |
| WebSocket | 双向通信 | 本项目用不上（看板以读为主） |

MVP 建议：

```text
1. 看板挂载时拉一次全量数据
2. 之后每 30–60s 轮询，刷新地图 / 事件流 / 行动看板
3. 点「手动触发抓取」后，轮询 GET /api/jobs/status 直到任务完成再刷新
4. 想做「任务进度条 / 新事件实时弹出」时，再为这一处加 SSE
```

---

# ECS 购买参数明细（逐项对照购买页）

| 购买页字段 | 推荐值 | 说明 |
|---|---|---|
| 付费类型 | 按量付费（已购） | 项目周期 < 1 个月，按小时计费、随时释放；不用时「停机」省钱 |
| 地域 | 新加坡 Singapore | 抓取海外信息源 + 前端依赖海外 CDN，必须海外地域；新加坡贴合 MVP 三市场。**地域购买后不可更改** |
| 可用区 | 任选有 e 家族库存的可用区 | ECS 与 RDS 放同一可用区 / 同一 VPC，内网互通延迟最低 |
| 网络 | 专有网络 VPC | 用默认 VPC 即可，或新建 `aurum-vpc`（192.168.0.0/16）；RDS 必须同 VPC |
| 实例架构 | x86 计算 | 不选 ARM：Docker 镜像 / Python wheel 兼容性最稳 |
| 实例规格 | `ecs.e-c1m2.large` | 2 vCPU / 4 GiB，经济型 e |
| GPU | 无 | 模型全部走百炼 API，本机不跑模型 |
| 镜像 | 公共镜像 → Ubuntu 22.04 LTS 64 位 | 不需要镜像市场；Docker 自行安装 |
| 拓展程序 | 保留「云助手」默认；云监控基础版可留 | 不安装付费安全 / 监控扩展 |
| 系统盘 | ESSD Entry · 40 GB（已购） | 放 OS / Docker / 代码 / 日志；DB 在 RDS、文件在 OSS，40GB 够用，不够可在线扩容 |
| 数据盘 | 可选，ESSD Entry 20–40 GB | DB 在 RDS、文件在 OSS，数据盘非必需；若要，**取消**「随实例释放」以保留数据 |
| 快照服务 | 开启自动快照策略 | 每天 1 次、保留 7 天；演示前再手动打一个快照 |
| 公网 IP | 分配公网 IPv4 | 前端访问 + 出站抓取都需要 |
| 公网带宽 | 按使用流量 · 峰值 5 Mbps（已购） | 入站免费、仅算出站；低流量 Demo 更省，峰值封顶防超支 |
| 安全组 | 新建，见下表 | |
| 登录凭证 | SSH 密钥对 | 新建密钥对，下载 `.pem` 妥善保管；图省事可用「自定义密码」+ 强口令 |
| 实例名称 | `aurum-radar-demo` | |
| 释放保护 | 建议开启 | 防误删 |
| 购买数量 | 1 | |

## 安全组入方向规则

| 端口 | 协议 | 授权对象 | 用途 |
|---|---|---|---|
| 22 | SSH | 你的固定出口 IP | 只对自己开放，**禁止 0.0.0.0/0** |
| 80 | HTTP | 0.0.0.0/0 | 看板演示访问 |
| 443 | HTTPS | 0.0.0.0/0 | 后续加证书时用 |
| 8000 | — | 不开放 | FastAPI 走 Nginx 反代，不直接暴露公网 |

出方向：默认全部放通（抓取、调用百炼 API 需要）。

## 备份与快照

```text
业务数据在 RDS，靠 RDS 自动备份（默认已开，确认一次）
ECS 侧用「自动快照」即可回滚系统盘，无需额外买混合云备份 HBR
演示前手动打一个「已知正常」状态的快照
```

---

# RDS PostgreSQL 购买参数明细（逐项对照购买页）

| 购买页字段 | 推荐值 | 说明 |
|---|---|---|
| 付费类型 | 按量付费 | 与 ECS 一致，< 1 个月、随时释放 |
| 地域 | 新加坡 Singapore | **必须与 ECS 同地域**，否则无法内网互通 |
| 引擎 | PostgreSQL | 见上文「为什么用 PostgreSQL」 |
| 版本 | 17（购买页有更高版本也可，求稳留 17） | pgvector 各版本都支持 |
| 产品系列 | 基础系列（单节点） | Demo 不需要 HA，最便宜 |
| 架构 | 单节点 | 跟随基础系列，默认即可 |
| 存储类型 | ESSD Entry（经济型云盘） | 最便宜；没有该选项则选 ESSD PL1 |
| VPC | ECS 所在的**同一个 VPC** | 关键 —— 同 VPC 才能走内网连库 |
| 可用区及网络 | 与 ECS 同一可用区；专有网络 | 内网延迟最低 |
| 部署方案 | 单可用区 | 基础系列单节点即单可用区 |
| 备可用区 | 无需选（灰掉） | 单节点没有备库 |
| 实例规格 | 通用型 · 2 核 2GB | 当前可选最小规格，Demo 够用 |
| 数据库代理 | 不开启 | 连接池 / 读写分离用不上，开了额外收费 |
| 存储空间 | 20GB，建议开自动扩容兜底 | 原始 HTML 在 OSS，RDS 只存结构化数据 |
| 白名单 | 只填 ECS 内网 IP / VPC 网段 | **禁止 0.0.0.0/0** |

补充：

```text
后端用 RDS 内网地址连接，不申请公网地址
首次从本机做初始化，可临时把自己公网 IP 加进白名单，用完删除
创建后建库 / 账号；做向量检索时执行 CREATE EXTENSION vector;
```

## Python 连接示例

RDS 实例 `pgm-t4nrl3s1kv94f574`（新加坡 ap-southeast-1）连接信息：

```text
内网地址（后端在 ECS 上跑用这个）：pgm-t4nrl3s1kv94f574.pgsql.singapore.rds.aliyuncs.com
内网 IP：172.17.57.139        端口：5432
外网地址：需在控制台「申请外网地址」后才有，仅本机调试用
```

后端 `.env` 用域名而非 IP（IP 可能变）。白名单要加 ECS 的内网 IP（与 RDS 同在 `172.17.x.x` 网段，在 ECS 控制台查）。

依赖：`pip install psycopg2-binary sqlalchemy`

快速连通测试（psycopg2）：

```python
import os
import psycopg2

conn = psycopg2.connect(
    host=os.environ["PG_HOST"],         # pgm-t4nrl3s1kv94f574.pgsql.singapore.rds.aliyuncs.com
    port=5432,
    dbname=os.environ["PG_DB"],         # 你在 RDS 里创建的数据库名
    user=os.environ["PG_USER"],         # RDS 账号
    password=os.environ["PG_PASSWORD"],
)
with conn.cursor() as cur:
    cur.execute("SELECT version();")
    print(cur.fetchone())
conn.close()
```

后端实际用 SQLAlchemy（Flask 可配 Flask-SQLAlchemy）：

```python
import os
from sqlalchemy import create_engine, text

DATABASE_URL = (
    f"postgresql+psycopg2://{os.environ['PG_USER']}:{os.environ['PG_PASSWORD']}"
    f"@{os.environ['PG_HOST']}:5432/{os.environ['PG_DB']}"
)
engine = create_engine(DATABASE_URL, pool_size=5, pool_pre_ping=True)

with engine.connect() as conn:
    print(conn.execute(text("SELECT now()")).fetchall())
```

连不上时按顺序排查：

```text
1. RDS 白名单是否加了 ECS 内网网段（或本机调试用的公网 IP）
2. host 用对了吗：ECS 上用内网地址，本机用外网地址
3. 账号 / 密码 / 数据库名是否正确
4. 外网连不通时确认已「申请外网地址」
```

---

# OSS 创建与使用

## 创建 Bucket（对照控制台弹窗）

| 字段 | 推荐值 | 说明 |
|---|---|---|
| Bucket 名称 | `aurum-radar-demo`（被占用就加后缀，如 `-sg`） | 全局唯一，只能小写字母 / 数字 / 连字符 |
| 地域 | 新加坡 Singapore（ap-southeast-1） | **必须与 ECS / RDS 同地域** |
| 存储类型 | 标准存储 | Demo 文件常读常写 |
| 同城冗余存储 | 不启用（LRS） | ZRS 更贵，Demo 不需要 |
| 读写权限 ACL | 私有 | 别选公共读 / 公共读写 |
| 强制阻止公共访问 | 开启 | 私有 Bucket 的额外保险 |
| 版本控制 | 不开通 | Demo 不需要 |
| 服务端加密 | 无（或 OSS 托管，可选） | |
| 其余（日志 / 备份 / 传输加速） | 默认 / 关闭 | |

## Endpoint（本项目 ap-southeast-1 / 新加坡）

```text
内网：oss-ap-southeast-1-internal.aliyuncs.com   ← 后端在 ECS 上跑用这个，免流量费、更快
公网：oss-ap-southeast-1.aliyuncs.com            ← 只在 ECS 外部（如本机调试）才用
```

## 目录前缀

OSS 没有真目录，用前缀组织：

```text
raw_html/   pdf/   screenshots/   images/   exports/
```

## 访问凭证

```text
简单做法：RAM 控制台建一个 RAM 用户 → 勾选「OpenAPI 调用」→ 生成 AccessKey；
         授权 AliyunOSSFullAccess（或只授权本 Bucket）；AK 放后端 .env
更安全  ：给 ECS 配「实例 RAM 角色」，代码里不放任何密钥
禁止    ：用主账号 AK/SK
```

## Python 示例（`pip install oss2`）

```python
import os
import oss2

# ── 凭证从环境变量读取，不要硬编码 ──
auth = oss2.Auth(os.environ["OSS_ACCESS_KEY_ID"], os.environ["OSS_ACCESS_KEY_SECRET"])

# ── 在 ECS 上用内网 Endpoint；本机调试改成公网 Endpoint ──
ENDPOINT = "https://oss-ap-southeast-1-internal.aliyuncs.com"
BUCKET   = "aurum-radar-demo"
bucket   = oss2.Bucket(auth, ENDPOINT, BUCKET)

# 上传原始 HTML（字符串 / bytes）
bucket.put_object("raw_html/2026-05-21/abc.html", html_content)

# 上传本地文件（PDF / 截图）
bucket.put_object_from_file("pdf/report.pdf", "/tmp/report.pdf")

# 下载到内存
data = bucket.get_object("raw_html/2026-05-21/abc.html").read()

# 判断对象是否存在
exists = bucket.object_exists("pdf/report.pdf")

# 私有 Bucket：前端不能直连，由后端生成有时效的临时签名 URL
url = bucket.sign_url("GET", "pdf/report.pdf", 3600)  # 1 小时有效

# 按前缀列举对象
for obj in oss2.ObjectIterator(bucket, prefix="raw_html/2026-05-21/"):
    print(obj.key)
```

要点：Bucket 私有，前端拿不到直链；需要展示文件时由后端 `sign_url` 生成临时 URL 返回前端。

---

# 百炼 / DashScope

百炼是平台，DashScope 是底层模型调用 API；百炼控制台开通后拿到的 `API Key` 用于调 DashScope。按 token 计费、有限流。

## 两种接口

| 风格 | 说明 | 建议 |
|---|---|---|
| OpenAI 兼容接口 | 格式同 OpenAI，直接用 `openai` SDK，只改 `base_url` | **推荐** |
| DashScope 原生 SDK | 阿里自有 `dashscope` SDK | 需阿里特有功能时才用 |

## Endpoint（本项目用新加坡国际站）

OpenAI 兼容模式 —— 用 `openai` SDK 的 `base_url`：

```text
https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

DashScope 原生 HTTP 端点 —— 用 `dashscope` SDK 或直接 POST：

```text
纯文本（qwen-plus 等）：
  https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/text-generation/generation
多模态（qwen-vl 等）：
  https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
SDK 配置：dashscope.base_http_api_url = 'https://dashscope-intl.aliyuncs.com/api/v1'
```

API Key 与 Endpoint 必须配套；国内站把 `dashscope-intl` 换成 `dashscope`。

## Python 示例（`pip install openai`）

```python
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["DASHSCOPE_API_KEY"],
    base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
)

# ── 情报事件抽取：强制 JSON 输出 ──
resp = client.chat.completions.create(
    model="qwen-plus",                         # 分类 qwen-flash / 洞察 qwen-plus / 复杂 qwen-max
    messages=[
        {"role": "system", "content": "你是市场情报分析助手，只输出 JSON。"},
        {"role": "user", "content": "从下面新闻抽取市场事件：……"},
    ],
    response_format={"type": "json_object"},
    temperature=0.3,
)
print(resp.choices[0].message.content)

# ── 流式输出：适合简报生成边出边显示 ──
stream = client.chat.completions.create(
    model="qwen-plus",
    messages=[{"role": "user", "content": "生成今日战略简报：……"}],
    stream=True,
)
for chunk in stream:
    delta = chunk.choices[0].delta.content
    if delta:
        print(delta, end="", flush=True)
```

向量化（写入 pgvector 用）：

```python
emb = client.embeddings.create(model="text-embedding-v3", input="一段情报文本")
vector = emb.data[0].embedding   # 写入 PostgreSQL 的 vector 列
```

批处理时注意失败重试与并发控制（有 QPS / 每分钟 token 配额）。

## DashScope 原生 SDK 示例（`pip install dashscope`）

纯文本抽取 / 总结用上面的 OpenAI 兼容接口最省事；**多模态**（分析竞品门店、社媒图片）需要用原生 SDK，图片可传 OSS 签名 URL：

```python
import os
import dashscope
from dashscope import Generation, MultiModalConversation

dashscope.api_key = os.environ["DASHSCOPE_API_KEY"]
dashscope.base_http_api_url = "https://dashscope-intl.aliyuncs.com/api/v1"  # 新加坡国际站

# 纯文本
resp = Generation.call(
    model="qwen-plus",
    messages=[{"role": "user", "content": "从下面新闻抽取市场事件：……"}],
    result_format="message",
)
print(resp.output.choices[0].message.content)

# 多模态：分析图片（模型名以百炼模型广场为准，如 qwen-vl-plus / qwen3-vl-plus）
resp = MultiModalConversation.call(
    model="qwen-vl-plus",
    messages=[{"role": "user", "content": [
        {"image": "https://<oss-签名-url>/competitor.jpg"},
        {"text": "描述这张珠宝门店陈列图的关键信息"},
    ]}],
)
print(resp.output.choices[0].message.content)
```

---

# 最终建议

你现在就按这个买：

```text
ECS：2核4G / 80GB / 5Mbps
RDS PostgreSQL：2核2G / 50GB
OSS：50GB 标准存储
百炼：按量调用
SLS：基础日志
```

后续如果发现慢，优先升级顺序是：

```text
1. ECS 从 2核4G 升到 4核8G
2. RDS 从 2核2G 升到 2核4G
3. 加 Redis / Tair
4. 加 OpenSearch
5. 把调度迁到 SchedulerX / DataWorks
```

这套配置很适合你现在的目标：**不是做企业级平台，而是快速跑通战略情报 Agent 的产品闭环。**