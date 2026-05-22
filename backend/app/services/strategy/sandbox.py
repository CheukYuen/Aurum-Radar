"""Strategy sandbox — pipeline stage 7 «行动» implementation (architecture.md §17).

Six steps: variables → strategy matching → candidate plans → simulation →
ranking → three strategies. Then derives concrete action_items from the
chosen (best) strategy. Intermediate results are NOT persisted in the MVP
(§17.7) — only action_items hit the DB.
"""
from __future__ import annotations

from datetime import date

from loguru import logger
from sqlalchemy.orm import Session

from app.models import IntelligenceEvent, MarketSnapshot
from app.schemas import ActionItemIn, Priority
from app.services.llm import get_llm
from app.services.strategy import prompts
from app.services.strategy.library import RANKING_WEIGHTS, STRATEGY_BY_ID, STRATEGY_LIBRARY


# --- step 2 core: rule-based matcher (§17.6) ------------------------------

def match_strategies(variables: dict, top_n: int = 6) -> list[dict]:
    """Score every strategy against the variables; return the top N."""
    results = []
    for strat in STRATEGY_LIBRARY:
        score, matched_vars, risk_flags = 0, [], []
        for var, allowed in strat["suitable_conditions"].items():
            if variables.get(var, {}).get("value") in allowed:
                score += 1
                matched_vars.append(var)
        for var, danger in strat["avoid_conditions"].items():
            if variables.get(var, {}).get("value") in danger:
                score -= 2
                risk_flags.append(var)
        results.append({
            "strategy_id": strat["strategy_id"],
            "strategy_name": strat["strategy_name"],
            "classical_source": strat["classical_source"],
            "business_meaning": strat["business_meaning"],
            "match_score": score,
            "matched_variables": matched_vars,
            "risk_flags": risk_flags,
        })
    results.sort(key=lambda r: r["match_score"], reverse=True)
    return results[:top_n]


# --- DB read helpers ------------------------------------------------------

def _load_events(db: Session, market: str) -> list[dict]:
    rows = (
        db.query(IntelligenceEvent)
        .filter(IntelligenceEvent.market == market)
        .order_by(IntelligenceEvent.id)
        .all()
    )
    return [
        {
            "id": e.id,
            "event_type": e.event_type,
            "title": e.title,
            "summary": e.summary,
            "business_impact": e.business_impact,
            "impact_type": e.impact_type,
            "priority": e.priority,
            "opportunity_score": e.opportunity_score,
            "risk_score": e.risk_score,
        }
        for e in rows
    ]


def _load_snapshot(db: Session, market: str) -> dict:
    s = (
        db.query(MarketSnapshot)
        .filter(MarketSnapshot.market == market)
        .order_by(MarketSnapshot.id.desc())
        .first()
    )
    if s is None:
        return {}
    return {
        "opportunity_score": s.opportunity_score,
        "risk_score": s.risk_score,
        "overall_judgement": s.overall_judgement,
        "key_opportunities": s.key_opportunities,
        "key_risks": s.key_risks,
        "watch_items": s.watch_items,
        "event_count": s.event_count,
    }


# --- ranking (§17.8: LLM scores dims, rule computes weighted total) -------

def _weighted(scores: dict) -> float:
    return round(sum(scores.get(d, 0) * w for d, w in RANKING_WEIGHTS.items()), 3)


# --- action derivation ----------------------------------------------------

_PHASE_PRIORITY = {"0-3": Priority.P1, "3-6": Priority.P1, "6-12": Priority.P2}


def _derive_actions(market: str, best_strategy: dict) -> list[ActionItemIn]:
    """Concrete action_items come ONLY from the chosen strategy's action paths.

    A department appears only when an action path assigns it work — no
    per-department filler (§17.7).
    """
    actions: list[ActionItemIn] = []
    plan_name = best_strategy.get("plan_name", "")
    matched = best_strategy.get("matched_strategies", [])
    for path in best_strategy.get("action_paths", []):
        phase = str(path.get("phase", ""))
        priority = next(
            (p for k, p in _PHASE_PRIORITY.items() if k in phase), Priority.P1
        )
        action_text = path.get("action", "")
        actions.append(ActionItemIn(
            market=market,
            department=path.get("department", "未指定"),
            priority=priority,
            action_title=action_text[:60],
            action_detail=action_text,
            reason=f"上策「{plan_name}」/ 计策：{'、'.join(matched)} —— {best_strategy.get('core_logic', '')}",
            deadline=phase,
            expected_output=path.get("expected_output"),
            success_metric=path.get("success_metric"),
        ))
    return actions


# --- orchestrator ---------------------------------------------------------

def run_sandbox(db: Session, market: str) -> dict:
    """Run the 6-step strategy sandbox for one market.

    Persists derived action_items; returns the full reasoning chain in memory
    (not persisted — §17.7).
    """
    llm = get_llm()
    if not llm.is_configured:
        raise RuntimeError("DASHSCOPE_API_KEY not configured — strategy sandbox needs the LLM")

    events = _load_events(db, market)
    snapshot = _load_snapshot(db, market)
    logger.info(f"[strategy] {market}: {len(events)} events loaded")
    if not events:
        raise RuntimeError(f"No intelligence_events for {market} — run the main pipeline first")

    result: dict = {"market": market, "event_count": len(events)}

    # step 1 — strategic variables
    sys, usr = prompts.signal_to_variables(market, events, snapshot)
    raw = llm.chat_json(system=sys, user=usr, temperature=0.3)
    variables = raw.get("variables", {})
    result["situation_summary"] = raw.get("situation_summary", "")
    result["strategic_variables"] = variables
    logger.info(f"[strategy] {market}: {len(variables)} variables extracted")

    # step 2 — strategy matching (rule) + LLM explanation
    matched = match_strategies(variables)
    try:
        sys, usr = prompts.strategy_matching(variables, matched)
        explained = llm.chat_json(system=sys, user=usr, temperature=0.4).get("explained", [])
        by_id = {e.get("strategy_id"): e for e in explained}
        for m in matched:
            m.update({k: v for k, v in by_id.get(m["strategy_id"], {}).items()
                      if k != "strategy_id"})
    except Exception as exc:  # noqa: BLE001 - explanation is best-effort
        logger.warning(f"[strategy] matching explanation failed: {exc}")
    result["matched_strategies"] = matched
    logger.info(f"[strategy] {market}: matched {[m['strategy_name'] for m in matched]}")

    # step 3-4 — candidate plans + scenario simulation
    sys, usr = prompts.scenario_simulation(market, variables, matched)
    candidate_plans = llm.chat_json(system=sys, user=usr, temperature=0.5).get("candidate_plans", [])
    result["candidate_plans"] = candidate_plans
    logger.info(f"[strategy] {market}: {len(candidate_plans)} candidate plans")

    # step 5 — ranking (LLM scores dims, rule computes weighted total)
    sys, usr = prompts.strategy_ranking(candidate_plans)
    scored = llm.chat_json(system=sys, user=usr, temperature=0.3).get("scored_plans", [])
    plan_by_id = {p.get("plan_id"): p for p in candidate_plans}
    ranked = []
    for sp in scored:
        scores = sp.get("scores", {})
        plan = plan_by_id.get(sp.get("plan_id"), {})
        ranked.append({
            "plan_id": sp.get("plan_id"),
            "plan_name": plan.get("plan_name", ""),
            "combined_strategies": plan.get("combined_strategies", []),
            "scores": scores,
            "weighted_score": _weighted(scores),
            "reasoning": sp.get("reasoning", ""),
        })
    ranked.sort(key=lambda r: r["weighted_score"], reverse=True)
    for i, r in enumerate(ranked, 1):
        r["rank"] = i
    result["ranked_plans"] = ranked
    logger.info(f"[strategy] {market}: ranked, top = {ranked[0]['plan_name'] if ranked else 'N/A'}")

    # step 6 — three strategies (上 / 中 / 下策)
    sys, usr = prompts.three_strategies(market, result["situation_summary"], ranked)
    three = llm.chat_json(system=sys, user=usr, temperature=0.4)
    result["three_strategies"] = three

    # derive + persist action_items from the best strategy
    from app.database import repository

    best = three.get("best_strategy", {})
    actions = _derive_actions(market, best)
    persisted = repository.save_actions(db, actions)
    result["derived_action_count"] = persisted
    logger.info(f"[strategy] {market}: derived & persisted {persisted} action_items")

    return result
