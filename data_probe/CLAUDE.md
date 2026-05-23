# data_probe — Claude 上下文说明

`data_probe/` 是 Aurum Radar 的数据源验证 + 全球情报采集层。原本是 MVP SG
单市场 probe，2026-05-23 起扩展为 9 个市场（JP/KR/SG/TH/MY/VN/ID/PH/US）的
全量爬虫，通过后集成逻辑迁移到 `../backend/services/`。

**边界**：不接入 FastAPI，不写业务数据库，不用 Playwright/Selenium。

---

## 快速启动

```bash
cd data_probe
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                # 把 TAVILY_API_KEY 等填上

python scripts/run_all.py                         # 原 6 个 SG probe
python scripts/run_all.py --global                # SG + 5 全球
python scripts/run_all.py --only-global --include reddit,trends,baidu
python scripts/snapshot_crawl.py                  # 汇总当日所有 JSONL 出快照
```

---

## 目录结构

```
data_probe/
├── config/
│   ├── sources.yaml      # 所有数据源（含 registry_only 待实现目录）
│   ├── markets.yaml      # 9 市场 google_news hl/gl/ceid + languages
│   └── keywords.yaml     # brands/products/market_topics/platforms/regulation_terms
├── scripts/
│   ├── utils.py                  # HTTP（urllib 优先+requests 兜底）/ JSONL / dedup / cache / DDG 两步法
│   ├── snapshot_crawl.py         # 当日 JSONL → CRAWL_SNAPSHOT_*.md + 归档
│   ├── run_all.py                # 编排：--global / --only-global / --include reddit,trends,baidu
│   ├── probe_news.py / probe_competitors.py / probe_platform_policy.py / probe_regulations.py / probe_market_data.py / probe_malls.py
│   │                             # SG MVP 6 个（输出 JSON，老 schema）
│   └── probe_gdelt / probe_global_news / probe_federal_register / probe_ecommerce / probe_tavily / probe_reddit / probe_trends / probe_baidu_index
│                                 # 全球/可选 JSONL probes（输出 JSONL，PRD §2 18 字段 schema）
└── output/
    ├── normalized/               # *.jsonl（全球）+ *.json（SG 老版）
    ├── raw/                      # 原始抓取 + parse_failed 的 raw HTML snapshot
    ├── CRAWL_SNAPSHOT_*.md       # snapshot_crawl 出的人类可读汇总
    ├── CRAWL_SUMMARY_*.md        # 人工编辑的战略分析文档
    └── tavily_cache.json         # Tavily 24h TTL 文件缓存
```

---

## 运行时环境约束（务必遵守）

本机：**Python 3.9 + macOS LibreSSL 2.8.3 + 本地代理 127.0.0.1:7897**

| 工具 | 状态 | 原因 / 用法 |
|---|---|---|
| `urllib`（内置） | ✅ 主力 | feedparser 内部也用它；RSS/JSON API 全走它 |
| `requests` | ⚠ 部分失败 | LibreSSL 在代理隧道中 SSL 握手 EOF；`utils.fetch_html()` 已加 urllib fallback |
| `feedparser` | ✅ 稳 | Google News RSS / Shopify 等 |
| `curl` 系统自带 | ❌ 同 LibreSSL 限制 | 不要在脚本里调 |
| `WebFetch`（Claude 工具）| ⚠ 选用 | 走 Anthropic 基础设施绕代理；但部分站点（CNA、ThinkChina、Grazia）屏蔽 Anthropic UA |
| Playwright/Selenium | ❌ 禁用 | 超出 MVP 范围；JS 渲染源走 `parse_failed` + raw snapshot 留待生产 |

**写新 probe 的默认选择**：HTTP API → `utils.fetch_json()`；HTML 页面 → `utils.fetch_html()`；RSS/Atom → `feedparser`；正文 → `resolve_article_url + fetch_article_text`（DDG 两步法）。

---

## 关键设计

### 双 schema 并存

- **SG MVP 6 probe** 用 `utils.make_record()` → 老版 11 字段（`source_type, market, entity, title, summary, url, published_at, fetched_at, status, error, ...`），写 JSON。
- **全球 / 可选 JSONL probe** 用 `utils.make_intelligence_record()` → PRD §2 18 字段（含 `source_id / language / signal_type / impact_direction / evidence_level / confidence / entities{brands,competitors,products,locations}`），写 JSONL。2026-05-23 全量 snapshot 实际包含 8 个 JSONL source：`google_news_rss / federal_register / gdelt_doc / ecommerce_announcements / tavily / reddit / google_trends / baidu_index`。
- 老 probe 不动；新 probe 共用 utils 但走 jsonl 路径。

### JSONL + dedup

- `utils.save_jsonl(source_id, records)` → `output/normalized/{source_id}_YYYYMMDD.jsonl`，按 UTC 日期分文件、**append-only**。
- Dedup key 优先 normalized URL（去 query string），fallback `sha1(source_name|title|published_at)`。
- MVP 阶段 `summary/entities` 用 `utils.detect_entities(text, keywords)` 基于关键词命中粗推；无 LLM 依赖。

### HTTP 双栈 + 重试

- `fetch_html()`: requests 优先，捕到 SSL/Connection/Proxy 错误自动 fallback urllib。
- `fetch_json()`: 全程 urllib，自带重试（429 指数退避 + SSL 握手 EOF 重试，默认 2 次）。
- 写新 probe 时 **不要直接用 `urllib.request.urlopen`**，走 `fetch_json/fetch_html`，否则少了重试和 fallback。

### Tavily 文件缓存

- `output/tavily_cache.json`，TTL 24h，等价 `agent/cache.py`，但端口在 `utils.py` 内部（**不跨模块 import** agent/）。
- 同一 query 24h 内重跑直接命中，不消耗 API 配额。

### 失败容错

- 单源失败只产 `[failed] {source_name}` 日志 + 一条 `title="[failed query] ..."` 占位记录。
- HTML parse_failed → 保留 raw HTML 到 `output/raw/{source_id}_{ts}.html`，永不让 run_all 崩。

---

## 各 probe 实测状态（2026-05-23 全量）

| Probe | source_id | 状态 | 实测记录数 | 关键点 |
|---|---|---|---:|---|
| `probe_federal_register` | federal_register | ✅ 全通 | 135 | US 法规摘要 + 发布机构；最高质量数据源 |
| `probe_global_news` | google_news_rss | ✅ 全通 | 654 | 9 市场 × 5 查询 × 15 条；URL 是 GN 跳转，需 DDG 二步法找真实媒体 url |
| `probe_reddit` | reddit | ✅ 全通（公开 JSON） | 383 | 见下方「Reddit 公开 JSON」章节 |
| `probe_tavily` | tavily | ✅ 全通 | 146 | 见下方「Tavily 接入」章节 |
| `probe_trends` | google_trends | ✅ 全通 | 45 | pytrends 9 市场 × 5 关键词，demo-grade 搜索热度 |
| `probe_baidu_index` | baidu_index | ⚠ 受限占位 | 1 | 百度指数页面可访问，但真实指数曲线依赖 JS/登录态；仅保存 raw HTML + failed placeholder |
| `probe_gdelt` | gdelt_doc | ⚠ 部分通 | 120 / 19 失败 | LibreSSL EOF + 429 限流；1.2s 间隔 + retry 后 ~50% 成功 |
| `probe_ecommerce` | ecommerce_announcements | ⚠ 大部分失败 | 4 | Shopify Changelog 不是真 atom；Amazon 被反爬重定向；Shopee `open.shopee.com/news` 超时；Lazada JS → parse_failed + raw snapshot |
| `probe_news` (SG) | news | ✅ feedparser 路径已验证 | — | 3 个 Google News RSS Feed × 100 条；CNA/Straits Times 可抓正文 |
| `probe_competitors` (SG) | competitor | ✅ 选用 | — | Cartier `/en-sg/collections/jewellery.html` + 子系列页；Chow Tai Fook `/en-hk/eshop/jewellery/collections/{hua,ctf-joie,dawn}`。**主目录页 urllib 返回 403/JS 空壳，必须用子系列 URL + WebFetch** |
| `probe_platform_policy` (SG) | platform_policy | ✅ 选用 | — | Shopee Help Center 静态页可用：portal/4/article/77151（禁售）、77154（广告）、portal/10/article/191914（佣金 2026-01）。**Lazada 政策页全 JS，已移除** |
| `probe_regulations` (SG) | regulation | ⚠ 用 WebFetch | — | Singapore Customs urllib SSL EOF，必须 WebFetch；**MAS 贵金属页已 404 消失** |
| `probe_market_data` (SG) | market_data | ✅ 全通 | — | Yahoo Finance JSON API（见下） |
| `probe_malls` (SG) | mall | ✅ 选用 | — | Marina Bay Sands / ION / Paragon 三个 Google News RSS 各 100 条；ION Orchard Events 页全 JS 已移除 |

合计实测 **1,488 条 JSONL 记录**（含 22 个 failed placeholders），覆盖 9 个目标市场 + `CN` 百度指数受限占位。详细评级与战略分析见 `output/CRAWL_SUMMARY_20260523.md`。

---

## Yahoo Finance 市场数据范式（必读）

urllib + JSON API，无 API Key。**必须用 Googlebot UA**，标准 Mozilla UA 返回 429：

```python
req = urllib.request.Request(
    "https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=1d&range=1d",
    headers={"User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)"}
)
price = json.loads(urllib.request.urlopen(req, timeout=15).read())["chart"]["result"][0]["meta"]["regularMarketPrice"]
```

可用 symbol：`GC=F`（黄金期货）、`USDSGD=X`、`USDCNY=X`、`USDHKD=X`。

---

## Tavily 接入经验（2026-05-23）

**配置**
- `data_probe/.env` 加 `TAVILY_API_KEY`（**直接 grep agent/.env 复用同一 key**，不跨模块 import）
- `pip install tavily-python==0.7.24`
- `config/sources.yaml:tavily.markets` 控制范围，默认收窄为 JP+SEA 7 国（US/KR 已有 federal_register/GDELT 兜底，不浪费配额）
- `max_queries_per_market: 6`、`max_results_per_query: 8`、`days: 30`

**特性**
- 每条返回都带 **200+ 字 content 摘要** + 真实文章 url（不是 Google News 跳转）
- 多查询间高度重叠：实测 336 抓取 → 146 去重落盘（**56% 去重率**），dedup 机制必要
- 24h 文件缓存 `output/tavily_cache.json`，同 query 重跑 0 API 调用
- 7 市场 × 6 查询 = 42 API calls，跑一次约 1 分钟

**何时启用**
- 缺正文摘要的市场（JP/SEA）→ 提升数据可用性 1 个档位
- 标题级数据足够时（US 已有 federal_register、SG/KR 已有 GDELT）→ 不必跑

---

## Reddit 公开 JSON 路径（2026-05-23）

`probe_reddit.py` 两段式：PRAW + OAuth 是首选；**缺凭据时自动降级**到公开 JSON。

**公开 JSON 关键点**
- URL：`https://www.reddit.com/r/{sub}/new.json?limit=100`（无需 OAuth）
- **必须用真实 UA**（如 `AurumRadarDataProbe/0.1 (jewelry market intelligence research)`），不要用 `python-urllib/...`
- 请求间 `time.sleep(2.0)` 避 429
- 实测：6 subs × 100 帖 = 600 抓取，0 限流，~12s 完成
- jewelry/EngagementRings/Diamonds 全留；luxury/watches/femalefashionadvice 走关键词过滤（保留命中率 19-33%）

**confidence 字段**
- Reddit 帖子用 `score×0.3 + num_comments×0.2 + 0.2`（封顶 0.9）作为社媒声量代理
- 下游 agent 可按 confidence 排序找高声量贴

**Market 字段**
- 固定 `GLOBAL`，因为 Reddit 帖子无原生市场标签；语言主要英语区

---

## Trends / 百度指数接入经验（2026-05-23）

### Google Trends (`probe_trends`, source_id=`google_trends`)

**状态**：✅ 已跑通，45 条。

- 依赖：`pytrends==4.9.2`
- 运行：`python scripts/probe_trends.py` 或 `python scripts/run_all.py --only-global --include trends`
- 覆盖：9 市场 × 5 关键词 = 45 条（`gold jewelry`, `diamond jewelry`, `lab grown diamond`, `Chow Tai Fook`, `周大福`）
- 输出：`output/normalized/google_trends_YYYYMMDD.jsonl`
- 数据形态：7-day interest over time 序列 + 平均热度；`signal_type=product_trend`，`confidence=0.3`
- 定位：demo-grade 搜索热度对照，只能做方向性参考，不等价销量 / 需求绝对值

### Baidu Index / 百度指数 (`probe_baidu_index`, source_id=`baidu_index`)

**状态**：⚠ 已登记并探测，但只有 1 条受限占位记录。

- 运行：`python scripts/probe_baidu_index.py` 或 `python scripts/run_all.py --only-global --include baidu`
- 输出：`output/normalized/baidu_index_YYYYMMDD.jsonl`
- 当前结果：百度指数 shell 页面和 help 页面可访问，raw HTML 会保存到 `output/raw/baidu_index_*.html`
- 限制：真实关键词指数曲线依赖 JS app + 登录态 / 授权流程；当前纯 HTTP probe 不抽取 time series
- 生产化路径：官方授权、合规登录态浏览器采集，或 licensed data provider

---

## snapshot_crawl.py 工具

一键聚合当日所有 JSONL → `output/CRAWL_SNAPSHOT_YYYYMMDD.md` + `CRAWL_SNAPSHOT_YYYYMMDD/` 归档目录。

- 自动按 source_id / market / signal_type 分桶，每桶抽 3 条样本
- 统计 brand_hits / product_hits（基于 entities 字段）
- 同时把所有 jsonl 复制到归档目录，方便 zip 发出去 review

**写 README 风格的「数据是什么样的」给非工程师同事看时直接跑这个，不要手写。**

---

## 已知踩过的坑

| 坑 | 教训 |
|---|---|
| 按 PRD 字面建 `intelligence-sources/` 顶层目录 | **不要新建顶层目录**，data_probe 内扩展即可，跨模块工具端口本地一份（如 Tavily 缓存）；详见 memory `feedback-no-new-top-level-modules` |
| Tavily/Reddit 用空 PRAW 凭据直接 skip | 应做「PRAW 优先 + 公开接口 fallback」两段式，最大化可用性 |
| 直接用 `urllib.request.urlopen` 写 probe | 缺重试和 fallback；统一走 `utils.fetch_json / fetch_html` |
| Shopify Changelog 用 `.atom` 后缀 | 不是真 Atom feed（返回 HTML）；要找替代 feed url 或上 SPA-snapshot |
| GDELT 跑全量没间隔 | 立刻 429；至少 1.2s/query 间隔，生产环境换稳定 IP 池 |
| SG MVP 时期把所有源全塞 SG | 现在 yaml 里 9 市场矩阵，单市场 demo 走 `--only-global=false`（默认）保留行为 |

---

## 后续可改进点

- Shopify Changelog 找替代 feed（`shopify.engineering/feed.atom`？）或上 Firecrawl
- Shopee Open Platform 切到 Seller Center HTML
- Lazada 上 Playwright 处理 JS 渲染
- GDELT 部署到稳定 IP（AWS Lambda / Cloudflare Worker）
- 对 `google_news_rss` 654 条用 DDG 两步法批量抓正文（数据可用性 10×）
- `registry_only:` 里的 Reuters / Nikkei / NewsAPI / IMF / OECD / 各国海关法规升级为真实 probe
- Reddit 公开 JSON 加搜索路径（`/r/{sub}/search.json?q=...`）补品牌定向查询
