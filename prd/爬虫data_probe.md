# Claude Code Prompt｜新建独立数据获取验证目录

你现在是一个资深 Python 数据工程师。

请不要修改现有 `backend/` 目录。

请在项目根目录下新建一个独立目录：

```text
data_probe/
```

这个目录只用于验证 MVP 阶段的数据源是否可以成功获取，不负责正式后端服务、不写入业务数据库、不接入 FastAPI。

---

# 一、目标

实现一个轻量级数据获取验证模块，用来测试以下数据源是否能正常获取：

1. 新闻数据
2. 竞品官网数据
3. 平台公告数据
4. 法规公告数据
5. 金价与汇率数据
6. 高端商场活动数据

目标不是做完整系统，而是验证：

```text
能不能请求成功
能不能解析标题 / 摘要 / URL
能不能保存为 JSON
能不能给后续 Agent 使用
```

---

# 二、目录结构

请生成：

```text
data_probe/
├── README.md
├── requirements.txt
├── .env.example
├── config/
│   ├── sources.yaml
│   └── keywords.yaml
├── scripts/
│   ├── run_all.py
│   ├── probe_news.py
│   ├── probe_competitors.py
│   ├── probe_platform_policy.py
│   ├── probe_regulations.py
│   ├── probe_market_data.py
│   └── probe_malls.py
├── src/
│   ├── __init__.py
│   ├── http_client.py
│   ├── parsers.py
│   ├── storage.py
│   └── normalizer.py
└── output/
    ├── raw/
    └── normalized/
```

---

# 三、技术要求

使用：

```text
Python 3.11+
httpx
beautifulsoup4
pydantic
pydantic-settings
python-dotenv
PyYAML
loguru
```

可选：

```text
feedparser
```

暂时不要使用：

```text
FastAPI
SQLAlchemy
APScheduler
数据库
复杂爬虫框架
```

---

# 四、配置文件

## config/sources.yaml

需要支持配置：

```yaml
news:
  - name: Channel News Asia
    market: Singapore
    url: https://www.channelnewsasia.com/search?search=gold%20jewellery
    method: html

competitors:
  - brand: Tiffany
    market: Singapore
    url: https://www.tiffany.com/jewelry/
    method: html

platform_policy:
  - platform: Shopee
    market: Singapore
    url: https://seller.shopee.sg/edu/home
    method: html

regulations:
  - name: Singapore Customs
    market: Singapore
    url: https://www.customs.gov.sg/
    method: html

market_data:
  gold:
    provider: goldapi
  fx:
    provider: exchangerate

malls:
  - name: Marina Bay Sands
    market: Singapore
    url: https://www.marinabaysands.com/shopping.html
    method: html
```

---

# 五、环境变量

生成 `.env.example`：

```env
NEWS_API_KEY=
SERPAPI_API_KEY=
FIRECRAWL_API_KEY=
GOLDAPI_API_KEY=
EXCHANGE_RATE_API_KEY=
HTTP_TIMEOUT=20
USER_AGENT=Mozilla/5.0 AurumRadarDataProbe/0.1
```

如果 API key 为空：

```text
不要报错退出
直接跳过对应 API 模式
或者使用 HTML fallback
```

---

# 六、统一输出格式

每个 probe 脚本输出两份文件：

```text
output/raw/{source_type}_{timestamp}.json
output/normalized/{source_type}_{timestamp}.json
```

normalized 格式统一为：

```json
{
  "source_type": "news",
  "market": "Singapore",
  "entity": "Channel News Asia",
  "title": "",
  "summary": "",
  "url": "",
  "published_at": "",
  "fetched_at": "",
  "status": "success",
  "error": null
}
```

如果失败：

```json
{
  "source_type": "news",
  "market": "Singapore",
  "entity": "Channel News Asia",
  "title": null,
  "summary": null,
  "url": "https://example.com",
  "published_at": null,
  "fetched_at": "",
  "status": "failed",
  "error": "timeout or parse error"
}
```

---

# 七、各脚本要求

## scripts/probe_news.py

功能：

- 读取 `config/sources.yaml` 的 news
- 请求网页
- 尝试解析页面 title
- 尝试解析前 5 个链接标题
- 输出 raw 和 normalized JSON

---

## scripts/probe_competitors.py

功能：

- 读取 competitors
- 请求竞品官网页面
- 解析页面 title
- 提取页面中与以下关键词相关的链接：

```text
new
collection
store
campaign
jewelry
press
news
```

---

## scripts/probe_platform_policy.py

功能：

- 读取 platform_policy
- 请求平台公告页
- 提取页面标题
- 提取包含以下关键词的链接：

```text
policy
fee
category
jewelry
compliance
seller
announcement
```

---

## scripts/probe_regulations.py

功能：

- 读取 regulations
- 请求官方监管网站
- 提取页面标题
- 提取包含以下关键词的链接：

```text
gold
jewellery
precious metal
import
customs
consumer
advertising
```

---

## scripts/probe_market_data.py

功能：

- 如果有 GOLDAPI_API_KEY，调用 GoldAPI
- 如果有 EXCHANGE_RATE_API_KEY，调用 ExchangeRate API
- 如果没有 key，则输出 skipped 状态
- 不要阻塞整体运行

---

## scripts/probe_malls.py

功能：

- 读取 malls
- 请求商场页面
- 提取页面 title
- 提取包含以下关键词的链接：

```text
jewellery
jewelry
luxury
event
popup
promotion
watch
```

---

## scripts/run_all.py

功能：

依次运行：

```text
probe_news.py
probe_competitors.py
probe_platform_policy.py
probe_regulations.py
probe_market_data.py
probe_malls.py
```

最后输出一个汇总文件：

```text
output/probe_summary_{timestamp}.json
```

汇总内容：

```json
{
  "total_sources": 0,
  "success_count": 0,
  "failed_count": 0,
  "skipped_count": 0,
  "by_source_type": {
    "news": {
      "success": 0,
      "failed": 0,
      "skipped": 0
    }
  }
}
```

---

# 八、README 要求

README 需要包含：

```bash
cd data_probe
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python scripts/run_all.py
```

并解释：

```text
这个目录只是数据源验证层
验证通过后，再迁移到正式 backend/services
```

---

# 九、代码质量要求

要求：

- 每个脚本可以单独运行
- run_all.py 可以统一运行
- 网络异常不能导致整体中断
- 每个源都要有 status
- 输出 JSON 使用 UTF-8
- 日志清晰
- 不要写死太多逻辑
- sources.yaml 可扩展

---

# 十、最终输出

请直接生成完整代码。

不要进入正式 backend 开发。

不要设计数据库。

不要设计 API。

先完成：

```text
data_probe 独立数据获取验证层
```