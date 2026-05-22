import os
import sys
import json
import argparse
from pathlib import Path
from datetime import date, datetime
from dotenv import load_dotenv

# Must set env vars BEFORE importing modules that read MODEL_ID at module level
load_dotenv(dotenv_path=Path(__file__).parent / ".env", override=True)
if os.getenv("ANTHROPIC_BASE_URL"):
    os.environ.pop("ANTHROPIC_AUTH_TOKEN", None)

parser = argparse.ArgumentParser(description="Aurum Radar — run once")
parser.add_argument("--model", default=None, help="flash | pro | full model ID")
args = parser.parse_args()

MODEL_ALIASES = {"flash": "deepseek-v4-flash", "pro": "deepseek-v4-pro"}
if args.model:
    os.environ["MODEL_ID"] = MODEL_ALIASES.get(args.model, args.model)

MODEL_ID = os.environ["MODEL_ID"]
MODEL_SLUG = MODEL_ID.split("-")[-1]  # "flash" or "pro"

import db
from sources import collect_rss, collect_tavily, SEED_QUERIES
from extractor import extract_event
from analyst import run_analyst
from brief import generate_brief


# ── markdown run log helpers ──────────────────────────────────────────────────

def _md_extraction_table(records: list[dict]) -> str:
    rows = ["| # | 原始标题 | 结果 | Market | Category | Impact | Confidence |",
            "|---|---------|------|--------|----------|--------|------------|"]
    for r in records:
        if r["event"]:
            e = r["event"]
            rows.append(
                f"| {r['i']} | {r['title'][:40]} | ✅ | {e.get('market','')} "
                f"| {e.get('category','')} | {e.get('impact','')} | {e.get('confidence','')} |"
            )
        else:
            rows.append(f"| {r['i']} | {r['title'][:40]} | ⏭ skip | — | — | — | — |")
    return "\n".join(rows)


def _md_agent_trace(trace: list[dict]) -> str:
    lines = []
    for t in trace:
        lines.append(f"\n### Turn {t['turn']} `stop={t['stop_reason']}`\n")
        for tc in t["tool_calls"]:
            lines.append(
                f"- 🔧 **`{tc['name']}`**  \n"
                f"  input: `{json.dumps(tc['input'], ensure_ascii=False)}`  \n"
                f"  output: `{tc['output_preview'][:200]}`\n"
            )
        if t["text"]:
            preview = t["text"][:600].replace("\n", " ")
            lines.append(f"\n> {preview}…\n")
    return "\n".join(lines)


def _save_run_log(
    output_dir: Path,
    today: str,
    rss_count: int,
    tavily_count: int,
    extraction_records: list,
    saved_count: int,
    trace: list,
    judgments: dict,
):
    total_calls = sum(len(t["tool_calls"]) for t in trace)
    md = f"""# Run Log — {MODEL_ID} — {today}

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

---

## Step 1: 数据采集

| 来源 | 条数 |
|------|------|
| RSS | {rss_count} |
| Tavily | {tavily_count} |
| **合计** | **{rss_count + tavily_count}** |

---

## Step 2: LLM 结构化抽取

{rss_count + tavily_count} 条原始 → **{saved_count} 条入库**

{_md_extraction_table(extraction_records)}

---

## Step 3: Agent Tool Call Trace

轮数：**{len(trace)}** | Tool 调用：**{total_calls} 次**

{_md_agent_trace(trace)}

---

## Step 4: 最终判断 JSON

```json
{json.dumps(judgments, ensure_ascii=False, indent=2)}
```

---

→ 简报见 `brief_{today}_{MODEL_SLUG}.md`
"""
    path = output_dir / f"run_log_{today}_{MODEL_SLUG}.md"
    path.write_text(md, encoding="utf-8")
    return path


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    today = date.today().isoformat()
    outputs = Path(__file__).parent / "outputs"
    outputs.mkdir(exist_ok=True)

    conn = db.init()

    print("=" * 60)
    print(f"Model: {MODEL_ID}")
    print("=" * 60)

    print("\nStep 1: 采集公开信息")
    print("-" * 40)
    rss_items = collect_rss()
    tavily_items = collect_tavily(SEED_QUERIES, max_results=4)
    raw = rss_items + tavily_items
    print(f"  RSS: {len(rss_items)} | Tavily: {len(tavily_items)} | 合计: {len(raw)}")

    print("\nStep 2: LLM 结构化抽取")
    print("-" * 40)
    extraction_records = []
    saved = 0
    for i, item in enumerate(raw, 1):
        event = extract_event(item)
        extraction_records.append({"i": i, "title": item["title"], "event": event})
        if event:
            db.save_event(conn, event)
            saved += 1
        if i % 5 == 0 or i == len(raw):
            print(f"  {i}/{len(raw)} 处理，入库 {saved} 条")

    print(f"\nStep 3: 🌟 Agent loop")
    print("-" * 40)
    judgments, trace = run_analyst(conn)
    total_calls = sum(len(t["tool_calls"]) for t in trace)
    print(f"\n  轮数: {len(trace)} | Tool 调用: {total_calls}")

    print("\nStep 4: 生成简报 + Run Log")
    print("-" * 40)
    all_events = db.query_events(conn, days=7)
    brief_md = generate_brief(judgments, len(all_events), trace)

    brief_path = outputs / f"brief_{today}_{MODEL_SLUG}.md"
    trace_path = outputs / f"trace_{today}_{MODEL_SLUG}.json"
    judgments_path = outputs / f"judgments_{today}_{MODEL_SLUG}.json"

    brief_path.write_text(brief_md, encoding="utf-8")
    trace_path.write_text(json.dumps(trace, ensure_ascii=False, indent=2), encoding="utf-8")
    judgments_path.write_text(json.dumps(judgments, ensure_ascii=False, indent=2), encoding="utf-8")

    log_path = _save_run_log(
        outputs, today, len(rss_items), len(tavily_items),
        extraction_records, saved, trace, judgments
    )

    print(f"  ✅ Brief:     {brief_path}")
    print(f"  ✅ Run Log:   {log_path}   ← LLM 过程全记录")
    print(f"  ✅ Trace:     {trace_path}")
    print(f"  ✅ Judgments: {judgments_path}")
    print(f"\nDONE — {MODEL_ID}")


if __name__ == "__main__":
    main()
