from __future__ import annotations

from typing import Any

from loguru import logger
from stevedore import ExtensionManager

from app.services.skills.base import SkillPlugin


class SkillRegistry:
    """通过 stevedore 发现、加载和缓存 skill 插件。"""

    NAMESPACE = "aurum_radar.skills"

    def __init__(self) -> None:
        self._manager: ExtensionManager | None = None
        self._skills: dict[str, SkillPlugin] = {}

    def init(self) -> None:
        """启动时调用：扫描 entry_points，加载所有 skill 插件。"""
        self._manager = ExtensionManager(
            namespace=self.NAMESPACE,
            invoke_on_load=True,
            propagate_map_exceptions=True,
        )
        for ext in self._manager:
            plugin: SkillPlugin = ext.obj
            self._skills[ext.name] = plugin
            logger.info(f"[skills] loaded plugin: {ext.name} v{plugin.version}")
        logger.info(f"[skills] registry initialized: {len(self._skills)} plugins")

    def list_skills(self) -> list[dict[str, str]]:
        return [
            {"name": p.name, "description": p.description, "version": p.version}
            for p in self._skills.values()
        ]

    def get_skill(self, name: str) -> SkillPlugin | None:
        return self._skills.get(name)

    def run_skill(self, name: str, input_data: dict[str, Any], **kwargs: Any) -> dict[str, Any]:
        plugin = self._skills.get(name)
        if plugin is None:
            raise KeyError(f"Skill not found: {name}")
        return plugin.run(input_data, **kwargs)


_registry: SkillRegistry | None = None


def get_skill_registry() -> SkillRegistry:
    global _registry
    if _registry is None:
        _registry = SkillRegistry()
    return _registry
