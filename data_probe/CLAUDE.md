# data_probe — Claude 上下文说明

`data_probe/` 是 Aurum Radar 的 MVP 数据源验证层。目标是确认每个来源能否抓到完整正文，验证通过后集成逻辑迁移到 `../backend/services/`。

**边界**：不接入 FastAPI，不写业务数据库，不用 Playwright/Selenium。

---

## 快速启动

```bash
cd data_probe
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

python scripts/run_all.py                  # 全部跑一遍
python scripts/probe_news.py               # 仅新闻（标题模式）
python scripts/probe_news.py --fulltext    # 新闻 + 正文（DDG 两步法）
```

---

## 目录结构

```
data_probe/
├── config/
│   └── sources.yaml              # 所有数据源 URL 和方法配置
├── scripts/
│   ├── utils.py                  # 共用：urllib 请求、HTML 解析、DDG 搜索、输出
│   ├── probe_news.py             # 新闻 Google News RSS，支持 --fulltext
│   ├── probe_competitors.py      # 竞品系列页
│   ├── probe_platform_policy.py  # 平台政策 Shopee
│   ├── probe_regulations.py      # Singapore Customs
│   ├── probe_market_data.py      # 金价 + 汇率 Yahoo Finance
│   ├── probe_malls.py            # 商场活动 Google News RSS
│   └── run_all.py                # 统一入口，输出 summary JSON
├── output/
│   ├── raw/                      # 原始抓取（gitignore）
│   ├── normalized/               # 标准化记录（gitignore）
│   └── DATA_SNAPSHOT_20260521.md # 人工可读快照，含完整 URL
├── .env.example
└── requirements.txt
```

---

## 运行时环境约束

本机：**Python 3.9 + macOS LibreSSL 2.8.3 + 本地代理 127.0.0.1:7897**

| 工具 | 状态 | 原因 |
|---|---|---|
| `urllib`（内置） | ✅ 正常 | feedparser 内部也用它，RSS 和多数 HTTPS 站点可访问 |
| `requests` | ❌ 部分失败 | LibreSSL 在代理隧道中 SSL 握手失败（EOF 错误）|
| `curl`（系统自带） | ❌ 部分失败 | 同 LibreSSL 限制 |
| `WebFetch`（Claude 工具） | ✅ 可用 | 走 Claude 基础设施，绕过本地代理；但部分站点屏蔽 Anthropic 爬虫 |

**结论：脚本内所有网络请求用 `urllib`，不用 `requests`。**

---

## 有效数据源（2026-05-22 全量验证）

验证标准：实际拿到完整正文/数值，而非只有标题或链接。

### 新闻 — Google News RSS × 3

| 关键词 | 条目数/次 |
|---|---|
| `gold+jewellery+Singapore` | 100 |
| `luxury+jewelry+Singapore` | 100 |
| `gold+price+Singapore+jeweller` | 100 |

**获取正文：两步法（`utils.py` 已实现）**

```
Step 1  feedparser 拿标题 + 来源域名（entry.source.href）
Step 2  DuckDuckGo HTML 搜索找真实文章 URL
        → urllib + BeautifulSoup 提取 <p> 正文
```

- `resolve_article_url(title, domain)` — DDG 搜索，命中率约 50%
- `fetch_article_text(real_url)` — 过滤短段落（<60字）和 boilerplate
- `--fulltext` 模式每条 feed 处理前 3 篇（DDG 有速率限制）
- 已验证可抓到完整正文的来源：**CNA**（3000–5000字）、**The Straits Times**（3000–4000字，软付费墙）、**VnExpress**（完整，无反爬）

---

### 竞品 — Cartier、Chow Tai Fook

**必须用 WebFetch + 具体系列子页面 URL**（主目录页 urllib 返回 403 或 JS 空壳）

**Cartier 有效 URL（SG 站）：**
```
https://www.cartier.com/en-sg/collections/jewellery.html              ← 系列目录，可用
https://www.cartier.com/en-sg/collections/high-Jewellery/latest-collections/en-equilibre
https://www.cartier.com/en-sg/collections/high-Jewellery/latest-collections/nature-sauvage
```
可获取：系列名称、设计描述、宝石规格（克拉数、产地）、Cartier 工艺叙述。

**Chow Tai Fook 有效 URL（HK 电商站）：**
```
https://www.chowtaifook.com/en-hk/eshop/jewellery/collections/hua
https://www.chowtaifook.com/en-hk/eshop/jewellery/collections/ctf-joie-collection
https://www.chowtaifook.com/en-hk/eshop/jewellery/collections/dawn
```
可获取：产品类型、SKU 数量（如 182 件）、价格区间（HK$11,900–$77,800）、材质/宝石分类。

> **Tiffany 已移除**：urllib 和 WebFetch 均返回 403，无可用替代。

---

### 平台政策 — Shopee Help Center

urllib 直接访问，静态页面，无需 JS。

| 页面 | URL | 段落数 |
|---|---|---|
| 禁售与限制商品政策 | `help.shopee.sg/portal/4/article/77151-...` | 38 |
| 广告政策 | `help.shopee.sg/portal/4/article/77154-...` | 8 |
| 联盟佣金结构（2026-01-02） | `help.shopee.sg/portal/10/article/191914-...` | 13 |

> 第 4 页（77211 禁售商品清单）因 LibreSSL SSL 错误失效，已从配置移除。  
> **Lazada 已移除**：其政策页全站 JS 渲染；之前用 Google News RSS 代替，但只能拿到关于 Lazada 的新闻标题，不是政策原文。

---

### 法规 — Singapore Customs

urllib 在本机因 LibreSSL 报 SSL EOF，**必须用 WebFetch**。

有效入口：
```
https://www.customs.gov.sg/businesses/importing-goods/controlled-and-prohibited-goods-for-import
```

可获取：受控/禁止商品类别概览、进口申报流程说明。  
不可获取：贵金属进口的具体许可证要求（需在 customs.gov.sg 使用 HS/CA 产品代码查询工具）。

> **MAS 贵金属监管已移除**：URL 从「维护中」变为 404，页面已消失。

---

### 市场数据 — Yahoo Finance

urllib + JSON API，无需 API Key。**必须使用 Googlebot User-Agent**，标准 Mozilla UA 返回 429。

```python
req = urllib.request.Request(
    "https://query1.finance.yahoo.com/v8/finance/chart/GC%3DF?interval=1d&range=1d",
    headers={"User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1)"}
)
data = json.loads(urllib.request.urlopen(req, timeout=15).read())
price = data["chart"]["result"][0]["meta"]["regularMarketPrice"]
```

| 品种 | Symbol | 2026-05-22 实测 |
|---|---|---|
| 黄金期货 | `GC=F` | $4,524.3 USD/oz |
| USD/SGD | `USDSGD=X` | 1.2787 |
| USD/CNY | `USDCNY=X` | 6.7978 |
| USD/HKD | `USDHKD=X` | 7.8343 |

---

### 商场活动 — Google News RSS × 3

| 商场 | 条目数/次 |
|---|---|
| Marina Bay Sands | 100 |
| ION Orchard | 100 |
| Paragon | 100 |

feedparser 正常，正文抓取路径与新闻完全相同（DDG 两步法）。

> **ION Orchard Events 页面已移除**：`ionorchard.com/en/events.html` 全 JS 渲染，静态 HTML 只有 11 条导航文字，无实际活动内容。

---

## 新闻正文可访问性（实测）

### 可稳定抓取

| 来源 | 方式 | 正文质量 |
|---|---|---|
| CNA (channelnewsasia.com) | urllib | 3000–5000字，含数据引语；偶发机器人检测 |
| The Straits Times | urllib | 3000–4000字；软付费墙，完整版需订阅 |
| VnExpress International | urllib / WebFetch | 完整正文，新加坡新闻常见转载源 |
| Alvinology | WebFetch | 完整正文，小博客无反爬 |
| Hollywood Reporter | WebFetch | 完整正文 |
| Bagaholicboy | WebFetch | 完整正文，含图片描述 |

### 无法抓取

| 来源 | 原因 |
|---|---|
| Google News 跳转链接 | JS 客户端重定向，urllib/WebFetch 均无法解析；用 DDG 搜标题绕过 |
| Grazia SG、The Online Citizen、Retailnews Asia | 屏蔽 Anthropic 爬虫（403） |
| L'Officiel Singapore、Kaizenaire | JS 渲染，正文不在静态 HTML 中 |
| ThinkChina | 屏蔽 Anthropic 爬虫 |
| CNA | WebFetch 被屏蔽；改用 urllib |

### 部分可访问

| 来源 | 情况 |
|---|---|
| The Business Times | 付费墙，只能拿到前 1–2 段 |
| Harper's Bazaar SG | 偶尔可通过 urllib，稳定性低 |

---

## 输出格式

每个 probe 写两份文件：

```
output/raw/{source_type}_{timestamp}.json        原始抓取元数据
output/normalized/{source_type}_{timestamp}.json  标准化记录
```

标准化字段：

```json
{
  "source_type": "news",
  "market": "Singapore",
  "entity": "Google News – Gold Jewellery SG",
  "title": "文章标题",
  "summary": "摘要或正文前 500 字",
  "url": "https://...",
  "published_at": "2026-05-21T...",
  "fetched_at": "2026-05-21T...",
  "status": "success",
  "error": null,
  "fulltext": "完整正文（--fulltext 模式）",
  "gn_url": "Google News 跳转链接（原始）",
  "media_source": "CNA",
  "source_domain": "www.channelnewsasia.com"
}
```

`status`：`success` | `failed` | `skipped`

---

## 环境变量

| 变量 | 用途 | 状态 |
|---|---|---|
| `FIRECRAWL_API_KEY` | Firecrawl API 正文抓取（付费，替代 DDG 两步法）| 预留，未接入 |
| `SERPAPI_API_KEY` | SerpAPI 竞品价格监控 | 预留，未接入 |
| `NEWS_API_KEY` | NewsAPI.org | 预留，未接入 |
| `GOLDAPI_API_KEY` | GoldAPI.io 金价备用 | 已被 Yahoo Finance 替代 |
| `EXCHANGE_RATE_API_KEY` | ExchangeRate-API 汇率备用 | 已被 Yahoo Finance 替代 |
| `REQUEST_TIMEOUT` | HTTP 超时秒数 | 默认 15 |

---

## 依赖

```
requests>=2.31.0      # 部分场景仍保留，但优先用 urllib
beautifulsoup4>=4.12.0
feedparser>=6.0.10
pyyaml>=6.0.1
python-dotenv>=1.0.0
lxml>=5.0.0
```
