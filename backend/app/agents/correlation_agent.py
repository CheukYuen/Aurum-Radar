from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from loguru import logger
from sqlalchemy.orm import Session

from app.agents.base import BaseAgent
from app.models.intelligence_event import IntelligenceEvent


class IntelligenceCorrelationAgent(BaseAgent):
    """情报关联分析 Agent — 封装 intelligence-correlation-analysis skill。

    职责：查询 DB → 构造 input_data → 调用 Skill → 返回结果。
    """

    @property
    def agent_type(self) -> str:
        return "correlation_analysis"

    def can_handle(self, query: dict[str, Any]) -> bool:
        return query.get("type") == self.agent_type

    def run(self, query: dict[str, Any], db: Session) -> dict[str, Any]:
        from app.services.skills.registry import get_skill_registry

        # 1. 查询事件
        event_ids = query.get("event_ids")
        market = query.get("market")
        time_window = query.get("time_window")

        q = db.query(IntelligenceEvent)

        if event_ids:
            q = q.filter(IntelligenceEvent.id.in_(event_ids))
        elif market:
            q = q.filter(IntelligenceEvent.market == market)

        if time_window:
            start = time_window.get("start")
            end = time_window.get("end")
            if start:
                q = q.filter(IntelligenceEvent.created_at >= start)
            if end:
                q = q.filter(IntelligenceEvent.created_at <= end)
        else:
            # 默认最近 30 天
            q = q.filter(
                IntelligenceEvent.created_at >= datetime.utcnow() - timedelta(days=30)
            )

        events = q.order_by(IntelligenceEvent.created_at.desc()).all()

        if len(events) < 3:
            raise ValueError(
                f"关联分析至少需要 3 条事件，当前查询到 {len(events)} 条"
            )

        # 2. 构造 input_data（匹配 input_schema.json）
        items = [self._map_event(e) for e in events]
        input_data = {
            "batch_meta": {
                "market": market or events[0].market or "UNKNOWN",
                "time_window": time_window or self._default_time_window(events),
                "item_count": len(items),
            },
            "items": items,
        }

        # 3. 调用 Skill
        registry = get_skill_registry()
        skill_name = "intelligence-correlation-analysis"
        if registry.get_skill(skill_name) is None:
            raise RuntimeError(f"Skill not loaded: {skill_name}")

        logger.info(
            f"[correlation_agent] running skill with {len(items)} events"
        )
        result = registry.run_skill(skill_name, input_data)

        # 4. 补充元数据
        result["agent_type"] = self.agent_type
        result["input_event_count"] = len(items)
        return result

    # ---- 内部方法 ----

    @staticmethod
    def _map_event(event: IntelligenceEvent) -> dict[str, Any]:
        """将 DB IntelligenceEvent 映射为 input_schema.json 中的 item 格式。"""
        extra = event.extra or {}
        item: dict[str, Any] = {
            "event_id": str(event.id),
            "collected_at": event.created_at.isoformat() if event.created_at else None,
            "source_category": event.source_category,
            "env_factors": event.env_factors or [],
            "impact_scope": event.impact_scope or [],
            "signal_direction": event.signal_direction,
            "intensity": event.intensity,
            "confidence": float(event.confidence) if event.confidence is not None else None,
        }

        # 可选字段
        if event.market:
            item["market"] = event.market
        if event.region:
            item["region"] = event.region
        if event.key_claim:
            item["key_claim"] = event.key_claim
        if event.summary:
            item["event_summary"] = event.summary
        if event.conduction_chain:
            item["conduction_chain"] = event.conduction_chain
        if event.source_url:
            item["source_url"] = event.source_url

        # extra 中的字段
        for key in ("published_at", "source_name", "source_type", "tags"):
            if key in extra:
                item[key] = extra[key]

        return item

    @staticmethod
    def _default_time_window(events: list[IntelligenceEvent]) -> dict[str, str]:
        dates = [e.created_at for e in events if e.created_at]
        if not dates:
            return {"start": "2026-01-01", "end": "2026-12-31"}
        return {
            "start": min(dates).strftime("%Y-%m-%d"),
            "end": max(dates).strftime("%Y-%m-%d"),
        }
