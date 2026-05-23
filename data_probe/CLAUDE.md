# data_probe — Claude 上下文说明

`data_probe/` 是 Aurum Radar 的**数据源验证 + 全球情报采集层**。
原 MVP 仅覆盖 SG，2026-05-23 起扩展为 9 市场（JP/KR/SG/TH/MY/VN/ID/PH/US）全量爬虫。
验证通过后，集成逻辑迁移到 `../backend/services/`。

**硬边界**：不接入 FastAPI，不写业务数据库，不用 Playwright/Selenium。

---

## 快速启动

```bash
cd data_probe
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # 填入 TAVILY_API_KEY

python scripts/run_all.py                                        # SG MVP 6 个 probe
python scripts/run_all.py --global                               # SG + 全球 5 个
python scripts/run_all.py --only-global --include reddit,trends,baidu  # 仅全球 + 可选
python scripts/snapshot_crawl.py                                 # 汇总当日 JSONL → MD 快照
```

---

## 目录结构

```
data_probe/
├── config/
│   ├── sources.yaml      # 数据源定义（含 registry_only 待实现目录）
│   ├── markets.yaml      # 9 市场的 google_news hl/gl/ceid + languages
│   └── keywords.yaml     # brands / products / market_topics / platforms / regulation_terms
├── scripts/
│   ├── utils.py          # HTTP 双栈 / JSONL / dedup / cache / DDG 两步法
│   ├── run_all.py        # 编排入口（--global / --only-global / --include）
│   ├── snapshot_crawl.py # 当日 JSONL → CRAWL_SNAPSHOT_*.md + 归档目录
│   │
│   ├── probe_news.py / probe_competitors.py / probe_platform_policy.py
│   ├── probe_regulations.py / probe_market_data.py / probe_malls.py
│   │                     # SG MVP 6 个（输出 JSON，旧 11 字段 schema）
│   │
│   ├── probe_gdelt.py / probe_global_news.py / probe_federal_register.py
│   ├── probe_tavily.py / probe_reddit.py / probe_trends.py
│   │                     # 全球 / 可选（输出 JSONL，PRD §2 18 字段 schema）
└── output/
    ├── normalized/       # *.jsonl（全球）/ *.json（SG 旧版）
    ├── raw/              # 原始抓取 + parse_failed HTML snapshot
    ├── CRAWL_SNAPSHOT_*.md   # snapshot_crawl 自动生成的机器可读汇总
    ├── CRAWL_SUMMARY_*.md    # 人工战略分析文档
    └── tavily_cache.json     # Tavily 24h TTL 文件缓存
```

---

## 运行环境约束

本机：**Python 3.9 + macOS LibreSSL 2.8.3 + 本地代理 127.0.0.1:7897**

| 工具 | 状态 | 说明 |
|---|---|---|
| `urllib`（内置） | ✅ 主力 | RSS / JSON API 全走这里；feedparser 内部也用它 |
| `requests` | ⚠ 部分失败 | LibreSSL 在代理隧道里 SSL 握手 EOF；`fetch_html()` 已加 urllib fallback |
| `feedparser` | ✅ 稳定 | Google News RSS / Shopify 等 |
| `curl`（系统自带） | ❌ 禁用 | 同 LibreSSL 限制，不要在脚本里调 |
| `WebFetch`（Claude 工具） | ⚠ 选用 | 走 Anthropic 基础设施绕代理；但 CNA、ThinkChina 等屏蔽 Anthropic UA |
| Playwright / Selenium | ❌ 禁用 | 超出 MVP 范围；JS 渲染源走 parse_failed + raw snapshot |

**写新 probe 的选择顺序**：JSON API → `fetch_json()` · HTML → `fetch_html()` · RSS → `feedparser` · 不要裸用 `urllib.request.urlopen`（缺重试和 fallback）。

---

## Probe 实测状态（2026-05-23 全量）

合计 **1,483 条记录**（含 19 个 failed placeholders），覆盖 9 市场。

| Probe | source_id | 状态 | 记录数 | 关键点 |
|---|---|---|---:|---|
| `probe_federal_register` | federal_register | ✅ 全通 | 135 | US 官方法规 API；质量最高 |
| `probe_global_news` | google_news_rss | ✅ 全通 | 654 | 9 市场 × 5 查询 × 15 条；URL 是 GN 跳转链接，`raw_text` 为空（标题级）|
| `probe_reddit` | reddit | ✅ 全通 | 383 | PRAW 优先，公开 JSON fallback |
| `probe_tavily` | tavily | ✅ 全通 | 146 | 带 200+ 字摘要 + 真实 URL；JP/SEA 首选 |
| `probe_trends` | google_trends | ✅ 全通 | 45 | 9 市场 × 5 词；方向性参考，非绝对值 |
| `probe_gdelt` | gdelt_doc | ⚠ 部分通 | 120 / 19 失败 | LibreSSL EOF + 429；1.2s 间隔后 ~50% 成功 |
| `probe_news`（SG） | news | ✅ | — | 3 个 GN RSS × 100 条；CNA/Straits Times 可抓正文 |
| `probe_competitors`（SG） | competitor | ✅ | — | 子系列 URL + WebFetch；主目录页 403/JS |
| `probe_platform_policy`（SG） | platform_policy | ✅ | — | Shopee Help Center 静态页；Lazada JS 已移除 |
| `probe_regulations`（SG） | regulation | ⚠ WebFetch | — | SG Customs urllib SSL EOF；MAS 贵金属页已 404 |
| `probe_market_data`（SG） | market_data | ✅ 全通 | — | Yahoo Finance JSON API（见下） |
| `probe_malls`（SG） | mall | ✅ | — | MBS / ION / Paragon GN RSS 各 100 条 |

---

## 关键设计

### 双 schema 并存

- **SG MVP（旧）**：`make_record()` → 11 字段 JSON，probe 文件名 `probe_{name}.py`
- **全球 / 可选（新）**：`make_intelligence_record()` → 18 字段 JSONL，含 `source_id / language / signal_type / impact_direction / evidence_level / confidence / entities`
- 旧 probe 不动；新 probe 共用 utils，走 jsonl 路径

### JSONL + dedup

- `save_jsonl(source_id, records)` → `output/normalized/{source_id}_YYYYMMDD.jsonl`，按 UTC 日期分文件、append-only
- Dedup key：优先 normalized URL（去 query string），fallback `sha1(source_name|title|published_at)`
- `detect_entities(text, kw)` 基于关键词命中粗推 brand/product 实体；无 LLM 依赖

### HTTP 双栈 + 重试

- `fetch_html()`：requests 优先 → SSL/连接错误自动 fallback urllib
- `fetch_json()`：全程 urllib，429 指数退避 + EOF 重试（默认 2 次）
- **不要裸用 `urllib.request.urlopen`**，否则缺重试和 fallback

### 失败容错

- 单源失败：只写一条 `title="[failed query] ..."` 占位记录，不让 `run_all.py` 崩溃
- HTML parse_failed：raw HTML 存 `output/raw/{source_id}_{ts}.html`

---

## 各数据源接入经验

### Yahoo Finance（market_data）

urllib + JSON API，无需 API Key。**必须用 Googlebot UA**，普通 Mozilla UA 返回 429：

```python
req = urllib.request.Request(
    "https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=1d&range=1d",
    headers={"User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)"}
)
price = json.loads(urllib.request.urlopen(req, timeout=15).read())
       ["chart"]["result"][0]["meta"]["regularMarketPrice"]
```

可用 symbol：`GC=F`（黄金期货）、`USDSGD=X`、`USDCNY=X`、`USDHKD=X`

### Tavily（tavily）

- API Key：从 `agent/.env` grep 复用，写入 `data_probe/.env`（不跨模块 import）
- 覆盖：JP + SEA 7 国（US/KR 有 federal_register/GDELT 兜底，不浪费配额）
- 特性：每条返回 200+ 字摘要 + **真实文章 URL**（不是 GN 跳转）
- 56% 去重率（336 抓取 → 146 落盘），dedup 机制必要
- 24h 文件缓存（`output/tavily_cache.json`），同 query 重跑 0 API 调用
- 何时启用：JP/SEA 缺正文 → 开；US/SG/KR 已有高质量源 → 关

### Reddit（reddit）

- 两段式：PRAW + OAuth 优先，缺凭据自动降级公开 JSON
- 公开 JSON URL：`https://www.reddit.com/r/{sub}/new.json?limit=100`（无需 OAuth）
- **必须用真实 UA**（如 `AurumRadarDataProbe/0.1 ...`），请求间 `sleep(2.0)` 避 429
- 实测：6 subreddits × 100 帖 = 600 抓取，0 限流，约 12s
- confidence：`score×0.3 + num_comments×0.2 + 0.2`（封顶 0.9）作为声量代理
- market 固定 `GLOBAL`（帖子无原生市场标签）

### Google Trends（trends）

**Google Trends**（✅ 45 条）：pytrends，9 市场 × 5 关键词，7 天热度序列，`confidence=0.3`，仅方向性参考

**百度指数**（已移除）：页面依赖 JS + 登录态，probe 无法取得真实曲线。生产化路径：官方授权 / 合规浏览器采集 / licensed data provider（登记在 `registry_only`）

### Google News 正文富化（已放弃）

`google_news_rss` 产出的 654 条记录 URL 是 GN 跳转链接，`raw_text` 为空，停在标题级。
曾尝试 enricher 脚本补充正文，所有路径均失败：

| 方法 | 结果 |
|---|---|
| `urllib` 跟 GN 301 跳转 | ❌ GN RSS URL 经 JS 二次跳转，`urlopen` 跟完仍在 `news.google.com` |
| base64 decode GN token | ❌ `CBMi...` token 是不透明 protobuf blob，不含可解析 URL |
| DDG HTML / DDG Lite | ❌ 机器环境均被 DDG 判定为 bot（返回 `anomaly.js`），100% `url_not_resolved` |

**当前结论**：`google_news_rss` 只作标题级新闻雷达使用。需要正文的场景改用 **Tavily**（带 200+ 字摘要 + 真实 URL）。

---

## snapshot_crawl.py

一键聚合当日所有 JSONL → `output/CRAWL_SNAPSHOT_YYYYMMDD.md` + 归档目录。

- 按 source_id / market / signal_type 分桶，每桶抽 3 条样本
- 统计 brand_hits / product_hits（基于 entities 字段）
- 把所有 jsonl 复制到归档目录，方便 zip 发出去 review

给非工程师同事看数据样本时直接跑这个，不要手写。

---

## 已知踩过的坑

| 坑 | 教训 |
|---|---|
| 按 PRD 字面建 `intelligence-sources/` 顶层目录 | 不要新建顶层目录，在 `data_probe/` 内扩展即可 |
| Tavily / Reddit 缺凭据直接 skip | 应做「优先 + 公开接口 fallback」两段式，最大化可用性 |
| 裸用 `urllib.request.urlopen` | 缺重试和 fallback，统一走 `fetch_json / fetch_html` |
| Shopify Changelog 用 `.atom` 后缀 | 不是真 Atom feed（返回 HTML），需找替代 feed 或上 SPA-snapshot |
| GDELT 跑全量不加间隔 | 立刻 429，至少 1.2s/query，生产换稳定 IP 池 |
| SG MVP 时把所有源全塞 SG market | 现在 yaml 里 9 市场矩阵，单市场 demo 用默认参数保留行为 |

---

## 后续可改进点

- GDELT 部署到稳定 IP（AWS Lambda / Cloudflare Worker）降低限流率
- `registry_only` 里的 Reuters / Nikkei / NewsAPI / IMF / OECD / 各国海关法规升级为真实 probe
- Reddit 加搜索路径（`/r/{sub}/search.json?q=...`）补品牌定向查询
- 电商平台公告（Shopify / Shopee / Lazada / Amazon）待找稳定抓取路径后重新接入
