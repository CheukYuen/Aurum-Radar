/* global React, Icon */
const { useState: useStateOV, useMemo: useMemoOV, useEffect: useEffectOV } = React;

/* ============================================================
   Overview — global opportunity map
   ============================================================ */

/* Simplified continent silhouettes built from coarse rectangles + dots.
   Stylized — not cartographic. Aspect ratio 1600x780. */
const CONTINENT_DOTS = (() => {
  // Define rough continent zones as ellipses, fill with a noise-y dot grid.
  // Easier: hand-place dots loosely matching continent footprints.
  // Stored as [x, y, r] tuples normalized to 1600x780.
  const zones = [
    // North America
    { cx: 280, cy: 230, rx: 180, ry: 140, density: 0.55 },
    // Greenland
    { cx: 480, cy: 110, rx: 60, ry: 60, density: 0.4 },
    // South America
    { cx: 430, cy: 540, rx: 100, ry: 170, density: 0.5 },
    // Europe
    { cx: 820, cy: 220, rx: 90, ry: 80, density: 0.55 },
    // Africa
    { cx: 880, cy: 460, rx: 130, ry: 180, density: 0.55 },
    // Middle East
    { cx: 980, cy: 320, rx: 70, ry: 70, density: 0.5 },
    // Asia
    { cx: 1150, cy: 250, rx: 220, ry: 130, density: 0.55 },
    // India
    { cx: 1080, cy: 360, rx: 70, ry: 70, density: 0.5 },
    // SE Asia
    { cx: 1280, cy: 440, rx: 90, ry: 60, density: 0.5 },
    // Australia
    { cx: 1400, cy: 580, rx: 110, ry: 70, density: 0.5 },
  ];
  const dots = [];
  let seed = 17;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  zones.forEach(z => {
    const count = Math.floor(z.rx * z.ry * 0.012 * z.density);
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2;
      const r = Math.sqrt(rand());
      const x = z.cx + Math.cos(a) * r * z.rx + (rand() - 0.5) * 14;
      const y = z.cy + Math.sin(a) * r * z.ry + (rand() - 0.5) * 14;
      dots.push([x, y, 1.1 + rand() * 0.8]);
    }
  });
  return dots;
})();

const COUNTRIES = [
  { id: "sg", name: "新加坡", sub: "Singapore", x: 1240, y: 460, status: "high",  size: 18 },
  { id: "eu", name: "欧洲",   sub: "Europe",    x: 820,  y: 220, status: "high",  size: 16 },
  { id: "na", name: "北美",   sub: "N. America",x: 280,  y: 240, status: "mid",   size: 14 },
  { id: "me", name: "中东",   sub: "Mid. East", x: 990,  y: 320, status: "risk",  size: 14 },
  { id: "la", name: "拉美",   sub: "LATAM",     x: 430,  y: 520, status: "mid",   size: 12 },
  { id: "au", name: "澳洲",   sub: "Oceania",   x: 1430, y: 580, status: "mid",   size: 12 },
  { id: "jp", name: "日本",   sub: "Japan",     x: 1380, y: 280, status: "high",  size: 14 },
  { id: "in", name: "印度",   sub: "India",     x: 1080, y: 380, status: "mid",   size: 12 },
];

const COUNTRY_DETAIL = {
  sg: {
    name: "新加坡", sub: "Singapore", status: "机会高", statusKind: "sage",
    score: 82,
    competition: 4, // 1..5 diamonds
    competitionLabel: "中高",
    policy: "优", policyKind: "sage",
    growth: "+12%",
    bullets: [
      { icon: "diamond",    text: "高净值消费持续增长，奢侈品珠宝需求旺盛" },
      { icon: "scale",      text: "自由贸易枢纽，关税政策友好" },
      { icon: "trending",   text: "电商渠道渗透率提升，线上销售增长显著" },
      { icon: "broadcast",  text: "旅游零售恢复，机场免税业务回暖" },
    ]
  },
  eu: { name: "欧洲", sub: "Europe", status: "机会高", statusKind: "sage",
    score: 76, competition: 5, competitionLabel: "高", policy: "中", policyKind: "bone", growth: "+8%",
    bullets: [
      { icon: "crown",  text: "传统高端珠宝市场，品牌信任度高" },
      { icon: "shield", text: "ESG 与供应链合规要求趋严" },
      { icon: "wave",   text: "意大利与法国设计工艺溢价稳定" },
      { icon: "users",  text: "本地高净值客群稳定，年轻化趋势显现" },
    ]
  },
  na: { name: "北美", sub: "N. America", status: "机会中", statusKind: "bone",
    score: 68, competition: 4, competitionLabel: "中高", policy: "良", policyKind: "sage", growth: "+5%",
    bullets: [
      { icon: "store",    text: "实验室培育钻石接受度领先全球" },
      { icon: "trending", text: "电商与社媒驱动年轻消费决策" },
      { icon: "broadcast",text: "婚庆需求结构性放缓，礼赠场景上升" },
      { icon: "shield",   text: "进口关税与原产地审核趋严" },
    ]
  },
  me: { name: "中东", sub: "Middle East", status: "风险高", statusKind: "clay",
    score: 54, competition: 3, competitionLabel: "中", policy: "波动", policyKind: "clay", growth: "+2%",
    bullets: [
      { icon: "alert", text: "区域地缘风险与汇率波动加剧" },
      { icon: "crown", text: "高净值客群消费集中，仍具机会" },
      { icon: "scale", text: "进口合规与本地化要求复杂" },
      { icon: "store", text: "迪拜与利雅得线下渠道集中度高" },
    ]
  },
  la: { name: "拉美", sub: "LATAM", status: "机会中", statusKind: "bone",
    score: 58, competition: 2, competitionLabel: "中低", policy: "中", policyKind: "bone", growth: "+6%",
    bullets: [
      { icon: "trending", text: "新兴中产人群扩张，入门款机会显现" },
      { icon: "wave",     text: "宏观波动较大，库存周转需谨慎" },
      { icon: "users",    text: "婚庆与礼赠场景具备本地化潜力" },
      { icon: "shield",   text: "海关与税务合规复杂，建议代理模式切入" },
    ]
  },
  au: { name: "澳洲", sub: "Oceania", status: "机会中", statusKind: "bone",
    score: 64, competition: 3, competitionLabel: "中", policy: "良", policyKind: "sage", growth: "+4%",
    bullets: [
      { icon: "mountain", text: "本地矿石产业与故事性资源丰富" },
      { icon: "users",    text: "高端婚庆与生活方式消费稳定" },
      { icon: "store",    text: "线下集中在悉尼、墨尔本核心商圈" },
      { icon: "lab",      text: "可持续与培育钻石叙事接受度高" },
    ]
  },
  jp: { name: "日本", sub: "Japan", status: "机会高", statusKind: "sage",
    score: 78, competition: 4, competitionLabel: "中高", policy: "优", policyKind: "sage", growth: "+7%",
    bullets: [
      { icon: "crown",  text: "本土工艺溢价稳定，婚戒市场成熟" },
      { icon: "wave",   text: "汇率优势带动入境游客购物回升" },
      { icon: "store",  text: "百货 + 路面店组合渠道密度高" },
      { icon: "users",  text: "Z 世代古典金饰需求升温" },
    ]
  },
  in: { name: "印度", sub: "India", status: "机会中", statusKind: "bone",
    score: 60, competition: 5, competitionLabel: "高", policy: "中", policyKind: "bone", growth: "+11%",
    bullets: [
      { icon: "trending", text: "黄金消费体量全球领先，本土品牌强势" },
      { icon: "users",    text: "婚庆季节性消费集中" },
      { icon: "scale",    text: "进口关税与黄金管制复杂" },
      { icon: "lab",      text: "培育钻石产业链优势明显" },
    ]
  }
};

/* Connecting arc between two points - decorative */
const Arc = ({ from, to, opacity = 0.5 }) => {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2 - Math.abs(from.x - to.x) * 0.15;
  return (
    <path d={`M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`}
      fill="none"
      stroke="url(#arc-grad)"
      strokeWidth="1"
      strokeDasharray="2 4"
      opacity={opacity}
    />
  );
};

const STATUS_COLORS = {
  high: { fill: "#7A9D7E", glow: "rgba(122,157,126,.35)", label: "机会高", labelTone: "sage" },
  mid:  { fill: "#C8A569", glow: "rgba(200,165,105,.35)", label: "机会中", labelTone: "gold" },
  risk: { fill: "#C97F6E", glow: "rgba(201,127,110,.35)", label: "风险高", labelTone: "clay" },
};

const CountryNode = ({ c, hot, onClick }) => {
  const s = STATUS_COLORS[c.status];
  return (
    <g style={{ cursor: "pointer" }} onClick={() => onClick(c.id)}>
      {/* pulse */}
      {hot && <circle cx={c.x} cy={c.y} r={c.size + 14}
        fill="none" stroke={s.fill} strokeWidth="1" opacity={.4}>
        <animate attributeName="r" values={`${c.size + 6};${c.size + 28};${c.size + 6}`} dur="3.6s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values=".5;0;.5" dur="3.6s" repeatCount="indefinite"/>
      </circle>}
      <circle cx={c.x} cy={c.y} r={c.size + 6}
        fill={s.glow} opacity={hot ? .9 : .55}/>
      <circle cx={c.x} cy={c.y} r={c.size}
        fill={s.fill}
        stroke="#FFFCF6" strokeWidth={hot ? 3 : 2}
        style={{ filter: `drop-shadow(0 4px 8px ${s.glow})` }}/>
      {/* facet highlight */}
      <circle cx={c.x - c.size*0.3} cy={c.y - c.size*0.3} r={c.size*0.3}
        fill="rgba(255,255,255,.5)"/>
      {/* Label */}
      <g transform={`translate(${c.x + c.size + 12} ${c.y - 4})`}>
        <text fontFamily="var(--font-serif)" fontSize="20" fontWeight="600" fill="#2A2419">{c.name}</text>
        <text y="20" fontFamily="var(--font-sans)" fontSize="12" fill={s.fill} fontWeight="600">{s.label}</text>
      </g>
    </g>
  );
};

const WorldMap = ({ selected, onSelect }) => (
  <svg viewBox="0 0 1600 780" style={{ width: "100%", height: "100%", display: "block" }}>
    <defs>
      <radialGradient id="globe-bg" cx="50%" cy="40%" r="60%">
        <stop offset="0" stopColor="#FBF7EC"/>
        <stop offset="1" stopColor="#F4EEE1"/>
      </radialGradient>
      <linearGradient id="arc-grad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#C8A569" stopOpacity="0"/>
        <stop offset=".5" stopColor="#C8A569" stopOpacity=".7"/>
        <stop offset="1" stopColor="#C8A569" stopOpacity="0"/>
      </linearGradient>
    </defs>
    {/* Background card */}
    <rect width="1600" height="780" fill="url(#globe-bg)"/>
    {/* Subtle latitude lines */}
    {[160, 320, 480, 640].map(y =>
      <line key={y} x1="0" y1={y} x2="1600" y2={y}
        stroke="rgba(200,165,105,.08)" strokeDasharray="2 8"/>
    )}
    {[200, 400, 600, 800, 1000, 1200, 1400].map(x =>
      <line key={x} x1={x} y1="0" x2={x} y2="780"
        stroke="rgba(200,165,105,.06)" strokeDasharray="2 8"/>
    )}

    {/* Continent dots */}
    {CONTINENT_DOTS.map(([x, y, r], i) => (
      <circle key={i} cx={x} cy={y} r={r}
        fill={(x > 1100 && y > 380 && y < 520) || (x > 750 && x < 900 && y < 280) ? "#C8A569" : "#A89776"}
        opacity={(x > 1100 && y > 380 && y < 520) || (x > 750 && x < 900 && y < 280) ? .55 : .35}/>
    ))}

    {/* Arcs from Singapore (assumed origin) */}
    {COUNTRIES.filter(c => c.id !== "sg").map(c =>
      <Arc key={c.id} from={{x:1240, y:460}} to={{x:c.x, y:c.y}}
        opacity={selected === c.id || selected === "sg" ? .55 : .25}/>
    )}

    {/* Nodes */}
    {COUNTRIES.map(c => (
      <CountryNode key={c.id} c={c} hot={selected === c.id} onClick={onSelect}/>
    ))}
  </svg>
);

/* ------- Right panel: country detail ------- */
const ScoreRing = ({ value }) => {
  const r = 52, c = 2 * Math.PI * r;
  const pct = value / 100;
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <defs>
        <linearGradient id="ring-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#EEDBA8"/>
          <stop offset="1" stopColor="#B89150"/>
        </linearGradient>
      </defs>
      <circle cx="70" cy="70" r={r} fill="none" stroke="var(--gold-wash)" strokeWidth="10"/>
      <circle cx="70" cy="70" r={r} fill="none"
        stroke="url(#ring-g)" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${c * pct} ${c}`}
        transform="rotate(-90 70 70)"
        style={{ filter: "drop-shadow(0 2px 6px rgba(200,165,105,.4))" }}/>
      <text x="70" y="72" textAnchor="middle" fontFamily="var(--font-serif)"
        fontSize="34" fontWeight="600" fill="#2A2419" dominantBaseline="middle">{value}</text>
      <text x="70" y="96" textAnchor="middle" fontSize="10" letterSpacing=".15em" fill="#786C53">/ 100</text>
    </svg>
  );
};

const CountryPanel = ({ id, onJumpToMap }) => {
  const d = COUNTRY_DETAIL[id] || COUNTRY_DETAIL.sg;
  return (
    <div className="card" style={{ padding: 24, height: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 600 }}>{d.name}</h2>
            <span className={`chip ${d.statusKind}`}>{d.status}</span>
          </div>
          <div style={{ fontSize: 11, letterSpacing: ".18em", color: "var(--ink-3)", marginTop: 4, textTransform: "uppercase" }}>{d.sub} · Country brief</div>
        </div>
        <div style={{
          width: 56, height: 64, position: "relative",
          background: "linear-gradient(135deg, var(--silk), var(--pearl) 60%, var(--gold-wash))",
          borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
          boxShadow: "inset -4px -2px 8px rgba(168,144,96,.15), inset 4px 4px 10px rgba(255,255,255,.6)"
        }}>
          <div style={{ position: "absolute", top: 10, left: "50%", transform: "translateX(-50%) rotate(45deg)", width: 10, height: 10, background: "var(--gold-1)", boxShadow: "0 0 0 1px var(--pearl)" }}/>
        </div>
      </div>

      <div className="gold-divider" style={{ margin: "18px 0 14px" }}><Icon name="diamond" size={10}/></div>

      {/* Score + competition */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 18, alignItems: "center" }}>
        <ScoreRing value={d.score}/>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", rowGap: 12 }}>
          <Row label="竞争强度" value={
            <span style={{ display: "flex", gap: 3 }}>
              {[1,2,3,4,5].map(i => (
                <Icon key={i} name="diamond" size={14}
                  style={{ color: i <= d.competition ? "var(--gold-2)" : "var(--ink-5)", opacity: i <= d.competition ? 1 : .4 }}/>
              ))}
              <span style={{ fontSize: 12, color: "var(--ink-3)", marginLeft: 6, alignSelf: "center" }}>{d.competitionLabel}</span>
            </span>
          }/>
          <Row label="政策环境" value={
            <span className={`chip ${d.policyKind}`} style={{ fontSize: 12 }}>{d.policy}</span>
          }/>
          <Row label="市场增速 (YoY)" value={
            <span style={{ color: "var(--sage-deep)", fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 600 }}>{d.growth}</span>
          }/>
        </div>
      </div>

      <div style={{ marginTop: 22, marginBottom: 10, fontSize: 11, letterSpacing: ".18em", color: "var(--ink-3)", textTransform: "uppercase", fontWeight: 600 }}>市场亮点 · MARKET HIGHLIGHTS</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {d.bullets.map((b, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 14px",
            background: "var(--ivory)",
            border: "1px solid var(--line-soft)",
            borderRadius: 10,
            fontSize: 13.5,
            color: "var(--ink-2)",
          }}>
            <span style={{
              width: 26, height: 26, borderRadius: 8,
              background: "var(--gold-wash)", display: "grid", placeItems: "center",
              color: "var(--gold-2)", flexShrink: 0,
            }}><Icon name={b.icon} size={14}/></span>
            <span>{b.text}</span>
          </div>
        ))}
      </div>

      <button onClick={() => onJumpToMap(id)}
        style={{
          marginTop: "auto", marginTop: 22,
          background: "linear-gradient(135deg, var(--gold-1), var(--gold-2))",
          color: "var(--pearl)",
          border: "none", borderRadius: 12,
          padding: "14px 18px", fontSize: 13.5, fontWeight: 600, letterSpacing: ".04em",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          boxShadow: "0 4px 12px rgba(184,145,80,.25), inset 0 1px 0 rgba(255,252,244,.4)"
        }}>
        进入 {d.name} 地图洞察
        <Icon name="right" size={14}/>
      </button>
    </div>
  );
};

const Row = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{label}</span>
    <span>{value}</span>
  </div>
);

/* ------- Bottom: key analysis cards + business impact ------- */
const Sparkline = ({ data, color = "var(--gold-2)" }) => {
  const w = 130, h = 38;
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * (h - 6) - 3}`).join(" ");
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg width={w} height={h}>
      <defs>
        <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity=".25"/>
          <stop offset="1" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#spark-${color})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={w} cy={h - ((data[data.length-1] - min) / (max - min || 1)) * (h - 6) - 3} r="2.5" fill={color}/>
    </svg>
  );
};

const KeyAnalysis = ({ onCard }) => {
  const items = [
    { icon: "diamond", title: "市场机会",  num: 28, sub: "新兴需求与增长领域识别", trend: [4,5,6,5,7,8,9,8,11,12,14,15], color: "var(--gold-2)" },
    { icon: "users",   title: "竞争动态",  num: 16, sub: "主要竞争对手与市场动向", trend: [8,7,9,11,10,12,10,13,11,14,13,16], color: "#6B7A9E" },
    { icon: "shield",  title: "法规关注",  num: 9,  sub: "政策法规与合规风险提示", trend: [3,4,3,5,4,6,5,7,6,8,7,9], color: "var(--clay)" },
  ];
  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 className="facet-rule" style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 600 }}>关键分析摘要</h3>
        <span style={{ fontSize: 11, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="info" size={12}/> 点击卡片 → 进入情报中心
        </span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        {items.map((it, i) => (
          <button key={i} onClick={() => onCard("intel")}
            className="card-hover"
            style={{
              padding: 16, textAlign: "left",
              background: "var(--ivory)",
              border: "1px solid var(--line-soft)",
              borderRadius: 12, cursor: "pointer",
            }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--gold-wash)", display: "grid", placeItems: "center", color: "var(--gold-2)" }}>
                <Icon name={it.icon} size={15}/>
              </span>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 600 }}>{it.title}</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 6 }}>
              <div className="num-display" style={{ fontSize: 38, lineHeight: 1, color: "var(--ink-1)" }}>
                {it.num}<span style={{ fontSize: 13, color: "var(--ink-3)", marginLeft: 4, fontWeight: 400 }}>条</span>
              </div>
              <Sparkline data={it.trend} color={it.color}/>
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{it.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

const BusinessImpact = ({ onAct }) => {
  const blocks = [
    { kind: "sage", icon: "diamond", title: "机会", items: ["高端珠宝需求强劲", "免税政策利好", "旅游零售增长"], cta: "把握机会" },
    { kind: "clay", icon: "alert",   title: "风险", items: ["区域竞争加剧", "成本与汇率波动", "合规要求趋严"], cta: "管控风险" },
    { kind: "gold", icon: "target",  title: "建议动作", items: ["强化品牌与产品差异化", "拓展本地合作渠道", "优化合规与供应链"], cta: "制定计划" },
  ];
  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 className="facet-rule" style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 600 }}>业务影响与建议</h3>
        <span style={{ fontSize: 11, color: "var(--ink-3)" }}>基于当前国家 · 新加坡</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        {blocks.map((b, i) => (
          <div key={i} style={{
            padding: 16,
            background: b.kind === "sage" ? "linear-gradient(180deg, var(--sage-tint), rgba(228,236,224,.4))"
                      : b.kind === "clay" ? "linear-gradient(180deg, var(--clay-tint), rgba(242,222,218,.4))"
                      : "linear-gradient(180deg, var(--gold-tint), var(--gold-wash))",
            border: `1px solid ${b.kind === "sage" ? "rgba(122,157,126,.3)" : b.kind === "clay" ? "rgba(201,127,110,.3)" : "rgba(200,165,105,.4)"}`,
            borderRadius: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, color: b.kind === "sage" ? "var(--sage-deep)" : b.kind === "clay" ? "var(--clay-deep)" : "var(--ink-2)" }}>
              <Icon name={b.icon} size={15}/>
              <span style={{ fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 600 }}>{b.title}</span>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
              {b.items.map((t, j) => (
                <li key={j} style={{ fontSize: 13, color: "var(--ink-2)", display: "flex", gap: 8, lineHeight: 1.5 }}>
                  <span style={{ width: 4, height: 4, borderRadius: 4, background: "currentColor", marginTop: 8, flexShrink: 0, opacity: .6 }}/>
                  {t}
                </li>
              ))}
            </ul>
            <button onClick={() => onAct("actions")}
              style={{
                marginTop: 14, width: "100%",
                padding: "9px 12px",
                background: "var(--pearl)",
                border: `1px solid ${b.kind === "sage" ? "rgba(122,157,126,.4)" : b.kind === "clay" ? "rgba(201,127,110,.4)" : "rgba(200,165,105,.5)"}`,
                color: b.kind === "sage" ? "var(--sage-deep)" : b.kind === "clay" ? "var(--clay-deep)" : "var(--gold-2)",
                borderRadius: 9, fontSize: 12.5, fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
              → {b.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const OverviewPage = ({ onNav }) => {
  const [selected, setSelected] = useStateOV("sg");
  return (
    <div data-screen-label="01 概览" style={{
      display: "grid",
      gridTemplateColumns: "1fr 420px",
      gridTemplateRows: "auto auto",
      gap: 18,
      padding: 22,
      minHeight: 0,
    }}>
      {/* Main map */}
      <div className="card" style={{ padding: 20, gridColumn: "1 / 2", gridRow: "1 / 2" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 className="facet-rule" style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 600 }}>全球市场热力与机会分布</h3>
          <div style={{ display: "flex", gap: 16, alignItems: "center", fontSize: 11, color: "var(--ink-3)" }}>
            <Legend dot="#7A9D7E" label="机会高"/>
            <Legend dot="#C8A569" label="机会中"/>
            <Legend dot="#C97F6E" label="风险高"/>
          </div>
        </div>
        <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid var(--line-soft)", background: "linear-gradient(135deg, var(--pearl-warm), var(--ivory))" }}>
          <WorldMap selected={selected} onSelect={setSelected}/>
          <div style={{
            position: "absolute", left: 18, bottom: 18,
            padding: "10px 14px",
            background: "rgba(255,252,244,.92)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            fontSize: 12, color: "var(--ink-2)",
            display: "flex", alignItems: "center", gap: 10,
            backdropFilter: "blur(6px)",
            boxShadow: "var(--shadow-sm)",
          }}>
            <Icon name="info" size={14} style={{ color: "var(--gold-2)" }}/>
            <span>点击地图国家 <Icon name="right" size={10}/> 右侧刷新市场详情</span>
          </div>
        </div>
      </div>

      {/* Right country panel */}
      <div style={{ gridColumn: "2 / 3", gridRow: "1 / 3" }}>
        <CountryPanel id={selected} onJumpToMap={() => onNav("map")}/>
      </div>

      {/* Bottom: key analysis + business impact (split across the map column) */}
      <div style={{ gridColumn: "1 / 2", gridRow: "2 / 3", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <KeyAnalysis onCard={onNav}/>
        <BusinessImpact onAct={onNav}/>
      </div>
    </div>
  );
};

const Legend = ({ dot, label }) => (
  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
    <span style={{ width: 8, height: 8, borderRadius: 8, background: dot, boxShadow: `0 0 0 2px rgba(255,252,244,.8), 0 0 0 3px ${dot}30`}}/>
    {label}
  </span>
);

Object.assign(window, { OverviewPage });
