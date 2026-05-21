# data_probe — Claude 上下文说明

## 这个目录是什么

`data_probe/` 是 Aurum Radar 的**数据源验证层**，用于 MVP 阶段确认各数据源是否可抓取、解析和保存。

**不是**正式后端服务，**不**接入 FastAPI，**不**写入业务数据库。  
验证通过后，集成逻辑迁移到 `../backend/services/`。

---

## 运行方式

```bash
cd data_probe
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # 按需填写 API Key（可选）
python scripts/run_all.py     # 运行全部 probe
```

单独运行某个 probe：

```bash
python scripts/probe_news.py
python scripts/probe_market_data.py
# 等等
```

---

## 目录结构

```
data_probe/
├── config/
│   └── sources.yaml          # 所有数据源配置（URL、方法、关键词）
├── scripts/
│   ├── utils.py              # 共享工具：HTTP 请求、HTML 解析、输出保存
│   ├── probe_news.py         # 新闻（Google News RSS）
│   ├── probe_competitors.py  # 竞品官网（HTML 直抓）
│   ├── probe_platform_policy.py  # 平台政策（Shopee HTML + Lazada RSS）
│   ├── probe_regulations.py  # 法规（Singapore Customs HTML）
│   ├── probe_market_data.py  # 金价 + 汇率（Yahoo Finance JSON API）
│   ├── probe_malls.py        # 商场活动（Google News RSS + ION HTML）
│   └── run_all.py            # 统一运行，输出 summary JSON
├── output/
│   ├── raw/                  # 原始抓取数据（已 gitignore）
│   ├── normalized/           # 标准化记录（已 gitignore）
│   ├── summary_*.json        # 每次运行汇总（已 gitignore）
│   └── DATA_SNAPSHOT_20260521.md  # 人工可读数据快照（含完整 URL）
├── .env.example
├── requirements.txt
└── README.md
```

---

## 数据源配置（sources.yaml）

### 当前配置的数据源

| 类型 | 数据源 | 方法 | 状态 |
|---|---|---|---|
| news | Google News RSS × 3 条关键词 | rss | ✅ 正常，60 条/次 |
| competitor | Tiffany、Cartier、Chow Tai Fook | html | ✅ 正常，30 条/次 |
| platform_policy | Shopee Help Center × 4 页 | html_multi | ✅ 正常 |
| platform_policy | Lazada（Google News RSS） | rss | ✅ 正常，15 条/次 |
| regulation | Singapore Customs | html | ✅ 正常，11 条/次 |
| regulation | MAS 贵金属监管 | html | ⚠️ 页面维护中，暂返回 Maintenance |
| market_data | Yahoo Finance（金价 + 汇率） | json_api | ✅ 正常，无需 API Key |
| mall | MBS、ION、Paragon（Google News RSS） | rss | ✅ 正常，60 条/次 |
| mall | ION Orchard Events 页面 | html | ✅ 正常，6 条/次 |

### 添加新数据源

只需编辑 `config/sources.yaml`，在对应类别下新增条目，无需修改 Python 代码。

```yaml
news:
  - name: 新数据源名称
    market: Singapore
    url: https://...
    method: rss   # 或 html
```

---

## 输出格式

每个 probe 写两份文件：

- `output/raw/{source_type}_{timestamp}.json` — 原始抓取元数据
- `output/normalized/{source_type}_{timestamp}.json` — 标准化记录

标准化字段：

```json
{
  "source_type": "news",
  "market": "Singapore",
  "entity": "Google News – Gold Jewellery SG",
  "title": "文章标题",
  "summary": "摘要（如有）",
  "url": "https://...",
  "published_at": "2026-05-21T...",
  "fetched_at": "2026-05-21T...",
  "status": "success",
  "error": null
}
```

`status` 取值：`success` | `failed` | `skipped`

---

## 环境变量

| 变量 | 用途 | 是否必须 |
|---|---|---|
| `GOLDAPI_API_KEY` | GoldAPI.io 金价（备用） | 否（已用 Yahoo Finance 替代） |
| `EXCHANGE_RATE_API_KEY` | ExchangeRate-API 汇率（备用） | 否（已用 Yahoo Finance 替代） |
| `NEWS_API_KEY` | NewsAPI.org（预留） | 否 |
| `SERPAPI_API_KEY` | SerpAPI（预留） | 否 |
| `FIRECRAWL_API_KEY` | Firecrawl 新闻正文抓取（预留） | 否 |
| `REQUEST_TIMEOUT` | HTTP 超时秒数（默认 15） | 否 |

---

## 已知问题与限制

| 问题 | 影响 | 状态 |
|---|---|---|
| Google News RSS 无正文 | 新闻/商场只有标题+来源 | 已知，需 Firecrawl 或直接抓原文补全 |
| MAS 贵金属页面维护中 | 法规数据不完整 | 每日 retry，恢复后即可抓取 |
| Shopee seller.shopee.sg SSL 错误 | Python 3.9 + LibreSSL 2.8.3 不兼容 | 已绕过：改用 help.shopee.sg 静态页面 |
| Lazada 全站 JS 渲染 | 无法抓取政策原文 | 已绕过：改用 Google News RSS |
| 竞品页面无价格/描述 | 只有系列名和 URL | 需深入产品子页面或用 SerpAPI |
| Python 3.9 不支持 `X \| None` 语法 | — | 已修复：utils.py 加 `from __future__ import annotations` |

---

## 依赖

```
requests>=2.31.0
beautifulsoup4>=4.12.0
feedparser>=6.0.10
pyyaml>=6.0.1
python-dotenv>=1.0.0
lxml>=5.0.0
```

不使用：FastAPI、SQLAlchemy、APScheduler、数据库、Playwright、Selenium。

---

## 数据快照

`output/DATA_SNAPSHOT_20260521.md` 包含 2026-05-21 完整抓取结果，含：
- 所有新闻标题 + 原文跳转链接
- 竞品系列名 + 品牌官网完整 URL
- Shopee 政策四份文件的完整正文
- Singapore Customs 各子页面 URL
- 市场数据实时数值（金价 $4,491/oz，USD/SGD 1.28）
- 商场活动 + ION Orchard 直链分类页
