# agent — Claude 上下文说明

`agent/` 是 Aurum Radar 的核心 AI 分析层。基于 DeepSeek（Anthropic-compatible API）实现一个可完整 demo 的奢侈珠宝海外市场 **agentic daily brief** pipeline。

---

## 快速启动

```bash
cd agent
pip install -r requirements.txt
# 确认 .env 已填写 ANTHROPIC_API_KEY / ANTHROPIC_BASE_URL / MODEL_ID / TAVILY_API_KEY

# 单模型跑一次
python run_once.py --model flash
python run_once.py --model pro

# 两模型对比（Tavily 第二次全走缓存，不消耗额度）
python compare.py
```

输出文件见 `outputs/`。

---

## 目录结构

```
agent/
├── .env                  # API keys + model 配置
├── requirements.txt
├── cache.py              # Tavily 结果文件缓存（TTL 24h）
├── db.py                 # SQLite schema：events + briefs 两张表
├── sources.py            # RSS（feedparser）+ Tavily 采集
├── extractor.py          # LLM 结构化抽取（单条 → JSON event）
├── tools.py              # Agent 的 4 个工具实现
├── analyst.py            # 🌟 Agentic loop 主体（tool use）
├── brief.py              # Daily brief Markdown 生成
├── run_once.py           # 入口：--model flash|pro
├── compare.py            # 两模型对比跑，生成 compare_*.md
└── outputs/
    ├── brief_{date}_{model}.md        # 每日简报
    ├── run_log_{date}_{model}.md      # LLM 全过程记录（可读）
    ├── trace_{date}_{model}.json      # Agent tool call trace（demo 用）
    ├── judgments_{date}_{model}.json  # 结构化判断
    ├── compare_{date}.md              # Flash vs Pro 对比报告
    └── tavily_cache.json              # Tavily 查询缓存
```

---

## Pipeline 4 步

```
Step 1  采集      RSS（3 个 feed）+ Tavily 搜索（SEED_QUERIES × 5 条）
            ↓
Step 2  抽取      LLM 逐条处理 → JSON event → SQLite events 表
            ↓
Step 3  分析      Market Analyst Agent（tool use loop，6-10 轮）
            ↓
Step 4  生成      LLM 将判断 JSON 渲染为 Markdown 简报 + run_log
```

---

## 模型配置（`.env`）

| 变量 | 说明 |
|---|---|
| `ANTHROPIC_API_KEY` | DeepSeek API key（格式 `sk-...`） |
| `ANTHROPIC_BASE_URL` | `https://api.deepseek.com/anthropic` |
| `MODEL_ID` | 默认值，`--model flash/pro` 可覆盖 |
| `TAVILY_API_KEY` | Tavily 搜索 key（`tvly-...`） |

`--model flash` → `deepseek-v4-flash`  
`--model pro`   → `deepseek-v4-pro`

---

## Agent 工具集（`tools.py`）

| Tool | 用途 |
|---|---|
| `query_events_by_market` | 查某市场近 N 天的结构化事件 |
| `compare_markets` | 对比 2-3 市场在某维度的事件密度 |
| `search_web` | Tavily 实时搜索（带缓存）|
| `get_category_trend` | 统计某 category 的趋势强度 |

Agent 每次运行 6-10 轮对话，调用 14-25 次工具，最终输出结构化判断 JSON。

---

## DeepSeek V4 适配说明（重要）

DeepSeek V4（flash/pro）开启**扩展思考（Extended Thinking）**，与标准 Anthropic API 有 3 处差异：

1. **ThinkingBlock 在前**：`resp.content` 第一个 block 是 `type="thinking"`，不能用 `resp.content[0].text`，要用：
   ```python
   text = next((b.text for b in resp.content if b.type == "text"), "")
   ```

2. **Thinking block 必须回传**：多轮对话中，assistant message 必须包含 thinking block（带 `signature` 字段），否则 API 返回 400：
   ```python
   if block.type == "thinking":
       td = {"type": "thinking", "thinking": block.thinking}
       if hasattr(block, "signature") and block.signature:
           td["signature"] = block.signature
       assistant_content.append(td)
   ```

3. **`max_tokens` 要留足**：thinking tokens 占用 token 配额，extractor 建议 ≥ 800，analyst ≥ 4096。

---

## Tavily 缓存（`cache.py`）

- 缓存文件：`outputs/tavily_cache.json`
- TTL：24 小时
- `sources.py` 的 `collect_tavily` 和 `tools.py` 的 `search_web` 均接入缓存
- 效果：`compare.py` 跑两个模型时，第二次 `0 API calls, 5 cache hits`

---

## 运行时环境

- Python 3.9 + macOS LibreSSL 2.8.3
- `urllib3` 会有 `NotOpenSSLWarning`，可忽略（不影响功能）
- 网络请求走本地代理 `127.0.0.1:7897`（feedparser + Tavily 均通过 urllib）

---

## 输出文件说明

| 文件 | 用途 |
|---|---|
| `brief_{date}_{model}.md` | 每日战略简报（人类可读）|
| `run_log_{date}_{model}.md` | LLM 全过程记录：采集量、逐条抽取结果、agent trace、最终 JSON |
| `trace_{date}_{model}.json` | Agent tool call trace（demo 给评委看）|
| `judgments_{date}_{model}.json` | 结构化判断 JSON |
| `compare_{date}.md` | Flash vs Pro 状态对比 + 洞察差异 |
