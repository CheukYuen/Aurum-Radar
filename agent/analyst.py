import os
import json
from pathlib import Path
from anthropic import Anthropic
from dotenv import load_dotenv
from tools import TOOLS, dispatch_tool

load_dotenv(dotenv_path=Path(__file__).parent / ".env", override=True)
if os.getenv("ANTHROPIC_BASE_URL"):
    os.environ.pop("ANTHROPIC_AUTH_TOKEN", None)

client = Anthropic(base_url=os.getenv("ANTHROPIC_BASE_URL"))
MODEL = os.environ["MODEL_ID"]

SYSTEM_PROMPT = """You are a luxury jewelry overseas market strategy analyst agent.

Task: Based on structured events in the database from the past 7 days, produce strategic assessments for Singapore, Dubai, and Milan.

MANDATORY requirements:
1. You MUST use tools to gather evidence — no judgment without data.
2. Call query_events_by_market for EACH of the 3 markets.
3. Call compare_markets at least once for cross-market pattern detection.
4. Call get_category_trend at least once to verify a trend.
5. If database evidence is thin, call search_web to supplement.
6. After 6-10 tool calls, output your final JSON — NO more tool calls after that.

Final output schema (output ONLY this JSON, no markdown fences):
{
  "markets": {
    "Singapore": {
      "state": "opportunity_rising | risk_rising | watch | stable",
      "key_changes": ["change1", "change2"],
      "opportunities": ["opp1"],
      "risks": ["risk1"],
      "watch_items": ["item1"],
      "evidence_event_ids": [1, 5, 12]
    },
    "Dubai": { ... },
    "Milan": { ... }
  },
  "cross_market_insight": "one-sentence cross-market insight"
}
"""


def _parse_json(text: str):
    text = text.strip()
    if text.startswith("```"):
        for p in text.split("```"):
            p = p.strip().lstrip("json").strip()
            if p.startswith("{"):
                try:
                    return json.loads(p)
                except json.JSONDecodeError:
                    continue
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start >= 0 and end > start:
            try:
                return json.loads(text[start : end + 1])
            except json.JSONDecodeError:
                pass
    return None


def run_analyst(conn, max_turns: int = 14):
    """Returns (judgments dict, full tool-use trace list)."""
    messages = [
        {
            "role": "user",
            "content": "Analyze Singapore / Dubai / Milan markets. Start collecting evidence with tools now.",
        }
    ]
    trace = []

    for turn in range(max_turns):
        resp = client.messages.create(
            model=MODEL,
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=messages,
        )

        turn_record = {
            "turn": turn + 1,
            "stop_reason": resp.stop_reason,
            "tool_calls": [],
            "text": "",
        }

        assistant_content = []
        tool_results_content = []

        for block in resp.content:
            if block.type == "thinking":
                # DeepSeek extended thinking: must be passed back with signature
                td = {"type": "thinking", "thinking": block.thinking}
                if hasattr(block, "signature") and block.signature:
                    td["signature"] = block.signature
                assistant_content.append(td)
            elif block.type == "text":
                turn_record["text"] = block.text
                assistant_content.append({"type": "text", "text": block.text})
            elif block.type == "tool_use":
                print(
                    f"  [Turn {turn+1}] 🔧 {block.name}({json.dumps(block.input, ensure_ascii=False)})"
                )
                result = dispatch_tool(block.name, block.input, conn)
                turn_record["tool_calls"].append(
                    {
                        "name": block.name,
                        "input": block.input,
                        "output_preview": str(result)[:400],
                    }
                )
                assistant_content.append(
                    {
                        "type": "tool_use",
                        "id": block.id,
                        "name": block.name,
                        "input": block.input,
                    }
                )
                tool_results_content.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": json.dumps(result, ensure_ascii=False),
                    }
                )

        trace.append(turn_record)
        messages.append({"role": "assistant", "content": assistant_content})

        if resp.stop_reason == "end_turn":
            judgment = _parse_json(turn_record["text"])
            if judgment and "markets" in judgment:
                return judgment, trace
            # Text reply but no valid JSON yet — ask for final output
            messages.append(
                {
                    "role": "user",
                    "content": "Please output ONLY the final JSON assessment now. No more tool calls.",
                }
            )
            continue

        # tool_use stop — feed results back
        if tool_results_content:
            messages.append({"role": "user", "content": tool_results_content})

    # Exceeded max_turns — force final answer
    messages.append(
        {
            "role": "user",
            "content": "Output ONLY the final JSON now. No tool calls.",
        }
    )
    final = client.messages.create(
        model=MODEL,
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=messages,
    )
    final_text = next((b.text for b in final.content if b.type == "text"), "")
    return _parse_json(final_text) or {}, trace
