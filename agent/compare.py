"""Run flash → pro sequentially (Tavily cached after first run), then diff."""
import os
import sys
import json
import subprocess
from pathlib import Path
from datetime import date

TODAY = date.today().isoformat()
OUTPUTS = Path(__file__).parent / "outputs"


def run_model(slug: str):
    print(f"\n{'='*60}")
    print(f"  Running model: {slug}")
    print(f"{'='*60}\n")
    result = subprocess.run(
        [sys.executable, "run_once.py", "--model", slug],
        cwd=Path(__file__).parent,
    )
    if result.returncode != 0:
        print(f"[warn] {slug} run exited with code {result.returncode}")


def load_judgments(slug: str) -> dict:
    p = OUTPUTS / f"judgments_{TODAY}_{slug}.json"
    if not p.exists():
        return {}
    return json.loads(p.read_text(encoding="utf-8"))


def load_brief(slug: str) -> str:
    p = OUTPUTS / f"brief_{TODAY}_{slug}.md"
    if not p.exists():
        return "_文件不存在_"
    return p.read_text(encoding="utf-8")


def load_run_log_stats(slug: str) -> str:
    p = OUTPUTS / f"run_log_{TODAY}_{slug}.md"
    if not p.exists():
        return ""
    text = p.read_text(encoding="utf-8")
    # Extract the Step 3 header line
    for line in text.splitlines():
        if "Tool 调用" in line:
            return line.strip()
    return ""


def build_compare_md(flash_j: dict, pro_j: dict) -> str:
    markets = ["Singapore", "Dubai", "Milan"]

    # State comparison table
    rows = ["| 市场 | Flash 状态 | Pro 状态 | 一致？ |",
            "|------|-----------|---------|-------|"]
    for m in markets:
        fs = flash_j.get("markets", {}).get(m, {}).get("state", "—")
        ps = pro_j.get("markets", {}).get(m, {}).get("state", "—")
        match = "✅" if fs == ps else "⚠️ 不同"
        rows.append(f"| {m} | `{fs}` | `{ps}` | {match} |")
    state_table = "\n".join(rows)

    # Cross-market insight comparison
    fi = flash_j.get("cross_market_insight", "—")
    pi = pro_j.get("cross_market_insight", "—")

    # Per-market detail diff
    detail_sections = []
    for m in markets:
        fd = flash_j.get("markets", {}).get(m, {})
        pd = pro_j.get("markets", {}).get(m, {})

        def fmt_list(lst):
            return "\n".join(f"  - {x}" for x in lst) if lst else "  _无_"

        detail_sections.append(f"""
### {m}

**Flash — opportunities:**
{fmt_list(fd.get('opportunities', []))}

**Pro — opportunities:**
{fmt_list(pd.get('opportunities', []))}

**Flash — risks:**
{fmt_list(fd.get('risks', []))}

**Pro — risks:**
{fmt_list(pd.get('risks', []))}
""")

    flash_stats = load_run_log_stats("flash")
    pro_stats = load_run_log_stats("pro")

    return f"""# 模型对比报告 — Flash vs Pro — {TODAY}

## 状态判断对比

{state_table}

## 跨市场洞察对比

| | 内容 |
|---|---|
| **Flash** | {fi} |
| **Pro** | {pi} |

## 各市场机会/风险详细对比

{"".join(detail_sections)}

---

## Agent 行为统计

| | Flash | Pro |
|---|---|---|
| Tool 调用 | {flash_stats} | {pro_stats} |

---

## 完整简报

→ `brief_{TODAY}_flash.md`
→ `brief_{TODAY}_pro.md`

→ LLM 过程全记录：`run_log_{TODAY}_flash.md` / `run_log_{TODAY}_pro.md`
"""


def main():
    run_model("flash")
    run_model("pro")   # Tavily 全部命中缓存，不消耗额度

    flash_j = load_judgments("flash")
    pro_j = load_judgments("pro")

    compare_md = build_compare_md(flash_j, pro_j)
    compare_path = OUTPUTS / f"compare_{TODAY}.md"
    compare_path.write_text(compare_md, encoding="utf-8")

    print(f"\n{'='*60}")
    print(f"对比报告: {compare_path}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
