"""Prompts for the strategy sandbox — architecture.md §17.8.

Each builder returns (system, user). Output contracts are JSON; the caller
validates. Kept separate from app/services/llm so §12 stays generic.
"""
from __future__ import annotations

import json

from app.services.strategy.library import STRATEGIC_VARIABLES, STRATEGY_LIBRARY

_SYSTEM = "你是周大福海外市场战略谋士，像古代谋士一样基于情报推演战略，严格输出 JSON。"


def _dump(obj) -> str:
    return json.dumps(obj, ensure_ascii=False, indent=2)


# --- step 1: signals -> strategic variables -------------------------------

def signal_to_variables(market: str, events: list[dict], snapshot: dict) -> tuple[str, str]:
    var_list = "\n".join(f"  {k} — {v}" for k, v in STRATEGIC_VARIABLES.items())
    user = f"""市场：{market}

该市场当日结构化情报事件（intelligence_events）：
{_dump(events)}

该市场研判背景（market_snapshot）：
{_dump(snapshot)}

任务：把上述情报判读为 14 个战略变量。**只判断变量，不要给行动建议。**
变量及含义：
{var_list}

每个变量取值必须是 low / medium / high / unknown 之一。
输出 JSON：
{{
  "situation_summary": "3-4 句中文局势判断",
  "variables": {{
    "market_attractiveness": {{
      "value": "high|medium|low|unknown",
      "confidence": 0.0-1.0,
      "reasoning": "判断依据，引用具体情报",
      "supporting_event_ids": [事件id]
    }}
    // ... 其余 13 个变量同样格式，14 个都要给
  }}
}}"""
    return _SYSTEM, user


# --- step 2: explain strategy matches -------------------------------------

def strategy_matching(variables: dict, matched: list[dict]) -> tuple[str, str]:
    user = f"""战略变量：
{_dump(variables)}

规则匹配器从策略库选出的候选策略（match_score 已由规则算出，不要改动 strategy_id）：
{_dump(matched)}

任务：逐条解释为什么这些策略适配当前局势。不得编造策略库不存在的 strategy_id。
输出 JSON：
{{
  "explained": [
    {{
      "strategy_id": "...",
      "matched_variables": ["..."],
      "why_applicable": "为什么适配，引用变量",
      "potential_conflict": "与其它策略或局势的潜在冲突",
      "recommended_priority": "high|medium|low"
    }}
  ]
}}"""
    return _SYSTEM, user


# --- step 3-4: candidate plans + scenario simulation ----------------------

def scenario_simulation(market: str, variables: dict, matched: list[dict]) -> tuple[str, str]:
    lib = [
        {"strategy_id": s["strategy_id"], "strategy_name": s["strategy_name"],
         "business_meaning": s["business_meaning"]}
        for s in STRATEGY_LIBRARY
    ]
    user = f"""市场：{market}

战略变量：
{_dump(variables)}

候选策略（来自策略库）：
{_dump(matched)}

策略库速查：
{_dump(lib)}

任务：把候选策略组合成 3-5 个候选战略方案，并对每个方案做沙盘推演。
必须体现策略库思想（如轻骑探路、借港登岸、文化定锚、华圈破冰…），不要只写「开店 / 快闪 / 观察」。
输出 JSON：
{{
  "candidate_plans": [
    {{
      "plan_id": "plan_1",
      "plan_name": "方案名（体现计策）",
      "combined_strategies": ["strategy_id", "..."],
      "core_logic": "方案核心逻辑",
      "consumer_reaction": "消费者反应推演",
      "competitor_reaction": "竞品反应推演",
      "channel_reaction": "渠道反应推演",
      "regulatory_considerations": "合规考量",
      "expected_short_term_result": "0-6 个月预期结果",
      "expected_mid_term_result": "6-12 个月预期结果",
      "success_signals": ["..."],
      "failure_signals": ["..."]
    }}
  ]
}}"""
    return _SYSTEM, user


# --- step 5: rank plans ---------------------------------------------------

def strategy_ranking(candidate_plans: list[dict]) -> tuple[str, str]:
    user = f"""候选战略方案：
{_dump(candidate_plans)}

任务：对每个方案在 7 个维度打分（整数 1-5）。
注意：risk_exposure / investment_cost / execution_difficulty 分数越高代表负面越强。
维度：opportunity_gain, risk_exposure, investment_cost, execution_difficulty,
validation_speed, strategic_reversibility, long_term_brand_value。
**只打单维分，不要自己算综合分**——综合分由规则按权重计算。
输出 JSON：
{{
  "scored_plans": [
    {{
      "plan_id": "...",
      "scores": {{
        "opportunity_gain": 1-5, "risk_exposure": 1-5, "investment_cost": 1-5,
        "execution_difficulty": 1-5, "validation_speed": 1-5,
        "strategic_reversibility": 1-5, "long_term_brand_value": 1-5
      }},
      "reasoning": "打分理由"
    }}
  ]
}}"""
    return _SYSTEM, user


# --- step 6: three strategies (上 / 中 / 下策) ----------------------------

def three_strategies(
    market: str, situation_summary: str, ranked_plans: list[dict]
) -> tuple[str, str]:
    user = f"""市场：{market}
局势判断：{situation_summary}

已按规则综合评分排序的方案（rank 1 最优）：
{_dump(ranked_plans)}

任务：把排序结果转成上策 / 中策 / 下策。
要求：不要泛泛行动清单；要写清「因为哪些信号与变量 → 推荐什么计策组合 → 如何降低风险 / 抓住机会 → 用什么指标验证」。
行动路径里**每个动作只标注真正涉及的部门**（如渠道团队、市场营销团队、商品团队、法务合规团队、电商运营团队、管理层），未涉及的部门不要硬凑任务。
输出 JSON：
{{
  "best_strategy":   {{ ...见下字段... }},
  "middle_strategy": {{ ... }},
  "low_strategy":    {{ ... }},
  "agent_conclusion": "谋士总结，3-5 句"
}}
每一策的字段：
{{
  "label": "上策 / 中策 / 下策",
  "plan_name": "对应方案名",
  "core_logic": "核心逻辑",
  "matched_strategies": ["策略名"],
  "why_this_tier": "为什么是这一策",
  "key_benefits": ["..."],
  "key_risks": ["..."],
  "preconditions": ["适用前提"],
  "action_paths": [
    {{"phase": "0-3个月|3-6个月|6-12个月", "department": "负责部门",
      "action": "具体动作", "expected_output": "预期产出", "success_metric": "验证指标"}}
  ],
  "validation_metrics": ["关键验证指标"]
}}"""
    return _SYSTEM, user
