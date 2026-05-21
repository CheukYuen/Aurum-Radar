/* global React, Icon */
const { useState: useStateMI } = React;

/* ============================================================
   Map Insight — Singapore region / mall districts
   ============================================================ */

// Stylized Singapore footprint: a soft organic island shape
const SG_LAND_PATH =
  "M 110 280 " +
  "C 140 240, 200 220, 280 215 " +
  "C 360 210, 440 215, 540 220 " +
  "C 640 226, 740 230, 820 245 " +
  "C 900 260, 970 285, 1010 320 " +
  "C 1040 345, 1055 380, 1040 410 " +
  "C 1025 440, 990 460, 940 470 " +
  "C 880 482, 820 484, 750 478 " +
  "C 660 470, 580 482, 500 478 " +
  "C 410 472, 330 470, 250 460 " +
  "C 170 448, 110 430, 90 390 " +
  "C 70 350, 80 310, 110 280 Z";

const SG_REGIONS = [
  { id: "orchard",   name: "乌节路",   sub: "Orchard",     x: 540, y: 340, stores: 5, hot: "high",   priority: true },
  { id: "marina",    name: "滨海湾",   sub: "Marina Bay",  x: 700, y: 425, stores: 3, hot: "high"    },
  { id: "bugis",     name: "武吉士",   sub: "Bugis",       x: 600, y: 270, stores: 3, hot: "high"    },
  { id: "jurong",    name: "裕廊东",   sub: "Jurong East", x: 280, y: 360, stores: 2, hot: "mid"     },
  { id: "tampines",  name: "淡滨尼",   sub: "Tampines",    x: 830, y: 320, stores: 2, hot: "mid"     },
  { id: "changi",    name: "樟宜",     sub: "Changi",      x: 940, y: 295, stores: 1, hot: "mid"     },
  { id: "cbd",       name: "市中心",   sub: "CBD",         x: 620, y: 405, stores: 3, hot: "high"    },
];

const REGION_DETAIL = {
  orchard: {
    name: "乌节路", sub: "Orchard Road", priority: "高优先级区域",
    metrics: [
      { icon: "store", label: "门店数量",  value: "5", unit: "家" },
      { icon: "flame", label: "商圈热力",  value: "高",     valueClass: "sage" },
      { icon: "users", label: "竞品密度",  value: "高",     valueClass: "clay" },
      { icon: "broadcast", label: "客流结构", value: "游客 + 高净值本地", small: true },
    ],
    profile: {
      type: "高端商业核心区",
      scene: "奢侈品购物中心、婚庆珠宝、高端礼赠",
      consumption: "品牌导向强，客单价高",
      action: "品牌曝光、会员活动、节日营销",
    },
    insights: [
      "Aurum 门店密度最高，覆盖核心商圈",
      "周边高端珠宝品牌集中，比价压力可控",
      "适合品牌曝光与会员体验活动",
      "租金成本较高，需关注转化效率",
    ],
    actions: [
      "加强核心商场陈列与橱窗曝光",
      "策划高端礼赠主题活动",
      "监测 Maison Aurelia / Lune Atelier / Cartelle 等竞品动作",
    ],
  },
  marina: {
    name: "滨海湾", sub: "Marina Bay", priority: "高优先级区域",
    metrics: [
      { icon: "store", label: "门店数量",  value: "3", unit: "家" },
      { icon: "flame", label: "商圈热力",  value: "高",     valueClass: "sage" },
      { icon: "users", label: "竞品密度",  value: "中高",   valueClass: "bone" },
      { icon: "broadcast", label: "客流结构", value: "游客主导", small: true },
    ],
    profile: {
      type: "地标商业区",
      scene: "旅游购物、奢侈品零售、礼品",
      consumption: "客单价高，冲动购买比例高",
      action: "旅游营销、限定款、机场协同",
    },
    insights: [
      "地标商圈，旅游客流密集且消费力强",
      "免税与机场协同效应显著",
      "适合限定产品与故事性传播",
      "对汇率波动敏感，需动态定价",
    ],
    actions: [
      "推出滨海湾限定纪念款系列",
      "联动机场免税与酒店礼宾渠道",
      "增加多语种导购与会员注册转化",
    ],
  },
  bugis: {
    name: "武吉士", sub: "Bugis", priority: "中优先级区域",
    metrics: [
      { icon: "store", label: "门店数量",  value: "3", unit: "家" },
      { icon: "flame", label: "商圈热力",  value: "中高",  valueClass: "sage" },
      { icon: "users", label: "竞品密度",  value: "中",    valueClass: "bone" },
      { icon: "broadcast", label: "客流结构", value: "本地年轻 + 游客", small: true },
    ],
    profile: {
      type: "年轻文化商业区",
      scene: "轻奢饰品、社交礼物、潮流配饰",
      consumption: "价格敏感，社媒驱动",
      action: "轻奢线、KOL 合作、社媒投放",
    },
    insights: [
      "Z 世代与年轻白领客流集中",
      "适合轻奢与日常佩戴系列推广",
      "本地 KOL 合作回报率高",
      "需要差异化产品策略避免与乌节路重叠",
    ],
    actions: [
      "推广轻奢 Daily 系列",
      "本地 KOL 与小红书内容投放",
      "试点快闪体验店",
    ],
  },
  cbd: {
    name: "市中心", sub: "CBD", priority: "中优先级区域",
    metrics: [
      { icon: "store", label: "门店数量",  value: "3", unit: "家" },
      { icon: "flame", label: "商圈热力",  value: "中",    valueClass: "bone" },
      { icon: "users", label: "竞品密度",  value: "中",    valueClass: "bone" },
      { icon: "broadcast", label: "客流结构", value: "白领 + 商务客群", small: true },
    ],
    profile: {
      type: "金融商务核心",
      scene: "商务礼赠、轻奢自购、午休消费",
      consumption: "高频低额，注重服务",
      action: "工作日时段促销、企业礼赠",
    },
    insights: [
      "白领客群稳定，节假日客流回升明显",
      "适合商务礼赠与企业定制业务",
      "门店面积小但坪效高",
      "周末客流下降明显，需差异化经营",
    ],
    actions: [
      "拓展企业礼赠 B2B 渠道",
      "推出商务系列与会员快捷服务",
      "优化周末活动与会员邀约",
    ],
  },
  jurong: {
    name: "裕廊东", sub: "Jurong East", priority: "中优先级区域",
    metrics: [
      { icon: "store", label: "门店数量",  value: "2", unit: "家" },
      { icon: "flame", label: "商圈热力",  value: "中",   valueClass: "bone" },
      { icon: "users", label: "竞品密度",  value: "低",   valueClass: "sage" },
      { icon: "broadcast", label: "客流结构", value: "本地家庭客群", small: true },
    ],
    profile: {
      type: "西部区域中心",
      scene: "婚庆珠宝、家庭礼赠",
      consumption: "重决策、注重性价比",
      action: "婚庆套餐、家庭活动",
    },
    insights: [
      "西部区域人口持续增长",
      "竞品密度低，市占率提升空间大",
      "婚庆与家庭礼赠场景突出",
      "需要本地化的婚庆服务体验",
    ],
    actions: [
      "强化婚戒与对戒套餐推广",
      "举办家庭日与婚庆体验活动",
      "评估新增门店的开店时机",
    ],
  },
  tampines: {
    name: "淡滨尼", sub: "Tampines", priority: "中优先级区域",
    metrics: [
      { icon: "store", label: "门店数量",  value: "2", unit: "家" },
      { icon: "flame", label: "商圈热力",  value: "中",   valueClass: "bone" },
      { icon: "users", label: "竞品密度",  value: "低",   valueClass: "sage" },
      { icon: "broadcast", label: "客流结构", value: "本地通勤客群", small: true },
    ],
    profile: {
      type: "东部社区商业中心",
      scene: "日常配饰、通勤礼物、家庭",
      consumption: "稳定低额，复购为王",
      action: "会员复购、生日提醒",
    },
    insights: [
      "东部居民聚集，社区氛围浓",
      "复购率高于全岛均值",
      "可作为会员体系试点",
      "高端 SKU 销售较弱",
    ],
    actions: [
      "推出社区会员日活动",
      "强化生日 / 纪念日提醒推送",
      "测试中高端 SKU 试销",
    ],
  },
  changi: {
    name: "樟宜", sub: "Changi", priority: "战略机场区域",
    metrics: [
      { icon: "store", label: "门店数量",  value: "1", unit: "家" },
      { icon: "flame", label: "商圈热力",  value: "高",    valueClass: "sage" },
      { icon: "users", label: "竞品密度",  value: "高",    valueClass: "clay" },
      { icon: "broadcast", label: "客流结构", value: "国际游客", small: true },
    ],
    profile: {
      type: "国际机场免税区",
      scene: "免税、旅游伴手礼、限定款",
      consumption: "高客单、冲动型",
      action: "限定 SKU、礼盒、机场专属",
    },
    insights: [
      "国际客流密集，转化窗口窄",
      "需依赖明显视觉与礼盒包装",
      "免税价格优势对决策影响大",
      "受国际旅行波动影响明显",
    ],
    actions: [
      "推出机场专属礼盒与限定款",
      "申请额外柜位与 visual 升级",
      "建立旅客 CRM 与离岛触达",
    ],
  },
};

/* ------- Singapore Map SVG ------- */
const SingaporeMap = ({ selected, onSelect }) => (
  <svg viewBox="0 0 1150 560" style={{ width: "100%", height: "100%", display: "block" }}>
    <defs>
      <linearGradient id="sg-island" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#F4EEE1"/>
        <stop offset=".55" stopColor="#EBE0C5"/>
        <stop offset="1" stopColor="#DECCA0"/>
      </linearGradient>
      <radialGradient id="sg-bg" cx="50%" cy="50%" r="60%">
        <stop offset="0" stopColor="#F0F4EE"/>
        <stop offset="1" stopColor="#E5EAE2"/>
      </radialGradient>
      <radialGradient id="orchard-glow" cx="50%" cy="50%" r="50%">
        <stop offset="0" stopColor="#EEDBA8" stopOpacity="0.9"/>
        <stop offset="1" stopColor="#C8A569" stopOpacity="0"/>
      </radialGradient>
    </defs>
    {/* sea/background tinted soft */}
    <rect width="1150" height="560" fill="url(#sg-bg)"/>
    {/* sea ripple decoration */}
    {[100, 200, 300, 400, 500].map(y => (
      <path key={y} d={`M 0 ${y} Q 200 ${y - 8}, 400 ${y} T 800 ${y} T 1200 ${y}`}
        fill="none" stroke="rgba(140, 165, 155, .12)" strokeWidth="1"/>
    ))}

    {/* Island */}
    <path d={SG_LAND_PATH} fill="url(#sg-island)"
      stroke="#C8A569" strokeWidth="1.2" strokeOpacity=".5"
      style={{ filter: "drop-shadow(0 8px 18px rgba(120,92,40,.15))" }}/>
    {/* Coastline highlight */}
    <path d={SG_LAND_PATH} fill="none" stroke="rgba(255,252,244,.7)" strokeWidth="2" transform="translate(0,-1.5)"/>

    {/* Orchard glow (default selected) */}
    {selected === "orchard" && (
      <circle cx="540" cy="340" r="100" fill="url(#orchard-glow)"/>
    )}

    {/* Region nodes */}
    {SG_REGIONS.map(r => {
      const isSelected = selected === r.id;
      return (
        <g key={r.id} style={{ cursor: "pointer" }} onClick={() => onSelect(r.id)}>
          {isSelected && (
            <circle cx={r.x} cy={r.y} r={48} fill="none" stroke="#C8A569" strokeWidth="1" strokeDasharray="3 4" opacity=".6">
              <animateTransform attributeName="transform" type="rotate" from={`0 ${r.x} ${r.y}`} to={`360 ${r.x} ${r.y}`} dur="22s" repeatCount="indefinite"/>
            </circle>
          )}
          {/* Pin marker */}
          <g transform={`translate(${r.x} ${r.y})`}>
            {/* Outer halo */}
            <circle r={isSelected ? 38 : 22}
              fill={isSelected ? "#EEDBA8" : "rgba(238,219,168,.5)"}
              opacity={isSelected ? .8 : .55}/>
            {/* Center pin */}
            <circle r={isSelected ? 32 : 18}
              fill={isSelected
                ? "url(#sg-island)"
                : "#FFFCF6"}
              stroke="#B89150" strokeWidth="1.5"
              style={{ filter: "drop-shadow(0 4px 10px rgba(184,145,80,.35))" }}/>
            {isSelected && (
              <circle r={32} fill="none" stroke="#C8A569" strokeWidth="2"/>
            )}
            <text y={isSelected ? 4 : 3} textAnchor="middle"
              fontFamily="var(--font-serif)" fontWeight="600"
              fontSize={isSelected ? 22 : 14}
              fill={isSelected ? "#5D4818" : "#B89150"}>{r.stores}</text>
          </g>
          {/* Label card */}
          <g transform={`translate(${r.x + (isSelected ? 44 : 30)} ${r.y - (isSelected ? 18 : 12)})`}>
            <rect x="0" y="0" rx="6" ry="6"
              width={isSelected ? 110 : 90} height={isSelected ? 42 : 34}
              fill="#FFFCF6" stroke="rgba(168,144,96,.32)" strokeWidth="1"/>
            <text x="10" y="16" fontFamily="var(--font-serif)" fontWeight="600"
              fontSize={isSelected ? 16 : 14} fill="#2A2419">{r.name}</text>
            <text x="10" y={isSelected ? 33 : 28} fontFamily="var(--font-sans)"
              fontSize="11" fill="#786C53">{r.stores} 家门店</text>
          </g>
        </g>
      );
    })}
  </svg>
);

/* ------- Right region detail panel ------- */
const RegionPanel = ({ id }) => {
  const d = REGION_DETAIL[id] || REGION_DETAIL.orchard;
  return (
    <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 26, fontWeight: 600 }}>{d.name}商圈</h2>
            <span className="chip gold">{d.priority}</span>
          </div>
          <div style={{ fontSize: 11, letterSpacing: ".18em", color: "var(--ink-3)", marginTop: 4, textTransform: "uppercase" }}>{d.sub} · 区域详情</div>
        </div>
        {/* building silhouette */}
        <svg width="62" height="62" viewBox="0 0 60 60">
          <defs>
            <linearGradient id="bldg-g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#EEDBA8"/>
              <stop offset="1" stopColor="#B89150"/>
            </linearGradient>
          </defs>
          <g fill="url(#bldg-g)" opacity=".55">
            <rect x="6" y="32" width="10" height="24" rx="1"/>
            <rect x="20" y="20" width="12" height="36" rx="1"/>
            <polygon points="26,16 26,20 32,20"/>
            <rect x="36" y="26" width="10" height="30" rx="1"/>
            <rect x="48" y="38" width="8" height="18" rx="1"/>
          </g>
          <g fill="#FFFCF6" opacity=".5">
            {[34,40,46,52].map(y => <rect key={`a${y}`} x="22" y={y} width="2" height="3"/>)}
            {[34,40,46,52].map(y => <rect key={`b${y}`} x="28" y={y} width="2" height="3"/>)}
            {[28,34,40,46,52].map(y => <rect key={`c${y}`} x="38" y={y} width="2" height="3"/>)}
            {[28,34,40,46,52].map(y => <rect key={`d${y}`} x="42" y={y} width="2" height="3"/>)}
          </g>
        </svg>
      </div>

      <div className="gold-divider" style={{ margin: "16px 0 14px" }}><Icon name="diamond" size={10}/></div>

      {/* Key metrics grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        {d.metrics.map((m, i) => (
          <div key={i} style={{
            padding: 12,
            background: "var(--ivory)",
            border: "1px solid var(--line-soft)",
            borderRadius: 10,
            textAlign: "center",
          }}>
            <div style={{ color: "var(--gold-2)", display: "flex", justifyContent: "center", marginBottom: 6 }}>
              <Icon name={m.icon} size={14}/>
            </div>
            <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginBottom: 4, letterSpacing: ".05em" }}>{m.label}</div>
            <div className="num-display" style={{
              fontSize: m.small ? 11 : 22, lineHeight: 1.2,
              color: m.valueClass === "sage" ? "var(--sage-deep)" : m.valueClass === "clay" ? "var(--clay-deep)" : "var(--ink-1)",
              fontWeight: m.small ? 500 : 600,
              fontFamily: m.small ? "var(--font-sans)" : "var(--font-serif)",
            }}>
              {m.value}{m.unit && <span style={{ fontSize: 11, color: "var(--ink-3)", marginLeft: 2 }}>{m.unit}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Profile */}
      <Section title="区域画像">
        <ProfileRow label="区域类型"   value={d.profile.type}/>
        <ProfileRow label="主要场景"   value={d.profile.scene}/>
        <ProfileRow label="消费特征"   value={d.profile.consumption}/>
        <ProfileRow label="适合动作"   value={d.profile.action}/>
      </Section>

      {/* Store insights */}
      <Section title="门店洞察">
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
          {d.insights.map((t, i) => (
            <li key={i} style={{ fontSize: 13, color: "var(--ink-2)", display: "flex", gap: 8, lineHeight: 1.5 }}>
              <span style={{ width: 4, height: 4, borderRadius: 4, background: "var(--gold-1)", marginTop: 7, flexShrink: 0 }}/>
              {t}
            </li>
          ))}
        </ul>
      </Section>

      {/* Suggested actions */}
      <div style={{ marginTop: 14, fontSize: 11, letterSpacing: ".18em", color: "var(--ink-3)", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>建议动作 · ACTIONS</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {d.actions.map((a, i) => (
          <button key={i} className="card-hover"
            style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "11px 14px",
              background: "var(--pearl)",
              border: "1px solid var(--line)",
              borderRadius: 10, textAlign: "left",
              fontSize: 13, color: "var(--ink-1)",
            }}>
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 20, height: 20, borderRadius: 6, background: "var(--gold-tint)", color: "var(--gold-2)", display: "grid", placeItems: "center", fontSize: 10.5, fontWeight: 700 }}>{String(i+1).padStart(2,"0")}</span>
              {a}
            </span>
            <Icon name="right" size={12} style={{ color: "var(--ink-4)" }}/>
          </button>
        ))}
      </div>
    </div>
  );
};

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 11, letterSpacing: ".18em", color: "var(--ink-3)", textTransform: "uppercase", fontWeight: 600, marginBottom: 8 }}>{title}</div>
    <div style={{
      padding: "12px 14px",
      background: "var(--ivory)",
      border: "1px solid var(--line-soft)",
      borderRadius: 10,
      display: "flex", flexDirection: "column", gap: 6,
    }}>{children}</div>
  </div>
);
const ProfileRow = ({ label, value }) => (
  <div style={{ display: "flex", fontSize: 13, gap: 12 }}>
    <span style={{ color: "var(--ink-3)", width: 80, flexShrink: 0 }}>{label}</span>
    <span style={{ color: "var(--ink-1)", flex: 1 }}>{value}</span>
  </div>
);

/* ------- Bottom 4 modules ------- */

const StoreDistribution = () => {
  const rows = SG_REGIONS.slice().sort((a,b) => b.stores - a.stores);
  const max = Math.max(...rows.map(r => r.stores));
  const total = rows.reduce((s,r) => s + r.stores, 0);
  return (
    <BottomCard icon="store" title="门店分布概览">
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {rows.map(r => (
          <div key={r.id} style={{ display: "grid", gridTemplateColumns: "60px 1fr 32px", alignItems: "center", gap: 10, fontSize: 12.5 }}>
            <span style={{ color: "var(--ink-2)" }}>{r.name}</span>
            <div style={{ height: 8, background: "var(--gold-wash)", borderRadius: 8, overflow: "hidden" }}>
              <div style={{
                width: `${(r.stores / max) * 100}%`, height: "100%",
                background: "linear-gradient(90deg, var(--gold-3), var(--gold-1))",
                borderRadius: 8,
              }}/>
            </div>
            <span style={{ textAlign: "right", color: "var(--ink-2)", fontWeight: 600 }}>{r.stores}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--line-soft)", display: "flex", justifyContent: "space-between", fontSize: 12 }}>
        <span style={{ color: "var(--ink-3)" }}>合计</span>
        <span className="num-display" style={{ color: "var(--ink-1)", fontSize: 15 }}>{total} <span style={{ fontSize: 10, color: "var(--ink-3)" }}>家门店</span></span>
      </div>
    </BottomCard>
  );
};

const HeatList = ({ onPick, selected }) => {
  const items = [
    { id: "orchard", name: "乌节路", desc: "高端商业核心区，客流密集、品牌竞争激烈", heat: "高" },
    { id: "marina",  name: "滨海湾", desc: "地标商圈，旅游客流集中、消费力强", heat: "高" },
    { id: "bugis",   name: "武吉士", desc: "商业氛围浓厚，交通枢纽、游客集中", heat: "中" },
    { id: "cbd",     name: "市中心", desc: "白领客群稳定，节假日客流回升明显", heat: "中" },
  ];
  return (
    <BottomCard icon="flame" title="核心商圈热力">
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map(it => (
          <button key={it.id} onClick={() => onPick(it.id)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: 8, borderRadius: 10,
              background: selected === it.id ? "var(--gold-wash)" : "transparent",
              border: selected === it.id ? "1px solid var(--line)" : "1px solid transparent",
              textAlign: "left", cursor: "pointer",
            }}>
            {/* Tiny silhouette placeholder */}
            <div style={{
              width: 38, height: 38, flexShrink: 0,
              borderRadius: 8,
              background: "linear-gradient(135deg, var(--silk), var(--gold-tint))",
              position: "relative", overflow: "hidden", border: "1px solid var(--line-soft)"
            }}>
              <svg viewBox="0 0 38 38" style={{ position: "absolute", inset: 0 }}>
                <rect x="6" y="20" width="6" height="14" fill="rgba(168,144,96,.5)"/>
                <rect x="14" y="14" width="8" height="20" fill="rgba(168,144,96,.65)"/>
                <rect x="24" y="18" width="6" height="16" fill="rgba(168,144,96,.5)"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-1)" }}>{it.name}</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2, lineHeight: 1.35 }}>{it.desc}</div>
            </div>
            <span className={`chip ${it.heat === "高" ? "sage" : "bone"}`}>热力{it.heat}</span>
          </button>
        ))}
      </div>
    </BottomCard>
  );
};

const TrafficSignals = () => {
  const sigs = [
    { icon: "users",    label: "日均客流指数",   value: "高", delta: "+12%", dir: "up" },
    { icon: "diamond",  label: "高净值客群占比", value: "高", delta: "+9%",  dir: "up" },
    { icon: "globe",    label: "游客占比",       value: "高", delta: "+15%", dir: "up" },
    { icon: "target",   label: "平均客单价指数", value: "高", delta: "+8%",  dir: "up" },
  ];
  return (
    <BottomCard icon="broadcast" title="客流与消费信号">
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sigs.map((s, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "auto 1fr auto auto", alignItems: "center", gap: 10,
            padding: "10px 12px",
            background: "var(--ivory)", borderRadius: 10, border: "1px solid var(--line-soft)",
          }}>
            <span style={{ color: "var(--gold-2)" }}><Icon name={s.icon} size={14}/></span>
            <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{s.label}</span>
            <span style={{ fontSize: 12.5, color: "var(--sage-deep)", fontWeight: 600 }}>{s.value}</span>
            <span style={{ fontSize: 11.5, color: "var(--sage-deep)", display: "flex", alignItems: "center", gap: 2 }}>
              <Icon name="trending" size={11}/> {s.delta}
            </span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, fontSize: 10.5, color: "var(--ink-3)" }}>* 相较新加坡整体平均</div>
    </BottomCard>
  );
};

const OpsRisk = () => {
  const risks = [
    { kind: "clay", label: "核心商圈租金", value: "偏高", note: "需提升坪效与转化" },
    { kind: "bone", label: "汇率波动",     value: "中等", note: "对进口成本影响显著" },
    { kind: "sage", label: "员工招聘",     value: "稳定", note: "本地导购供给充足" },
    { kind: "clay", label: "竞品扩张",     value: "加剧", note: "Maison Aurelia 新增 2 店" },
  ];
  return (
    <BottomCard icon="shield" title="区域运营风险">
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {risks.map((r, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "10px 1fr auto", gap: 10, alignItems: "center",
            padding: "10px 12px",
            background: "var(--ivory)", borderRadius: 10, border: "1px solid var(--line-soft)",
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: 8,
              background: r.kind === "clay" ? "var(--clay)" : r.kind === "sage" ? "var(--sage)" : "var(--ink-4)",
              boxShadow: `0 0 0 3px ${r.kind === "clay" ? "var(--clay-tint)" : r.kind === "sage" ? "var(--sage-tint)" : "var(--gold-wash)"}`,
              marginLeft: 4,
            }}/>
            <div>
              <div style={{ fontSize: 12.5, color: "var(--ink-1)", fontWeight: 600 }}>{r.label}</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 1 }}>{r.note}</div>
            </div>
            <span className={`chip ${r.kind}`}>{r.value}</span>
          </div>
        ))}
      </div>
    </BottomCard>
  );
};

const BottomCard = ({ icon, title, children }) => (
  <div className="card" style={{ padding: 16 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <span style={{ color: "var(--gold-2)" }}><Icon name={icon} size={15}/></span>
      <span style={{ fontFamily: "var(--font-serif)", fontSize: 15, fontWeight: 600, color: "var(--ink-1)" }}>{title}</span>
    </div>
    {children}
  </div>
);

const MapInsightPage = ({ filters }) => {
  const [selected, setSelected] = useStateMI("orchard");
  return (
    <div data-screen-label="02 地图洞察" style={{
      display: "grid",
      gridTemplateColumns: "1fr 440px",
      gridTemplateRows: "auto auto",
      gap: 18,
      padding: 22,
    }}>
      {/* Map */}
      <div className="card" style={{ padding: 20, gridColumn: "1 / 2", gridRow: "1 / 2" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <h3 className="facet-rule" style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 600 }}>地图洞察</h3>
            <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: "var(--ink-3)" }}>
              <span>当前国家:</span><span className="chip sage">{filters.region === "全球" ? "新加坡" : filters.region}</span>
              <span style={{ marginLeft: 10 }}>当前选中区域:</span>
              <span className="chip gold">{REGION_DETAIL[selected]?.name || ""}</span>
            </div>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, padding: "6px 12px",
            background: "var(--gold-wash)", borderRadius: 999, border: "1px solid var(--line)",
            fontSize: 11.5, color: "var(--ink-2)",
          }}>
            <Icon name="info" size={12} style={{ color: "var(--gold-2)" }}/>
            点击区域卡片，查看该商圈详细洞察与机会建议
          </div>
        </div>
        <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid var(--line-soft)" }}>
          <SingaporeMap selected={selected} onSelect={setSelected}/>
          {/* Compass deco */}
          <div style={{
            position: "absolute", right: 16, top: 16,
            width: 44, height: 44, borderRadius: 22,
            background: "rgba(255,252,244,.85)", border: "1px solid var(--line)",
            display: "grid", placeItems: "center", color: "var(--gold-2)",
            backdropFilter: "blur(4px)",
          }}>
            <Icon name="compass" size={20}/>
          </div>
        </div>
      </div>

      {/* Right region panel - spans both rows */}
      <div style={{ gridColumn: "2 / 3", gridRow: "1 / 3" }}>
        <RegionPanel id={selected}/>
      </div>

      {/* Bottom modules */}
      <div style={{ gridColumn: "1 / 2", gridRow: "2 / 3", display: "grid", gridTemplateColumns: "1fr 1.1fr 1fr 1fr", gap: 14 }}>
        <StoreDistribution/>
        <HeatList onPick={setSelected} selected={selected}/>
        <TrafficSignals/>
        <OpsRisk/>
      </div>
    </div>
  );
};

Object.assign(window, { MapInsightPage });
