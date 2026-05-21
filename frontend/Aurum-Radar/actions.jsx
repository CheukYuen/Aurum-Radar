/* global React, Icon */
const { useState: useStateAC } = React;

/* ============================================================
   Action Recommendations — department lists
   ============================================================ */

const DEPTS = [
  {
    id: "mkt", name: "市场部", sub: "Marketing", icon: "diamond", priority: "high",
    cycle: "本月", owner: "市场负责人 / 区域负责人",
    summary: [
      { text: "核心商圈曝光提升", when: "立即" },
      { text: "节日营销活动策划", when: "本月" },
      { text: "KOL 内容合作拓展", when: "2 周内" },
      { text: "竞品投放监测",     when: "持续" },
    ],
    goal: "提升新加坡核心商圈品牌曝光与高净值客群触达",
    steps: [
      { title: "加大乌节路与滨海湾核心商圈投放", goal: "覆盖高净值客群与旅游消费人群", how: "投放商场屏幕广告、奢侈品会员渠道广告", when: "立即启动" },
      { title: "策划新加坡本地节日营销活动",     goal: "结合婚庆、礼赠、高端消费场景",     how: "推出限定款主题活动与门店预约体验",  when: "本月完成方案" },
      { title: "拓展本地 KOL / 珠宝生活方式博主合作", goal: "提升社媒声量与年轻客群触达",   how: "筛选 10–15 位本地高净值生活方式 KOL", when: "2 周内完成名单" },
      { title: "建立竞品投放监测",               goal: "跟踪 Maison Aurelia、Cartelle、Lune 等竞品动作", how: "每周汇总广告、活动、门店陈列变化", when: "持续执行" },
    ],
    refs: [
      { icon: "map",   text: "地图洞察: 乌节路、滨海湾门店密度高" },
      { icon: "feed",  text: "情报中心: 高端珠宝需求与旅游零售恢复" },
      { icon: "alert", text: "风险提示: 核心商圈租金较高，需提升投放转化效率" },
    ],
  },
  {
    id: "pdt", name: "产品部", sub: "Product", icon: "ring", priority: "high",
    cycle: "本月", owner: "产品负责人 / 设计总监",
    summary: [
      { text: "轻奢系列新品开发", when: "本月" },
      { text: "本地偏好款式优化", when: "本月" },
      { text: "供应链交付周期优化", when: "持续" },
      { text: "可持续材质试点",   when: "本月" },
    ],
    goal: "面向亚太市场拓宽轻奢与可持续产品线，提升上新节奏",
    steps: [
      { title: "开发新加坡限定轻奢系列",   goal: "适配年轻客群与日常佩戴场景",   how: "联合本地设计师推出 8 SKU 胶囊系列",   when: "本月立项" },
      { title: "优化本地热销款式 SKU 结构", goal: "提升核心 SKU 库存周转率",       how: "下架长尾 SKU，强化热销款式备货",       when: "2 周内完成评估" },
      { title: "缩短亚太供应链交付周期",     goal: "支持快速上新与节假日补货",     how: "评估香港与本地物流合作伙伴",         when: "本月完成评估" },
      { title: "可持续材质与培育钻石试点",   goal: "对接 ESG 与年轻消费叙事",       how: "选取 3 个 SKU 进行可持续材质试销",   when: "本月启动" },
    ],
    refs: [
      { icon: "feed",  text: "情报中心: TikTok Old Money 风格走热" },
      { icon: "feed",  text: "情报中心: 培育钻石价格下行" },
      { icon: "alert", text: "风险提示: 新品 SKU 库存压力" },
    ],
  },
  {
    id: "chn", name: "渠道部", sub: "Channel", icon: "store", priority: "mid",
    cycle: "本月", owner: "渠道负责人 / 区域 BD",
    summary: [
      { text: "东南亚电商合作拓展", when: "本月" },
      { text: "头部零售商合作优化", when: "本月" },
      { text: "线下门店陈列优化",   when: "本月" },
      { text: "经销商赋能培训",     when: "持续" },
    ],
    goal: "巩固现有渠道，拓展东南亚线上线下机会",
    steps: [
      { title: "拓展东南亚头部电商合作",   goal: "覆盖新马泰核心电商平台",         how: "对接 Shopee、Lazada 珠宝品类负责人", when: "本月完成签约" },
      { title: "升级头部商场陈列与橱窗",   goal: "提升门店转化与品牌感知",         how: "联合视觉团队制定 Q3 陈列方案",       when: "本月完成方案" },
      { title: "建立经销商赋能培训体系",   goal: "提升经销商高端 SKU 转化",         how: "推出月度产品 + 销售技巧培训",       when: "持续执行" },
      { title: "评估新增门店选址",         goal: "西部裕廊东高潜区域试点",         how: "完成市场调研与租金谈判",             when: "本季度完成评估" },
    ],
    refs: [
      { icon: "map",   text: "地图洞察: 裕廊东竞品密度低、人口增长" },
      { icon: "feed",  text: "情报中心: 亚马逊新加坡站珠宝品类增长" },
      { icon: "alert", text: "风险提示: 商场租金谈判压力上升" },
    ],
  },
  {
    id: "brd", name: "品牌部", sub: "Brand", icon: "crown", priority: "mid",
    cycle: "本月", owner: "品牌负责人 / 内容主管",
    summary: [
      { text: "高端品牌故事传播", when: "本月" },
      { text: "媒体与 KOL 合作放大", when: "本月" },
      { text: "区域化内容营销矩阵", when: "持续" },
      { text: "婚庆品牌故事系列",   when: "本月" },
    ],
    goal: "在亚太核心市场建立差异化品牌叙事，强化高端定位",
    steps: [
      { title: "推出「东南亚高端工艺」品牌故事", goal: "强化品牌东方高端定位",       how: "拍摄 3 支品牌纪录短片",             when: "本月完成脚本" },
      { title: "整合区域化媒体投放矩阵",         goal: "覆盖高端生活方式媒体",       how: "Vogue / Tatler / Lifestyle 投放联动", when: "本月启动" },
      { title: "策划婚庆品牌系列内容",           goal: "占领婚庆决策窗口期",         how: "联合婚庆策划公司联合内容投放",       when: "本季度执行" },
      { title: "建立本地 KOC 内容池",             goal: "持续供给真实场景内容",       how: "组建 30 位本地 KOC 长期合作池",     when: "持续执行" },
    ],
    refs: [
      { icon: "feed",  text: "情报中心: Old Money / 复古金饰内容热度" },
      { icon: "map",   text: "地图洞察: 婚庆场景集中于乌节路 / 裕廊东" },
      { icon: "alert", text: "风险提示: 内容投放 ROI 持续监测" },
    ],
  },
  {
    id: "law", name: "法务合规", sub: "Legal", icon: "scale", priority: "low",
    cycle: "持续", owner: "合规负责人 / 法务",
    summary: [
      { text: "进口法规跟踪",       when: "持续" },
      { text: "数据合规与隐私管理", when: "持续" },
      { text: "反洗钱与贸易合规审查", when: "本月" },
      { text: "供应链尽职调查",     when: "本月" },
    ],
    goal: "保障跨境业务合规，前置识别监管与供应链合规风险",
    steps: [
      { title: "建立欧盟新规合规跟踪机制",   goal: "对应黄金供应链尽职调查指令",   how: "组建合规跟踪小组、每月输出风险报告", when: "本月启动" },
      { title: "更新数据合规与隐私管理体系", goal: "适配新加坡 PDPA 与欧盟 GDPR",  how: "更新隐私政策、上线 Cookie 同意框",  when: "本月完成" },
      { title: "完成反洗钱与贸易合规审查",   goal: "对照新加坡 MAS 反洗钱要求",   how: "重新评估 KYC 与合规流程",           when: "本月完成" },
      { title: "建立供应链尽职调查档案",     goal: "覆盖核心钻石与黄金供应商",     how: "对 30 家核心供应商完成尽调档案",     when: "本季度执行" },
    ],
    refs: [
      { icon: "feed",  text: "情报中心: 欧盟黄金供应链尽职调查新规" },
      { icon: "alert", text: "风险提示: 跨境贸易合规成本上升" },
      { icon: "shield",text: "内部审计: 数据合规存在改进空间" },
    ],
  },
];

const PRIORITY_LABEL = { high: { text: "高优先级", k: "clay" }, mid: { text: "中优先级", k: "bone" }, low: { text: "低优先级", k: "sage" } };

const ActStat = ({ icon, label, value, unit, delta, deltaKind = "sage", color }) => (
  <div className="card" style={{ padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
    <div style={{
      width: 56, height: 56, borderRadius: 14,
      background: color === "clay"
        ? "linear-gradient(135deg, var(--clay-tint), #F8EBE7)"
        : color === "indigo"
        ? "linear-gradient(135deg, var(--indigo-tint), #ECEFF5)"
        : "linear-gradient(135deg, var(--gold-tint), var(--gold-wash))",
      border: "1px solid var(--line-soft)",
      display: "grid", placeItems: "center",
      color: color === "clay" ? "var(--clay-deep)" : color === "indigo" ? "#4A597D" : "var(--gold-2)",
    }}>
      <Icon name={icon} size={22}/>
    </div>
    <div>
      <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span className="num-display" style={{ fontSize: 30, color: "var(--ink-1)" }}>{value}</span>
        <span style={{ fontSize: 13, color: "var(--ink-3)" }}>{unit}</span>
      </div>
      <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 4 }}>
        较上月
        <span style={{ marginLeft: 6, color: deltaKind === "sage" ? "var(--sage-deep)" : deltaKind === "clay" ? "var(--clay-deep)" : "var(--ink-3)", fontWeight: 600 }}>{delta}</span>
      </div>
    </div>
  </div>
);

const DeptCard = ({ d, active, onPick }) => (
  <button onClick={() => onPick(d.id)}
    style={{
      textAlign: "left", padding: 18,
      background: active ? "linear-gradient(180deg, var(--gold-wash), var(--pearl-warm))" : "var(--pearl)",
      border: active ? "1px solid var(--gold-1)" : "1px solid var(--line)",
      borderRadius: 14,
      cursor: "pointer",
      boxShadow: active ? "var(--shadow-md), var(--shadow-inner)" : "var(--shadow-sm)",
      position: "relative",
      transition: "all .15s ease",
    }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{
          width: 34, height: 34, borderRadius: 10,
          background: active ? "var(--pearl)" : "var(--gold-wash)",
          border: "1px solid var(--line)",
          display: "grid", placeItems: "center", color: "var(--gold-2)",
        }}>
          <Icon name={d.icon} size={17}/>
        </span>
        <span style={{ fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 600 }}>{d.name}</span>
      </div>
      <span className={`chip ${PRIORITY_LABEL[d.priority].k}`}>{PRIORITY_LABEL[d.priority].text}</span>
    </div>
    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
      {d.summary.map((s, i) => (
        <li key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-2)" }}>
            <span style={{ width: 4, height: 4, borderRadius: 4, background: "var(--gold-1)" }}/>
            {s.text}
          </span>
          <span style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>{s.when}</span>
        </li>
      ))}
    </ul>
    <div style={{
      padding: "9px 12px",
      background: active ? "var(--gold-1)" : "var(--gold-wash)",
      color: active ? "var(--pearl)" : "var(--gold-2)",
      border: active ? "1px solid var(--gold-2)" : "1px solid var(--line)",
      borderRadius: 9, fontSize: 12, fontWeight: 600,
      textAlign: "center",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    }}>
      查看行动清单 <Icon name="right" size={11}/>
    </div>
    {active && (
      <span style={{
        position: "absolute", right: -1, top: 16,
        width: 6, height: 36, borderRadius: 6,
        background: "var(--gold-1)",
      }}/>
    )}
  </button>
);

const ActionDetail = ({ d, onMarkDone }) => (
  <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", height: "100%" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{
        width: 40, height: 40, borderRadius: 12,
        background: "var(--gold-wash)", border: "1px solid var(--line)",
        display: "grid", placeItems: "center", color: "var(--gold-2)"
      }}><Icon name={d.icon} size={20}/></span>
      <div>
        <h3 style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 600 }}>{d.name}行动清单</h3>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>基于新加坡市场洞察生成 · {d.sub} Action Plan</div>
      </div>
    </div>

    <div className="gold-divider" style={{ margin: "16px 0 14px" }}><Icon name="diamond" size={10}/></div>

    {/* Meta row */}
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
      <span className={`chip ${PRIORITY_LABEL[d.priority].k}`} style={{ padding: "4px 12px", fontSize: 11.5 }}>{PRIORITY_LABEL[d.priority].text}</span>
      <span style={{ fontSize: 12, color: "var(--ink-3)" }}>建议周期: <span style={{ color: "var(--ink-1)", fontWeight: 600 }}>{d.cycle}</span></span>
      <span style={{ fontSize: 12, color: "var(--ink-3)" }}>负责人: <span style={{ color: "var(--ink-1)", fontWeight: 600 }}>{d.owner}</span></span>
    </div>

    {/* Goal */}
    <div style={{ fontSize: 11, letterSpacing: ".18em", color: "var(--ink-3)", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>A. 核心目标</div>
    <div style={{
      padding: "14px 16px",
      background: "linear-gradient(135deg, var(--sage-tint), #EEF2EB)",
      border: "1px solid rgba(122,157,126,.3)",
      borderRadius: 10, marginBottom: 18,
      fontFamily: "var(--font-serif)", fontSize: 15, fontWeight: 600, color: "var(--sage-deep)",
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <Icon name="target" size={16}/>
      {d.goal}
    </div>

    {/* Steps */}
    <div style={{ fontSize: 11, letterSpacing: ".18em", color: "var(--ink-3)", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>B. 行动步骤</div>
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18, position: "relative" }}>
      {/* Vertical connector line */}
      <div style={{ position: "absolute", left: 16, top: 22, bottom: 22, width: 1, background: "var(--line-strong)", opacity: .4 }}/>
      {d.steps.map((s, i) => (
        <div key={i} style={{
          display: "grid", gridTemplateColumns: "34px 1fr", gap: 12, alignItems: "stretch",
          position: "relative",
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 17,
            background: "var(--pearl)", border: "2px solid var(--gold-1)",
            display: "grid", placeItems: "center",
            fontFamily: "var(--font-serif)", fontSize: 14, fontWeight: 600,
            color: "var(--gold-2)", zIndex: 1,
            boxShadow: "0 2px 6px rgba(184,145,80,.18)",
          }}>{String(i + 1).padStart(2, "0")}</div>
          <div style={{
            padding: "12px 14px",
            background: "var(--ivory)",
            border: "1px solid var(--line-soft)",
            borderRadius: 10,
            display: "grid", gridTemplateColumns: "1fr auto", gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-1)", marginBottom: 6 }}>{s.title}</div>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", fontSize: 12, color: "var(--ink-2)" }}>
                <span style={{ color: "var(--ink-3)" }}>目标:</span><span>{s.goal}</span>
                <span style={{ color: "var(--ink-3)" }}>执行:</span><span>{s.how}</span>
                <span style={{ color: "var(--ink-3)" }}>时间:</span><span style={{ color: "var(--gold-2)", fontWeight: 600 }}>{s.when}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Refs */}
    <div style={{ fontSize: 11, letterSpacing: ".18em", color: "var(--ink-3)", textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>C. 关联依据</div>
    <div style={{
      padding: 14,
      background: "linear-gradient(135deg, var(--pearl-warm), var(--ivory))",
      border: "1px solid var(--line-soft)",
      borderRadius: 10,
      display: "flex", flexDirection: "column", gap: 7, marginBottom: 18,
    }}>
      {d.refs.map((r, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 12.5, color: "var(--ink-2)" }}>
          <span style={{ color: "var(--gold-2)", marginTop: 1, flexShrink: 0 }}><Icon name={r.icon} size={13}/></span>
          <span>{r.text}</span>
        </div>
      ))}
    </div>

    {/* Actions */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: "auto" }}>
      <button style={btnSecondary}>查看详情</button>
      <button style={btnSecondary}>导出清单</button>
      <button onClick={onMarkDone} style={btnPrimary}>标记已跟进</button>
    </div>
  </div>
);

const btnSecondary = {
  padding: "12px 14px",
  background: "var(--pearl)",
  border: "1px solid var(--line)",
  color: "var(--ink-2)",
  borderRadius: 10, fontSize: 13, fontWeight: 600,
};
const btnPrimary = {
  padding: "12px 14px",
  background: "linear-gradient(135deg, var(--gold-1), var(--gold-2))",
  border: "1px solid var(--gold-2)",
  color: "var(--pearl)",
  borderRadius: 10, fontSize: 13, fontWeight: 600,
  boxShadow: "0 4px 10px rgba(184,145,80,.25), inset 0 1px 0 rgba(255,252,244,.4)",
};

const ActionsPage = () => {
  const [active, setActive] = useStateAC("mkt");
  const d = DEPTS.find(x => x.id === active) || DEPTS[0];
  return (
    <div data-screen-label="04 行动建议" style={{
      display: "grid",
      gridTemplateColumns: "1fr 480px",
      gap: 18,
      padding: 22,
    }}>
      {/* Left */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ margin: "2px 0 4px", fontFamily: "var(--font-serif)", fontSize: 26, fontWeight: 600 }}>行动建议</h2>
            <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>基于市场洞察与情报，智能生成各部门下一步行动</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--ink-3)" }}>
            <Icon name="info" size={12} style={{ color: "var(--gold-2)" }}/>
            点击部门卡片 → 右侧查看具体行动清单
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <ActStat icon="clipboard" label="建议事项总数" value="52" unit="项" delta="+8" deltaKind="sage"/>
          <ActStat icon="alert"     label="高优先级"     value="16" unit="项" delta="+5" deltaKind="clay" color="clay"/>
          <ActStat icon="clock"     label="待推进"       value="23" unit="项" delta="−2" deltaKind="sage" color="indigo"/>
        </div>

        {/* Depts grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          {DEPTS.map(dx => <DeptCard key={dx.id} d={dx} active={dx.id === active} onPick={setActive}/>)}
        </div>

        {/* Footer note */}
        <div className="card" style={{
          padding: 14,
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <span style={{ width: 36, height: 36, borderRadius: 10, background: "var(--gold-wash)", display: "grid", placeItems: "center", color: "var(--gold-2)", border: "1px solid var(--line)" }}>
            <Icon name="info" size={16}/>
          </span>
          <div style={{ fontSize: 12.5, color: "var(--ink-2)", flex: 1 }}>
            <span style={{ color: "var(--ink-3)" }}>更新频率: </span><span style={{ fontWeight: 600 }}>每日更新</span>
            <span style={{ margin: "0 12px", color: "var(--ink-4)" }}>|</span>
            <span style={{ color: "var(--ink-3)" }}>说明: </span>基于本期市场洞察与情报分析，结合历史执行数据，智能生成行动建议。
          </div>
        </div>
      </div>

      {/* Right detail */}
      <div style={{ position: "sticky", top: 18, maxHeight: "calc(100vh - 140px)" }}>
        <ActionDetail d={d} onMarkDone={() => alert("已标记为跟进")}/>
      </div>
    </div>
  );
};

Object.assign(window, { ActionsPage });
