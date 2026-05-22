# 智囊团编排 Prompt（Council Orchestrator）

> 本 prompt 驱动「珠宝海外市场战略情报智囊团」的完整一轮分析：五位专家并行 → 总参谋综合。
> 调用方（后端 council 包 / 脚本 / 人工）把本文件内容作为编排指令，按阶段填充并执行。

## 执行模式

`parallel_then_synthesis`：五位专家对**同一批情报**并行独立分析，互不看对方输出；随后总参谋综合五份输出。

```
intelligence_batch（清洗结果）
        │
        ├──▶ 产品营销战略专家 ─┐
        ├──▶ 竞品战略专家     ─┤
        ├──▶ 消费者洞察专家   ─┼──▶ 总参谋（synthesis）──▶ 决策报告
        ├──▶ 风险合规专家     ─┤
        └──▶ 兵法谋士         ─┘
```

## 输入

一个符合 `input_schema.json` 的 `intelligence_batch` 对象：
- `batch_meta`：market、region、time_window、item_count。
- `items[]`：清洗后的结构化情报数组。

编排前先做三项检查：
1. `items` 非空，且每条含 `id` / `category` / `event_summary` / `confidence`。
2. `id` 唯一——证据链依赖它。
3. 统计一手来源（`regulator` / `brand_official` / `report`）占比，记下来传给总参谋做置信度结算。

## 阶段一：五专家并行分析

为五位专家各启动一次独立调用。每次调用的 prompt 结构如下：

```
你是【{专家名}】。严格遵循你的 Skill 定义文件：
experts/{expert_file}.md

下面是本轮需要分析的情报批次（JSON）：
{intelligence_batch}

任务：
1. 只在你的 Scope 范围内分析，超范围的转为 questions_for_experts。
2. 按你的 Analysis Framework 逐条处理情报。
3. 每个判断绑定 evidence_ids，证据不足则降置信度。
4. 严格按你的 Output Contract 输出单个 JSON 对象，无 markdown 代码围栏。
```

五位专家：
- 产品营销战略专家 — `experts/product_marketing_strategist.md`
- 竞品战略专家 — `experts/competitor_strategy_analyst.md`
- 消费者洞察专家 — `experts/consumer_insight_analyst.md`
- 风险合规专家 — `experts/risk_compliance_analyst.md`
- 兵法谋士 — `experts/military_strategist.md`（额外注入三套谋略知识源：`knowledge/sunzi-strategy/`、`knowledge/maoxuan/`、`knowledge/strategy_library.json`）

**并行要求**：五位专家不得看到彼此的输出，避免锚定。各自的 `questions_for_experts` 是给总参谋裁定用的，不在本阶段回传给被质询专家。

**收集**：阶段一结束时应得到五个 JSON 对象，记为 `expert_outputs`。

## 阶段二：总参谋综合

把五份 `expert_outputs`、原始 `intelligence_batch`、以及阶段零统计的一手来源占比，一并交给总参谋。综合指令见 `prompts/synthesis_prompt.md`。

## 全局铁律（编排器对所有阶段强制）

- **不允许泛泛而谈**：每个判断必须可回溯到具体情报 `id`。
- **证据绑定**：没有 `evidence_ids` 的判断不得进入任何输出。
- **证据不足降置信度**：单一来源 / 未验证社媒 / 单时间点观测 → 置信度不得高于 medium。
- **金价不简单等同利好**：任何金价结论必须区分投资金条 / 饰品金 / 婚庆金 / 悦己消费。
- **行动具体化**：行动建议必须落到部门、市场、品类、渠道、动作。
- **sentiment ≠ impact**：情报来源的情绪倾向不等于对我方业务的影响方向。
- **保留分歧**：专家冲突如实传递给总参谋，不在编排层抹平。
- **可直接执行**：最终输出面向管理层与业务团队，无需二次翻译。
- **兵法落地**：兵法谋士的计策匹配必须用 `strategy_library.json` 里真实存在的 `strategy_id`，不得编造。

## 输出

总参谋产出的单个 JSON 对象，必须通过 `output_schema.json` 校验。失败则回退总参谋阶段重试一次；仍失败则原样返回并标注 schema 校验未通过。

## 降级与异常

| 情况 | 处理 |
|------|------|
| 某专家调用失败 | 不阻塞其他专家；总参谋在 `caveats`/`confidence.rationale` 标注缺失该视角，整体置信度下调一档。 |
| `items` 少于 3 条 | 仍执行，但总参谋整体置信度不得高于 medium，并在 `next_observation_points` 要求补采。 |
| 一手来源占比 < 30% | 总参谋置信度 `level` 不得为 high。 |
| 专家输出非合法 JSON | 对该专家重试一次；仍失败则视为该专家调用失败，按上行处理。 |
