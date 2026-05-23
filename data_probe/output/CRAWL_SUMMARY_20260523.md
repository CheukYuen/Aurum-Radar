# 爬虫数据总结 — 2026-05-23

合计 **913 条记录**，来自 **4 个真实运行的采集器** × **9 个目标市场**。

---

## 一、整体盘点

| 采集器 (source_id) | 数据类型 | 记录数 | 覆盖市场 | 数据形式 |
|---|---|---|---|---|
| `google_news_rss` | 全球新闻 | **654** | 9 个市场全覆盖 | 标题 + 跳转链接 + 发布时间 + 媒体源 |
| `federal_register` | 美国法规 | **135** | US | 完整摘要 + 发布机构 + 文档号 + 全文 url |
| `gdelt_doc` | 全球新闻事件 | **120** (含 19 个失败占位) | 9 个市场（KR/SG 居多） | 标题 + 真实 url + seendate + 域名 |
| `ecommerce_announcements` | 电商平台公告 | **4** | SG / US / GLOBAL | 标题 + 链接，部分 parse_failed 落 raw HTML |

输出位置：
- 标准化 JSONL：`data_probe/output/normalized/{source_id}_20260523.jsonl`
- 归档副本：`data_probe/output/CRAWL_SNAPSHOT_20260523/`
- 可读摘要：`data_probe/output/CRAWL_SNAPSHOT_20260523.md`

---

## 二、按数据源详解

### 1. `google_news_rss` — 多市场谷歌新闻 RSS

**是什么数据**：按「关键词 × 市场」笛卡尔积拉的谷歌新闻 RSS 条目（每市场 5 个查询 × 15 条 ≈ 75 条/市场）。涵盖珠宝市场、奢侈消费、金价、消费情绪、旅游零售 5 个市场主题。

**来源 URL 模板**：`https://news.google.com/rss/search?q={query}&hl={hl}&gl={gl}&ceid={ceid}`

**Top 媒体源**：Vietnam.vn (48), FXStreet (16), vietnamnews.vn (16), VT Markets (14), The Edge Malaysia (14), The Business Times (10), Reuters (9), CNA。

**例子**：
- 🇸🇬 *Singapore's jewellery market set to grow 5% annually, but shrinking craftsmen pool a concern* — CNA, 2025-07-11
- 🇲🇾 *Malaysians buying more gold to hedge against economic and geopolitical risks* — MySinchew, 2026-03-15
- 🇻🇳 *Association proposes loosening controls on gold jewellery* — vietnamnews.vn, 2025-12-10
- 🇰🇷 *[한국인이 주목한 럭셔리 브랜드 30] JEWELRY TOP 10* — 포브스코리아, 2026-04-28
- 🇯🇵 *ジュエリーの日本市場（2026年～2034年）市場規模・分析レポート* — Newscast.jp, 2026-03-27
- 🇹🇭 *Heritage Fine Art & Jewelry เปิดเกมรุกตลาดไลฟ์สไตล์คนรุ่นใหม่* — Thairath, 2025-12-07
- 🇺🇸 *Demi-Fine Jewelry Market to Reach US$ 5.6 Billion by 2033 (11.6% CAGR)* — openPR, 2026-05-20

**注意**：URL 是 Google News 跳转链路（含 base64 redirect），需要二步走 DDG 搜索定位真实媒体 URL 才能抓正文（`utils.resolve_article_url` 已实现）。

---

### 2. `federal_register` — 美国联邦公报

**是什么数据**：美国官方法规公报，按 8 个珠宝相关关键词查询：jewelry / gold / diamond / precious metals / tariff / customs / anti money laundering / consumer protection。每词 20 条，去重后 135 条。

**来源 API**：`https://www.federalregister.gov/api/v1/articles.json`

**Top 发布机构**：
- Commerce Department, International Trade Administration (24)
- Securities and Exchange Commission (19)
- Environmental Protection Agency (7)
- Interior Department, National Park Service (6)
- Treasury Department, Foreign Assets Control Office / OFAC (5)
- Homeland Security, U.S. Customs and Border Protection (5)

**例子**（带完整 url + 摘要）：
- *Initiation of Antidumping and Countervailing Duty Administrative Reviews* — Commerce / ITA, 2026-05-04, 反倾销/反补贴 March 周年评审
- *Survey of the Costs of AML/CFT Compliance* — Treasury, 2026-04-28, FinCEN 反洗钱合规成本调研
- *Notice of OFAC Sanctions Action* — Treasury OFAC, 2026-04-21, 新增 SDN 制裁名单

**质量**：最高质量数据源——有 100-300 字摘要 + 发布机构 + 文档号 + 永久 url。`evidence_level=official`, `confidence=0.7`。

---

### 3. `gdelt_doc` — GDELT 2.0 全球新闻事件流

**是什么数据**：每个市场 2-3 个核心查询（如 `jewelry market Japan` / `Chow Tai Fook Singapore` / `luxury jewelry United States`），返回各国媒体发布的相关文章元数据。

**来源 API**：`https://api.gdeltproject.org/api/v2/doc/doc` (mode=ArtList, JSON)

**Top 域名**：163.com (网易), biz.heraldcorp.com, news.cyol.com, huxiu.com, finance.sina.com.cn, propertynews.pl, eturbonews.com, jckonline.com

**例子**（拿到真实媒体 url，不是 Google 跳转）：
- 🇰🇷 *The Star of Richemont Strong Fiscal Year: Jewelry* → `https://www.jckonline.com/editorial-article/richemont-fiscal-year/`
- 🇸🇬 *WFDB Adds Botswana and Angola as Nation Affiliated Members Ahead of 41st World Diamond Congress* → `https://www.diamondworld.net/news/wfdb-adds-botswana-and-angola...`
- 🇰🇷 *서인영의 LA 언니 룩 [누구템]* → `https://www.edaily.co.kr/News/Read?newsId=01892566645451872`
- 🇹🇭 *หวั่นตกขบวน ไทยเร่งเจรจาFTA หลัง EU เดินสายปิดดีลทั่วโลก* → thaipbs.or.th

**质量警告**：因本机 LibreSSL + 代理握手 EOF + GDELT 429 限流，27 个查询里只有 ~8 个完整返回，另外 19 个落 `[failed query]` 占位记录。生产环境需走稳定 IP 池。

---

### 4. `ecommerce_announcements` — 电商平台公告

**是什么数据**：4 个电商平台的卖家政策/公告页。本次实际命中很差，但失败信息已结构化保存：

| Source | URL | 结果 |
|---|---|---|
| Shopify Changelog | `https://shopify.dev/changelog.atom` | ❌ 不是真正的 Atom feed（返回 HTML），需换 feed url |
| Amazon Seller Central | `https://sellercentral.amazon.com/help/hub/announcements` | ⚠️ 拿到 1 条但是「Create your Amazon account」登录跳转，说明被反爬重定向 |
| Shopee Open Platform | `https://open.shopee.com/news` | ❌ timeout，URL 可能已失效 |
| Lazada Open Platform | `https://open.lazada.com/apps/doc/doc?nodeId=10557` | ❌ JS 渲染，自动落 `output/raw/lazada_open_platform_*.html` (23KB HTML 快照) + `parse_failed` 标记 |

**结论**：这一类源生产化前需要：① 找到 Shopify 的真 RSS feed；② Amazon 改用 SP-API 公告接口；③ Shopee 改用 Seller Center HTML；④ Lazada 接入 Playwright/Firecrawl 来跑 JS。

---

## 三、数据 schema（每条记录 18 个字段）

```json
{
  "source_type":      "news | regulation | ecommerce | ...",
  "source_id":        "google_news_rss",
  "source_name":      "Google News RSS",
  "market":           "JP | KR | SG | TH | MY | VN | ID | PH | US | GLOBAL",
  "language":         "en | ja | ko | th | vi | id | ms",
  "title":            "...",
  "url":              "...",
  "published_at":     "2026-05-20T...",
  "collected_at":     "2026-05-23T03:11:02Z",
  "author_or_account":"CNA / Treasury Department / ...",
  "raw_text":         "...",
  "summary":          "...",
  "keywords":         ["query 命中词"],
  "entities":         {"brands":[], "competitors":[], "products":[], "locations":[]},
  "signal_type":      "competition | regulation | consumer_behavior | macro | platform_policy",
  "impact_direction": "watch (MVP 默认)",
  "evidence_level":   "official | media | third_party_report | social",
  "confidence":       0.0-1.0
}
```

---

## 四、当前 signal 分布

- **regulation** (135) — 全部来自 Federal Register
- **consumer_behavior** (650) — Google News 主流，反映各市场消费/趋势
- **macro** (101) — GDELT 拿到的宏观新闻
- **competition** (23) — 命中品牌名（Cartier / Bvlgari / Pandora / Chow Tai Fook 等）的条目
- **platform_policy** (4) — 电商平台公告

**品牌命中**（在 Google News 标题里）：Pandora ×2, Bvlgari ×1, Chow Tai Fook ×1。命中率较低，说明品牌级声量需要靠 `gdelt_doc` 的品牌查询（Chow Tai Fook Singapore 已有 7 条命中）或后续接入 Tavily / Reddit 补强。

---

## 五、按国家覆盖明细

| 市场 | 总记录 | google_news | gdelt | fed_reg | ecomm | 带正文摘要 | 品牌命中 | 分析支持度 |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| 🇺🇸 US | **210** | 74 | 0 | 135 | 1 | 176 | 0 | ⭐⭐⭐⭐⭐ 充分（含完整法规） |
| 🇸🇬 SG | **128** | 75 | 52 | 0 | 1 | 75 | 2 | ⭐⭐⭐⭐ 充分（GDELT 拿到品牌新闻） |
| 🇰🇷 KR | **124** | 75 | 49 | 0 | 0 | 75 | 0 | ⭐⭐⭐⭐ 充分（量大） |
| 🇻🇳 VN | **75** | 75 | 0 | 0 | 0 | 75 | 0 | ⭐⭐⭐ 基础可用（仅标题级） |
| 🇮🇩 ID | **74** | 74 | 0 | 0 | 0 | 74 | 0 | ⭐⭐⭐ 基础可用 |
| 🇵🇭 PH | **74** | 74 | 0 | 0 | 0 | 74 | 0 | ⭐⭐⭐ 基础可用 |
| 🇹🇭 TH | **73** | 73 | 0 | 0 | 0 | 73 | 2 | ⭐⭐⭐ 基础可用 |
| 🇲🇾 MY | **72** | 72 | 0 | 0 | 0 | 72 | 0 | ⭐⭐⭐ 基础可用 |
| 🇯🇵 JP | **65** | 62 | 3 | 0 | 0 | 62 | 0 | ⭐⭐ 偏弱（GDELT JP 全失败） |

### 分析支持度评级

**⭐⭐⭐⭐⭐ 充分 — 可做完整战略分析（210 条以上 + 含法规/品牌信号）**
- 🇺🇸 **United States** — 唯一拥有一手法规数据的市场。可做：法规风险扫描（135 条官方公报含发布机构+摘要+文档号）、消费市场情绪、市场规模研报追踪、关税/反洗钱合规专题。

**⭐⭐⭐⭐ 充分 — 可做品牌+市场分析（120+ 条，含 GDELT 真实媒体 url）**
- 🇸🇬 **Singapore** — 双源覆盖（Google News 75 + GDELT 52）。GDELT 拿到 7 条 Chow Tai Fook Singapore 真实媒体链接，可做品牌声量、市场动态、行业事件追踪。
- 🇰🇷 **Korea** — 124 条，GDELT 拿到 Richemont 财报、奢侈品牌排行、本地 K-pop 联名等。可做品牌+市场双线分析。

**⭐⭐⭐ 基础可用 — 可做趋势+情绪分析（约 70-75 条，仅标题+RSS 跳转链接）**
- 🇻🇳 Vietnam, 🇮🇩 Indonesia, 🇵🇭 Philippines, 🇹🇭 Thailand, 🇲🇾 Malaysia — 每个市场 70+ 条 Google News，覆盖 5 个主题（jewelry market / luxury consumption / gold price / consumer sentiment / tourism retail）。**够做**：市场情绪、宏观趋势、关键事件（如越南 vietnamnews.vn 报道的「黄金管制放宽」、马来西亚《The Edge》IPO 新闻）。**不够做**：品牌竞争（标题级数据没有品牌实体）、正文级深度分析（需进一步 DDG 二步法抓正文）。

**⭐⭐ 偏弱 — 仅做基础情绪扫描**
- 🇯🇵 **Japan** — 65 条，GDELT 3 个 JP 查询全部因 SSL 握手 EOF / 429 失败。仅靠 Google News 日文 RSS。建议优先重跑或接入 Tavily 补充。

---

## 六、能支持的分析任务（按市场分级）

### 已可立即做的分析（无需额外采集）

| 分析任务 | 支持市场 | 数据基础 |
|---|---|---|
| **美国法规风险扫描** | US | Federal Register 135 条带完整摘要 |
| **市场情绪 / 消费趋势** | US, SG, KR, VN, ID, PH, TH, MY, JP（9 个） | Google News 654 条 |
| **品牌声量初筛** | SG, KR（其余偏弱） | GDELT 拿到 Richemont/Chow Tai Fook 等真实媒体链接 |
| **金价/宏观相关性** | 9 个市场（特别是 KR/MY/TH/VN 金价话题密集） | Google News + GDELT |
| **市场规模/研报追踪** | 9 个市场（标题层面） | Google News 抓到大量 Persistence Research / Fortune Business Insights / openPR 等研报标题 |

### 暂时做不了的分析（缺数据）

| 分析任务 | 缺什么 | 补救路径 |
|---|---|---|
| **JP/KR/SEA 本地法规风险** | 各国本地法规源（已在 `registry_only` 登记但未实现 probe） | 优先实现 Federal Register 同款 probe：日本 e-Gov、韩国 law.go.kr、新加坡 sso.agc.gov.sg |
| **品牌深度竞争（Cartier vs Tiffany vs CTF）** | Google News 只有标题，没有正文实体；GDELT 量太小 | 对 google_news_rss 654 条跑 DDG 二步法抓正文，再走 LLM 实体抽取 |
| **电商平台政策变化（Shopee/Lazada/TikTok Shop）** | 当前 ecommerce probe 4 个源 3 个失败 | 换 Shopify 真 RSS、Amazon SP-API、Shopee Seller Center HTML、Lazada 上 Playwright |
| **社媒声量（Reddit / TikTok / Ins）** | 未启用 Reddit probe（缺 PRAW creds） | 申请 Reddit dev app + .env 配 creds，然后 `--include reddit` |
| **搜索趋势（Google Trends）** | 未启用 | `pip install pytrends && --include trends`（数据偏弱，仅做 demo） |

---

## 七、下一步建议

1. **马上能做的事** — 让 agent 用现有 913 条数据生成首版 US/SG/KR 三市场战略简报，验证下游 LLM pipeline 通顺。
2. **接入 Tavily**（`TAVILY_API_KEY` 在 `agent/.env` 已有）— 跑 `probe_tavily`，拿带正文摘要的二次检索结果，弥补 Google News 只有标题的缺陷，预期每市场 +20-40 条带 summary 的高质量数据。
3. **修复电商源** — Shopify Changelog 改用真 RSS、Amazon 改 SP-API、Lazada 上 Playwright。
4. **GDELT 部署到稳定 IP**（AWS Lambda / Cloudflare Worker）后预计可拿满 9 市场 × 3 查询 × 50 条 ≈ 1350 条带真实 url 的数据。
5. **对 google_news_rss 654 条跑 DDG 二步法抓正文**（`utils.resolve_article_url + fetch_article_text` 已实现），数据可用性会跃升 10×。

---

## 八、Tavily 接入后更新（2026-05-23 后续）

按建议接入了 Tavily，重点补强 JP + 东南亚 6 国。

**配置变更**
- `data_probe/.env` 新增 `TAVILY_API_KEY`（从 `agent/.env` 复用同一 key）
- `pip install tavily-python==0.7.24`（已加入 venv）
- `config/sources.yaml:tavily.markets` 收窄到 `[JP, SG, TH, MY, VN, ID, PH]`，US/KR 暂时不消耗 Tavily 配额
- `max_queries_per_market: 4 → 6`，`max_results_per_query: 5 → 8`，`days: 7 → 30`

**API 调用**
- 7 市场 × 6 查询 = **42 个 API 调用**（0 缓存命中，首次跑）
- 336 条原始结果 → 去重后 **146 条独立记录**入 `output/normalized/tavily_20260523.jsonl`
- 去重率 56%，原因是各市场 6 个查询（jewelry market / luxury consumption / gold price / consumer sentiment / tourism retail / duty free）之间有大量重叠文章
- **146 条全部带 200+ 字摘要**（Tavily 直接返回 content，不像 Google News 只有标题）

**新数据来源**（Top 域名）
natlawreview.com (11), mining.com (10), hospitalitynet.org (9), travelweekly.com.au (7), asianbusinessreview.com (6), manilatimes.net (5), cnbc.com (4), kitco.com (4), apnews.com (4), nypost.com / wwd.com / forbes.com / washingtonpost.com（各 3）

**Tavily 各市场样本**
- 🇯🇵 *Jewelry influencers on their style tips, dream jewels for 2026* — New York Post
- 🇸🇬 *Sharon Yuen Jewelry Design Redefines Traditional Jadeite with Award-Winning Contemporary Necklace* — Business Insider
- 🇹🇭 *Cosmoprof CBE ASEAN 2026 Expands with the Launch of Cosmopack CBE ASEAN* — Beauty Packaging
- 🇲🇾 *Va-va vintage: London Jewelers searches the globe for heritage treasures* — NY Post
- 🇮🇩 *Indonesia Exfoliating Body Brush — Market Analysis, Forecast, Size, Trends* — IndexBox
- 🇻🇳 *Opinion: The market on the Mekong* — Washington Post
- 🇵🇭 *Philippine Department of Tourism bets big on content creators for Vlogfest Philippines 2026* — Travel Weekly

### 接入后全量对比

| 市场 | 接入前 | Tavily +增 | 接入后总数 | 提升 |
|---|---:|---:|---:|---|
| 🇺🇸 US | 210 | — (未投入) | 210 | — |
| 🇸🇬 SG | 128 | +18 | **146** | +14% |
| 🇰🇷 KR | 124 | — (未投入) | 124 | — |
| 🇯🇵 **JP** | 65 | **+46** | **108** | **+66%** ⭐ |
| 🇹🇭 TH | 73 | +20 | **93** | +27% |
| 🇮🇩 ID | 74 | +18 | **92** | +24% |
| 🇲🇾 MY | 72 | +18 | **90** | +25% |
| 🇻🇳 VN | 75 | +14 | **89** | +19% |
| 🇵🇭 PH | 74 | +12 | **86** | +16% |
| **合计** | **913** | **+146** | **1,059** | **+16%** |

### 评级更新

| 档位 | 国家 | 备注 |
|---|---|---|
| ⭐⭐⭐⭐⭐ | 🇺🇸 US | 不变 |
| ⭐⭐⭐⭐ | 🇸🇬 SG, 🇰🇷 KR, **🇯🇵 JP**↑ | JP 从 ⭐⭐ → ⭐⭐⭐⭐，因为 Tavily 补的 46 条全部带 200+ 字摘要，数据可用性大幅提升 |
| ⭐⭐⭐ | 🇹🇭 TH, 🇮🇩 ID, 🇲🇾 MY, 🇻🇳 VN, 🇵🇭 PH | 全部 +12-20 条带摘要 Tavily 数据；可用性从「仅标题」升级为「标题+摘要」 |

### 关键变化

JP 从「⭐⭐ 偏弱」直接提升到「⭐⭐⭐⭐ 可做品牌+市场双线分析」——46 条带摘要数据足以替代 GDELT JP 失败的查询。东南亚 6 国不再是「仅标题级」，每国新增 12-20 条带 200+ 字摘要的真实文章，可以做基础的正文级实体抽取与情绪判断。

**总记录数：1,059 条**（之前 913 + Tavily 新增 146）

---

## 九、Reddit 接入（2026-05-23 后续）

走 **公开 JSON 接口**（免 OAuth），从 6 个 jewelry 相关 subreddit 拉最新 100 帖、关键词过滤后留下 jewelry-相关帖子。

**实现路径**
- 现有 `probe_reddit.py` 改造：PRAW + OAuth 仍是首选；缺凭据时自动降级到 urllib + `/r/{sub}/new.json?limit=100`
- 关键技术点：
  - 真实 User-Agent (`AurumRadarDataProbe/0.1 (jewelry market intelligence research)`)
  - 请求间 2s sleep 避 429
  - jewelry/EngagementRings/Diamonds 三个 jewelry 主题 sub 全量留存；luxury/watches/femalefashionadvice 走关键词过滤
  - `confidence` 字段由 score + num_comments 加权（最高 0.9）作为社媒声量代理指标

**运行结果**
- 6 subreddits × 100 posts = **600 抓取**
- 关键词过滤后 **383 条 jewelry-相关**入 `output/normalized/reddit_20260523.jsonl`
- 0 失败，0 限流，耗时 ~12s

**每 sub 命中**

| Subreddit | 抓取 | 相关 |
|---|---:|---:|
| r/jewelry | 100 | 100 (全留) |
| r/EngagementRings | 100 | 100 (全留) |
| r/Diamonds | 100 | 100 (全留) |
| r/watches | 100 | 33 |
| r/femalefashionadvice | 100 | 31 |
| r/luxury | 100 | 19 |

**信号分布**

- **品牌提及**：Cartier 7, Tiffany 6, Van Cleef 1（共 14 条带品牌实体）
- **产品提及**：engagement ring 55, wedding ring 6, lab grown diamond 3, gold necklace 1, gold jewelry 1（共 66 条带产品实体）
- **市场字段**：`GLOBAL` — Reddit 没有原生市场标签，但帖子语言均为英文，主要反映美国/英语区消费者声音

**有价值的社媒信号样本**

- *Zales thinks their own ring is not legit* — r/jewelry，连锁珠宝品牌客户体验吐槽（品牌风险信号）
- *Recession Indicators: Fashion Edition* — r/femalefashionadvice，宏观消费力下行信号
- *Trends that I've noticed being sold in stores* — r/femalefashionadvice，零售趋势观察
- *What is the meaning behind wearing a gold thin band as a pinky ring?* — r/jewelry，新品类需求探索
- *[Omega] My First Mechanical Watch* — r/watches，奢侈品入门用户画像
- *She's not the fanciest, but she's my dream ring, and she's mine* — r/EngagementRings，消费者情绪样本

**时间新鲜度**：最新 5 条均为 2026-05-23（今日）发布，证明 `/new.json` 路径拿到的是真实时间流，不是缓存。

---

## 十、最终全量数据矩阵（截至 2026-05-23）

| Source | 记录数 | 类型 | 主要市场 | 数据形式 | API/方法 |
|---|---:|---|---|---|---|
| `google_news_rss` | 654 | news | 9 市场全覆盖 | 标题 + GN 跳转 | feedparser |
| `reddit` | **383** | social | GLOBAL (英语区) | 标题 + 正文 + score + 评论数 + 时间戳 | urllib + 公开 JSON |
| `federal_register` | 135 | regulation | US | 标题 + 完整摘要 + 发布机构 | JSON API |
| `gdelt_doc` | 120 | news | 9 市场 (uneven) | 标题 + 真实媒体 url | JSON API (部分 SSL/429 失败) |
| `tavily` | 146 | news | JP + SEA 7 国 | 标题 + 200+ 字摘要 + 真实 url | Tavily API (42 calls) |
| `ecommerce_announcements` | 4 | ecommerce | SG/US/GLOBAL | 标题 + 链接 | HTML + RSS (3 个源 parse_failed) |

**合计 1,442 条记录**，覆盖：
- **9 个目标市场**：JP, KR, SG, TH, MY, VN, ID, PH, US
- **5 个信号类型**：regulation, news (competition/macro/consumer_behavior), social_buzz, platform_policy
- **6 个采集器** + 2 个 opt-in 未启用（trends）

### 评级再更新

| 档位 | 国家 / 维度 | 说明 |
|---|---|---|
| ⭐⭐⭐⭐⭐ | 🇺🇸 US | 唯一含官方法规 + 多源覆盖 |
| ⭐⭐⭐⭐ | 🇸🇬 SG, 🇰🇷 KR, 🇯🇵 JP, **Reddit 英语区社媒声量** | 多源 + 带摘要 + 社媒信号 |
| ⭐⭐⭐ | 🇹🇭 TH, 🇮🇩 ID, 🇲🇾 MY, 🇻🇳 VN, 🇵🇭 PH | Google News + Tavily 摘要 |
| — | 电商平台公告 | 仍需修复（Shopify 真 RSS / Amazon SP-API / Lazada Playwright） |
