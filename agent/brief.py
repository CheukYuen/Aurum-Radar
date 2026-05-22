import os
import json
from pathlib import Path
from datetime import date
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent / ".env", override=True)
if os.getenv("ANTHROPIC_BASE_URL"):
    os.environ.pop("ANTHROPIC_AUTH_TOKEN", None)

client = Anthropic(base_url=os.getenv("ANTHROPIC_BASE_URL"))
MODEL = os.environ["MODEL_ID"]

BRIEF_PROMPT = """Based on the strategic judgments JSON below, generate a **Daily Strategy Brief** in Markdown.

Strategic judgments:
{judgments}

Event count in DB: {event_count}
Agent tool calls: {tool_call_count} calls across {turn_count} turns

Output ONLY Markdown following this exact structure:

# Aurum Radar 每日战略简报 — {today}

## 一、今日市场态势

| 市场 | 状态 | 核心变化 |
|------|------|----------|
| Singapore | ... | ... |
| Dubai | ... | ... |
| Milan | ... | ... |

## 二、关键变化（按市场）

### Singapore
### Dubai
### Milan

## 三、业务影响判断

### 机会
### 风险
### 需关注

## 四、跨市场洞察

## 五、行动建议

- **市场部**：
- **产品部**：
- **品牌部**：
- **法务合规**：

## 六、数据说明

事件数：{event_count} | Agent 工具调用：{tool_call_count} 次 | 生成时间：{today}
"""


def generate_brief(judgments: dict, event_count: int, trace: list) -> str:
    today = date.today().isoformat()
    tool_call_count = sum(len(t["tool_calls"]) for t in trace)
    turn_count = len(trace)

    prompt = BRIEF_PROMPT.format(
        judgments=json.dumps(judgments, ensure_ascii=False, indent=2),
        event_count=event_count,
        tool_call_count=tool_call_count,
        turn_count=turn_count,
        today=today,
    )

    resp = client.messages.create(
        model=MODEL,
        max_tokens=3000,
        messages=[{"role": "user", "content": prompt}],
    )
    return next((b.text for b in resp.content if b.type == "text"), "")
