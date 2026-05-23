---
name: intelligence-correlation-analysis
description: 当用户要求"分析事件关联"、"查找事件间因果链路"、"识别跨市场联动"、"检测情报时序模式"、"发现隐性依赖"、"运行关联分析"，或提到"关联分析"、"传导链路"、"跨市场关联"、"因果分析"、"时序模式"、"信息关联"、"隐性依赖"时应使用此技能。当多条情报事件需要从关系角度而非孤立视角审视时同样适用。
version: 1.0.0
---

# 信息关联分析

对多条结构化情报事件进行跨市场、跨品类、跨时间维度的关联分析，识别事件间的
因果传导链路与隐性依赖关系——这些关系在事件被孤立审视时是不可见的。

## 解决什么问题

主流水线将情报拆分为独立事件并评分，但事件间的关联被丢失：

1. **跨市场传导盲区**：黄金期货波动 → 迪拜零售需求变化 → 东南亚婚庆金消费变化，
   这类传导链被拆散为孤立事件。
2. **相关与因果混淆**：两件事同时发生不等于因果，共因与巧合必须被排除。
3. **隐性依赖遗漏**：受同一底层因素（汇率、地缘政策）驱动但表面上无关的事件，
   未被归组。

## 适用场景

- 同一或不同市场的一批情报事件（≥3 条）需要关联分析
- 需要理解多个事件为何同时发生
- 智囊团或看板输出需要比单条评分更深层的跨事件洞察

## 分析工作流

### 第一步：事件分组

按 `market`、`region`、`category` 对事件分组。识别跨组的候选关联对——
`impact_scope`、`env_factors` 或 `tags` 有重叠的事件对。

### 第二步：关联边识别

对每对候选事件，判定：

- **correlation_type**：`causal`（因果）| `reinforcing`（互相强化）|
  `contradicting`（矛盾）| `co_occurrence`（共现）| `lead_lag`（领先滞后）
- **strength**：`strong` | `moderate` | `weak`
- **time_lag_days**：两事件间的日历天数差
- **mechanism**：为什么这两个事件有关联（不是"它们时间接近"，而是传导机制）

### 第三步：因果链构建

构建多级传导链（A → B → C）。对每条链路：

- 为每个节点分配角色：`trigger`（触发）| `amplifier`（放大）|
  `mediator`（中介）| `outcome`（结果）
- 估算从触发到结果的 `total_lag_days`
- **必须**提供 `alternative_explanation`：是否存在共因可以解释首尾两端？
  因果方向是否可能反转？

### 第四步：时序模式检测

扫描时间线，识别：

- **周期性**模式（节日消费周期、金价季节性波动）
- **领先-滞后**对（一个市场持续先于另一个市场变动）
- **趋势加速/反转**（intensity 或 signal_direction 发生转向）
- **同步变动**（跨市场或跨品类同时转向）

至少需要 2 个时间点的信号才能声称存在模式；单次观测不构成模式。

### 第五步：隐性依赖挖掘

识别表面上无直接关联、但可能受同一底层因素驱动的事件群。例如"美元走强"
同时驱动金价下跌和新兴市场需求萎缩。每条隐性依赖需要：

- 推测的底层驱动因素
- 受影响的事件 ID 列表
- 支撑该假设的证据
- 置信度评分

## 领域铁律

1. **相关 ≠ 因果** — 因果声明必须给出机制推理，不可仅凭时序先后推断因果。
2. **尊重传导时滞** — 跨市场/品类传导有典型时滞范围，超出范围的关联降低 confidence。
3. **品类分化** — 不同品类（投资金/饰品金/婚庆金/悦己消费）对同一信号的响应
   方向可能相反。
4. **排除共因** — 在声明 A→B 之前，检查 C→A 且 C→B 是否是更合理的解释。
5. **证据不足降置信度** — 单一来源、未验证社媒、单时间点：confidence 不得超过
   medium（0.6）。
6. **保留分歧** — 对关联方向或强度存在合理分歧时，记录分歧而非取平均抹平。

## 输出格式

产出单个 JSON 对象，符合 `references/output_schema.json` 定义的 Schema。核心段落：

```json
{
  "correlation_summary": "3-5 句整体关联结论",
  "correlation_edges": [
    {
      "source_id": "evt-12",
      "target_id": "evt-34",
      "correlation_type": "lead_lag",
      "strength": "moderate",
      "description": "传导机制说明",
      "time_lag_days": 5,
      "evidence_ids": ["evt-12", "evt-34"],
      "confidence": 0.7
    }
  ],
  "causal_chains": [
    {
      "chain_id": "chain_01",
      "nodes": [
        {"event_id": "evt-12", "role": "trigger", "mechanism": "..."},
        {"event_id": "evt-34", "role": "mediator", "mechanism": "..."},
        {"event_id": "evt-56", "role": "outcome", "mechanism": "..."}
      ],
      "description": "...",
      "total_lag_days": 12,
      "alternative_explanation": "...",
      "evidence_ids": ["evt-12", "evt-34", "evt-56"],
      "confidence": 0.65
    }
  ],
  "temporal_patterns": [],
  "hidden_dependencies": [],
  "evidence_chain": [],
  "expert_disagreements": [],
  "confidence": {"level": "medium", "score": 0.65, "rationale": "..."},
  "next_observation_points": []
}
```

每条关联边、因果链、时序模式、隐性依赖都必须绑定 `evidence_ids`。
没有证据 → 不写结论。

## 输入格式

接收符合 `references/input_schema.json` 的 JSON 对象：`batch_meta`（market、
region、time_window）+ `items` 结构化情报事件数组。可选 `historical_context`
用于时序模式匹配。

## 附加资源

- **`references/input_schema.json`** — 完整输入 JSON Schema
- **`references/output_schema.json`** — 完整输出 JSON Schema
- **`examples/`** — 输入输出样例
