# 珠宝海外市场战略情报智囊团 Skill

> 在情报清洗结果之后，引入五位领域专家 Skill 对同一批市场情报**并行分析**，
> 再由总参谋 Skill 汇总为**管理层可直接执行**的战略决策报告。

本 skill 是 Aurum-Radar 主流水线**阶段 7「行动」**的实现（见 `backend/architecture.md §17`）。
skill 文件本身只含角色定义与契约，不含运行框架；由后端 `app/services/council/` 包加载执行。

---

## 1. 这个模块解决什么问题

Aurum-Radar 主流水线是：**采集 → 清洗 → 抽取结构化事件 → 评分 → 研判 → 简报 → 行动**。

阶段 7「行动」原先是「高优先级事件 → 单个 LLM + 部门模板 → 部门任务」，产出常沦为「市场部做营销 / 法务部看合规」这类正确但无信息量的建议，存在三个问题：

1. **视角单一**：一个 prompt 同时看品类、竞品、消费者、风险、战略，每个维度都浅。
2. **判断不可追溯**：结论与证据脱钩，"金价涨=利好"这类粗判断难以拦截。
3. **不可直接执行**：输出常停在"需关注 XX"，没有落到部门、品类、渠道、动作。

智囊团用**专家分工 + 强制证据绑定 + 总参谋综合**解决这三点：五位专家各自只在自己领域深挖，每个判断必须绑定情报 `id`，总参谋负责交叉验证、裁定分歧、拆解到部门行动。

## 2. 为什么不是单一 LLM 总结，而是专家智囊团

| 维度 | 单一 LLM 总结 | 专家智囊团 |
|------|--------------|-----------|
| 视角 | 一个 prompt 兼顾所有维度，互相稀释 | 五个专家各自深挖一个维度 |
| 偏差 | 容易被最显眼的情报锚定 | 专家并行、互不看对方输出，减少锚定 |
| 分歧 | 内部矛盾被"和稀泥"抹平 | 分歧显式保留在 `expert_disagreements` |
| 证据 | 结论与证据易脱钩 | 每个专家强制绑定 `evidence_ids` |
| 金价等陷阱 | 易出现"金价涨=利好"粗判断 | 风险专家强制拆分投资金/饰品金/婚庆金/悦己 |
| 战略叙事 | 缺乏体系化谋略 | 兵法谋士融合孙子兵法 + 毛选 + 12 条策略库 |
| 可执行性 | 常停在"需关注" | 总参谋强制拆到部门+市场+品类+渠道+动作 |

## 3. 目录结构

```
jewelry_intelligence_council/
├── README.md                          # 本文件
├── council.yaml                       # 智囊团配置（专家清单 / 执行模式 / 政策）
├── input_schema.json                  # 情报输入格式（intelligence_batch）
├── output_schema.json                 # 决策输出格式（决策报告）
├── experts/                           # 专家 Skill 定义（七段结构）
│   ├── product_marketing_strategist.md   # 产品营销战略专家
│   ├── competitor_strategy_analyst.md    # 竞品战略专家
│   ├── consumer_insight_analyst.md       # 消费者洞察专家
│   ├── risk_compliance_analyst.md        # 风险合规专家
│   ├── military_strategist.md            # 兵法谋士（融合孙子/毛选/策略库）
│   └── chief_strategy_officer.md         # 总参谋（综合环节）
├── knowledge/                         # 兵法谋士的谋略知识库
│   ├── strategy_library.json             # 12 条兵法策略库（周大福海外市场专属计策）
│   ├── sunzi-strategy/                   # vendored：孙子兵法 skill（13 条原则）
│   └── maoxuan/                          # vendored：毛选 skill（7 心智模型 + 10 启发式）
├── prompts/
│   ├── council_orchestrator.md        # 编排 prompt（并行 → 综合）
│   └── synthesis_prompt.md            # 总参谋综合 prompt
└── examples/
    ├── sample_intelligence.json       # 5 条示例情报（可运行 demo 输入）
    └── sample_council_output.json     # 对应的完整预期输出
```

执行模式：`parallel_then_synthesis` —— 五位专家并行，总参谋串行综合。

```
intelligence_batch（清洗结果）
        │
        ├──▶ 产品营销战略专家 ─┐
        ├──▶ 竞品战略专家     ─┤
        ├──▶ 消费者洞察专家   ─┼──▶ 总参谋 ──▶ 决策报告
        ├──▶ 风险合规专家     ─┤
        └──▶ 兵法谋士         ─┘
```

## 4. 兵法谋士与谋略知识库

兵法谋士（`military_strategist`）是唯一带外部知识库的专家，融合三套 skill 形态的谋略知识：

| 知识源 | 路径 | 作用 |
|--------|------|------|
| 孙子兵法 skill | `knowledge/sunzi-strategy/` | 通用谋略透镜：定战场 / 敌我 / 虚实 / 势（13 条原则） |
| 毛选 skill | `knowledge/maoxuan/` | 通用谋略透镜：抓主要矛盾 / 一分为二 / 纸老虎论（7 心智模型） |
| 12 条兵法策略库 | `knowledge/strategy_library.json` | 行业落地 playbook：把通用谋略落到珠宝出海的具体计策 |

孙子、毛选两套 skill 按快照 vendoring，保留各自 README / LICENSE 作署名。兵法谋士**只取其分析框架当透镜，不做角色扮演、不用第一人称**，输出严格是智囊团 JSON 契约；其 `strategic_options_seed` 供总参谋构造上中下三策（含 `classical_basis` 兵法依据）。

## 5. 输入 / 输出格式

### 输入：`input_schema.json`

一次智囊团调用接收一个 `intelligence_batch`：`batch_meta`（market / region / time_window）+ `items[]`。由后端 `council/adapter.py` 从 `intelligence_events` 表聚合而来。完整定义见 [input_schema.json](input_schema.json)，样例见 [examples/sample_intelligence.json](examples/sample_intelligence.json)。

### 输出：`output_schema.json`

总参谋产出单个 JSON 决策报告，含：`council_summary`、`key_signals`、`opportunities`、`risks`、`watch_items`、`strategic_options`（上/中/下策，含 `classical_basis`）、`department_actions`（产品/营销/渠道/管理层/风险）、`evidence_chain`、`expert_disagreements`、`confidence`、`next_observation_points`。完整定义见 [output_schema.json](output_schema.json)，样例见 [examples/sample_council_output.json](examples/sample_council_output.json)。

## 6. 如何接入主项目

本 skill 是主流水线**阶段 7「行动」**的实现，由后端 `backend/app/services/council/` 包加载执行：

- `loader.py`：扫描本目录，加载 `council.yaml`、`experts/*.md`、`prompts/*.md`、`knowledge/`。
- `adapter.py`：把 `intelligence_events` 按 market 聚合为 `intelligence_batch`。
- `orchestrator.py`：五专家并行 → 总参谋综合 → 决策报告。
- `actions.py`：从 `department_actions` 派生 `action_items` 落库。

决策报告经 `GET /api/markets/{market}/council` 即时返回；详见 `backend/architecture.md §17`。

## 7. 如何扩展新的专家 Skill

新增一位专家（例如「ESG / 可持续珠宝专家」）：

1. 在 `experts/` 新建 `{expert_id}.md`，**复用七段结构**：`Role` / `Scope` / `Input` / `Analysis Framework` / `Output Contract` / `Rules` / `Questions for Other Experts`，frontmatter 写 `role_type: expert`（`loader.py` 据此自动发现）。
2. 在 `council.yaml` 的 `experts` 列表追加一项。
3. 在 `prompts/council_orchestrator.md` 阶段一专家清单中加入该专家。
4. 同步 `experts/chief_strategy_officer.md` 的 `Input` 段与 `prompts/synthesis_prompt.md`。
5. 给 `examples/` 样例补一条对应该专家关注点的情报。

每位专家**只深挖一个维度**，维度之间尽量正交；重叠的判断交给总参谋裁定。

## 8. 设计铁律速查

| 原则 | 一句话 |
|------|--------|
| 证据绑定 | 没有 `evidence_ids` 的判断不写 |
| 证据不足降置信度 | 单一来源 / 未验证社媒 / 单时间点 → 不得高于 medium |
| 金价不简单等于利好 | 必须区分投资金 / 饰品金 / 婚庆金 / 悦己消费 |
| 行动具体化 | 落到部门 + 市场 + 品类 + 渠道 + 动作 |
| sentiment ≠ impact | 来源情绪 ≠ 对我方业务的影响方向 |
| 保留分歧 | 专家冲突如实写入 `expert_disagreements`，不和稀泥 |
| 兵法不空谈 | 计策必须用 `strategy_library.json` 真实存在的 `strategy_id` |
| 可直接执行 | 输出面向管理层，无需二次翻译 |
