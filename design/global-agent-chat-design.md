# Aurum Radar — Global Agent Chat 设计方案

> 版本：v2.0 | 日期：2026-05-23 | 状态：**MVP 已实现（commit ca9aa39）**

**职责划分：**
- 本文档负责人：Global Agent Chat（后端 API + 前端 ChatDrawer）
- 上游依赖：管道 Stage 3-7 落库，由另一同事负责（TH 市场已完成）

---

## 目录

0. [前置依赖与交接契约](#0-前置依赖与交接契约)
1. [整体架构](#1-整体架构)
2. [已实现内容（MVP）](#2-已实现内容mvp)
3. [API 规范（实际使用）](#3-api-规范实际使用)
4. [Chip 上下文映射（核心）](#4-chip-上下文映射核心)
5. [前端组件设计](#5-前端组件设计)
6. [Token 预算与多轮对话结构](#6-token-预算与多轮对话结构)
7. [后续迭代方向](#7-后续迭代方向)

---

## 0. 前置依赖与交接契约

### 0.1 当前数据库状态（2026-05-23 已核实）

| 表 | 行数 | 说明 |
|----|------|------|
| `raw_documents` | 1487 | ✅ SG/JP/TH/MY/KR/VN/PH/ID/US/CN |
| `intelligence_events` | **14** | ✅ TH 市场，P0×3 / P1×9 / P2×2 |
| `market_snapshots` | **1** | ✅ TH，opp=28 / risk=26 |
| `daily_briefs` | **1** | ✅ TH，2026-05-23 |
| `council_reports` | **1** | ✅ TH，5份专家报告 + 综合判断 |
| `action_items` | **7** | ✅ TH，P0×6 + P1×1，全部 pending |

**覆盖市场：目前仅 TH（泰国），SG/JP 等市场待同事继续落库。**  
Agent Chat 对空表 graceful degradation：无数据时该 chip 加载后返回"暂无数据"，不报错。

### 0.2 Agent Chat 只读的表字段

| 表 | 通过哪个 REST 接口读取 |
|----|----------------------|
| `daily_briefs` | `GET /api/brief/latest?market={m}` |
| `market_snapshots` | `GET /api/markets/{market}` |
| `intelligence_events` | `GET /api/events?market={m}&size=20` |
| `action_items` | `GET /api/actions?market={m}` |
| `council_reports` | （暂未接入 chip，后续可加）|

不直接查 DB，所有数据走已有 REST 接口，前端拉取并格式化后注入 prompt。

---

## 1. 整体架构

```
[前端] AgentChatDrawer (React, 420px 右侧滑出)
        │
        │  1. chip 点击 → 拉对应 REST 接口 → 格式化为文本块缓存
        │
        │  2. 用户发送 → 选中 chip 文本块 + 用户问题 → 拼成 user message
        │
        │  POST /api/agents/stream
        │    { type: "general_chat" | "correlation_analysis",
        │      session_id: "sess-xxx",
        │      messages: [{role, content}, ...] }   ← 完整历史（含上下文块）
        ▼
[后端] routes_agents.py  ← 已有，按 type 路由
        ├── GeneralChatAgent (NEW)
        │     agent_type = "general_chat"
        │     接受任意 messages，prepend system prompt，调 chat_stream_messages
        │
        └── IntelligenceCorrelationAgent (已有)
              agent_type = "correlation_analysis"
              要求 messages 中出现 ≥3 个 #数字 格式事件 ID
        │
        ▼
[LLM] DashScope (qwen-plus，chat_stream_messages，多轮 messages 数组)
        │
        ▼
[前端] SSE token 流 → 气泡逐字追加 ▋
```

**关键设计决策：**
- 复用现有 `POST /api/agents/stream`，不新建路由
- 上下文注入在**前端**完成（拉 REST → 格式化文本 → 注入 user message），后端无感知
- 多轮历史由前端维护，每次发送传完整 `messages` 数组；session_id 仅用于后端识别会话
- UI 气泡只显示用户原始问题，不显示注入的上下文块

---

## 2. 已实现内容（MVP）

### 后端改动（commit ca9aa39）

| 文件 | 改动 |
|------|------|
| `backend/app/agents/general_chat_agent.py` | **新建**。`agent_type="general_chat"`，接受完整 messages 历史，prepend system prompt，流式输出纯文本 |
| `backend/app/services/llm/dashscope.py` | 新增 `chat_stream_messages(messages)` — 接受完整 messages 数组支持多轮 |
| `backend/app/main.py` | 注册 `GeneralChatAgent`（在 `CorrelationAgent` 之前） |

`GeneralChatAgent` system prompt 核心指令：
```
你是 Aurum Radar 的战略情报助理，服务于周大福珠宝品牌的海外市场战略决策团队。
消息开头可能包含【今日战略简报】【市场判断】【高优先级事件】【部门行动建议】等上下文片段，
请优先依据这些内容回答。
回答：直接结论 → 关键依据（引用 #事件ID 或 action#ID）→ 建议下一步。
纯文本输出，不要 JSON、代码块或 markdown 标题。
```

### 前端改动（commit ca9aa39）

| 文件 | 改动 |
|------|------|
| `frontend/src/api/agentStream.ts` | **新建**。封装 `streamAgent()` async generator，解析 SSE 流，yield `{content, sessionId, done, error}` |
| `frontend/src/api/chipContext.ts` | **新建**。定义 `CHIP_DEFS` + `buildChipContext(id, country)`，各 chip 对应的拉取逻辑与文本格式 |
| `frontend/src/components/agent/AgentChatDrawer.tsx` | 改写。chip 可选切换、首次点击拉数据缓存、多轮 sessionId、流式 token 渲染、删除 CANNED 假数据 |
| `frontend/src/App.tsx` | 向 `AgentChatDrawer` 传入 `currentCountry={filters.country}` |
| `frontend/src/index.css` | 新增 `@keyframes spin`（chip loading 动画） |

---

## 3. API 规范（实际使用）

### 发起 / 续接对话（流式）

```
POST /api/agents/stream
```

**Request:**
```json
{
  "type": "general_chat",
  "session_id": "sess-abc123",
  "messages": [
    { "role": "user", "content": "【今日战略简报 2026-05-23】\n综合: 泰国市场...\n\n## 提问\n免签政策终止对我们影响有多大？" },
    { "role": "assistant", "content": "影响主要体现在三个层面：..." },
    { "role": "user", "content": "那金价上涨的影响呢？" }
  ]
}
```

- `session_id`：不传则自动新建，首个 SSE chunk 带回 `session_id`
- `messages`：完整历史数组，system 层由后端 agent 自动 prepend，前端只传 user/assistant
- `type`：`general_chat`（通用）或 `correlation_analysis`（关联分析，需 ≥3 个 `#数字` 事件 ID）

**Response（SSE 流）：**
```
data: {"id":"agent-xxx","session_id":"sess-abc","choices":[{"delta":{"role":"assistant"}}]}

data: {"id":"agent-xxx","session_id":"sess-abc","choices":[{"delta":{"content":"影响"}}]}
data: {"id":"agent-xxx","session_id":"sess-abc","choices":[{"delta":{"content":"主要"}}]}
...
data: {"id":"agent-xxx","choices":[{"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

### 查看已注册 Agent

```
GET /api/agents
→ {"agents": [{"agent_type":"general_chat",...}, {"agent_type":"correlation_analysis",...}]}
```

---

## 4. Chip 上下文映射（核心）

点击 chip → 首次拉数据并缓存 → 发送时注入 user message 前缀。

| Chip | 触发 REST | 注入文本格式 | 对 `type` 的影响 |
|---|---|---|---|
| **今日战略简报** | `GET /api/brief/latest?market={current}` | `【今日战略简报 {briefDate}】\n综合: {executiveSummary}\n机会: {opp1}; {opp2}\n风险: {risk1}; {risk2}\n（情报 {sourceCount} 条, 事件 {eventCount} 条）` | 不切，`general_chat` |
| **{国家} 市场判断** | `GET /api/markets/{current}` | `【{name} 市场判断】状态: {status} \| opp={score} \| 竞争={competitionLabel}\n机会: ...\n风险: ...\n关注: ...` | 不切，label 随顶栏国家动态更新 |
| **高优先级事件** | `GET /api/events?market={current}&size=20` 客户端过滤 `priority=high` | `【高优先级事件 top N】\n[#{id} P0/P1 {signalDirection}] {title} — {keyClaim}` **ID 必须保留**，供关联分析正则提取 | 不切，但暴露事件 ID |
| **部门行动建议** | `GET /api/actions?market={current}` 每部门取第一条 top 6 | `【部门行动建议 (top N)】\n[{dept} {priority}] {title} — 截止 {when}` | 不切 |
| **关联分析** | 不拉数据；**自动联动勾选「高优先级事件」** | 注入空字符串（仅切换 type） | **切换为 `correlation_analysis`**；前端校验 messages 中 `#数字` ≥ 3 个，否则拦截提示 |

**注入组装逻辑（`doSend`）：**
```
ctxBlocks = [chipCache[id] for id in selected if id != 'correlation']
userContent = ctxBlocks.join('\n\n') + '\n\n## 提问\n' + userText   // 有 ctx 时
           OR userText                                                // 无 ctx 时

发送到后端 messages 最后一条 role=user content=userContent
UI 气泡只显示 userText（原始问题，不显示注入块）
```

---

## 5. 前端组件设计

### 组件结构

```
AgentChatDrawer (AgentChatDrawer.tsx)
├── Header
│   ├── Aurum Agent 标题 + 副标题
│   └── ContextChips（5 个可点击 button）
│       ├── 选中态：gold-tint 背景 + gold-2 边框 + 加粗
│       ├── 加载态：spin 动画小圆圈
│       └── 失败态：红色边框 + ✕ 前缀
├── ScrollArea（消息列表）
│   ├── SuggestedQuestions（messages 为空时显示）
│   ├── UserBubble（右对齐，金色渐变气泡）
│   ├── LoadingBubble（三点脉冲动画）
│   └── AgentBubble（左对齐，pre-wrap 纯文本 + 流式光标 ▋）
└── InputBar
    ├── InlineError（关联分析 ID 不足时显示）
    ├── Input（Enter 发送，Shift+Enter 换行）
    └── Send button（streaming 中 disabled + opacity 0.6）
```

### State 设计

```ts
messages: ChatMessage[]           // UI 展示用，含 loading/streaming 状态
selected: Set<ChipId>             // 当前选中的 chip
chipCache: Map<ChipId, string>    // chip 首次加载后的上下文文本，drawer 生命周期内不重拉
chipLoading: Set<ChipId>          // 加载中的 chip
sessionIdRef: Ref<string | null>  // 多轮 session ID，从首个 SSE chunk 写入
streamingRef: Ref<boolean>        // 防止重复提交
```

### 关键文件路径

```
frontend/src/
  api/
    agentStream.ts      ← streamAgent() async generator
    chipContext.ts      ← CHIP_DEFS + buildChipContext(id, country)
  components/agent/
    AgentChatDrawer.tsx ← 主组件
```

---

## 6. Token 预算与多轮对话结构

### 各 chip 上下文估算（基于 TH 真实数据）

| Chip | 约 tokens |
|---|---|
| 今日战略简报（exec summary + top opp/risk） | ~600 |
| 市场判断（opp/risk/watch） | ~200 |
| 高优先级事件（P0×3 + P1×8，含 ID） | ~1000 |
| 部门行动建议（top 6 条） | ~400 |
| **全选合计** | **~2200** |

qwen-plus 上下文 128k；即使全选 chip + 6 轮历史（~3000 tokens），总计 ~5200 tokens，远低于限制。

### 多轮 messages 数组结构

```python
# Turn 1（选了「今日战略简报」chip）
messages = [
    # GeneralChatAgent 自动 prepend system prompt（~120 tokens）
    {"role": "user",      "content": "【今日战略简报 2026-05-23】\n综合: ...\n\n## 提问\n免签政策影响？"},
]

# Turn 2（继续追问，chip 选中状态保持，重新拼接上下文）
messages = [
    {"role": "user",      "content": "【今日战略简报...】\n\n## 提问\n免签政策影响？"},
    {"role": "assistant", "content": "影响主要体现在三个层面：..."},
    {"role": "user",      "content": "【今日战略简报...】\n\n## 提问\n那金价上涨的影响呢？"},
]
```

> 每轮 user message 都重新拼接当前选中 chip 的上下文（数据不重拉，用缓存），确保 LLM 每轮都有完整背景。

---

## 7. 后续迭代方向

以下内容未在 MVP 中实现，供后续参考：

| 功能 | 说明 |
|---|---|
| council_report chip | 新增「专家委员会」chip，接 `GET /api/markets/{m}/council`，注入 council_summary + key_signals + strategic_options |
| 滚动窗口截断 | 超过 6 轮时截取最近 6 轮历史，防止 token 过长 |
| 流式取消按钮 | Send 变 Stop，AbortController 终止 SSE 读取 |
| localStorage 恢复 | 页面刷新后恢复 session_id + messages（需注意 chip 缓存一并清空） |
| Evidence chip 联动 | Agent 回复中如果引用了 `#44` → 点击可打开 IntelDetail 详情 |
| DailyBriefingDrawer 联动 | 简报内「继续追问」按钮 → 自动选中「今日战略简报」chip 打开 Agent |
| 上游市场落库 | SG/JP 等市场同事落库后，chip 数据自动覆盖（代码无需改动） |
