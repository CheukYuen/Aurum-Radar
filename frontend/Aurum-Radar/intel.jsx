/* global React, Icon */
const { useState: useStateIN } = React;

/* ============================================================
   Intelligence Center — events feed + detail
   ============================================================ */

const TAB_TONES = {
  全部: "bone", 竞争: "clay", 产品: "gold", 社媒: "plum", 法规: "indigo", 渠道: "sage",
};

const EVENTS = [
  {
    id: "e1", cat: "竞争",
    title: "Maison Aurelia 收购意大利高级珠宝品牌 Damasco 多数股权",
    summary: "Maison Aurelia 集团已签署协议收购意大利高级珠宝品牌 Damasco 的多数股权，进一步强化其在高端珠宝市场的布局。",
    source: "行业报告", srcDetail: "Aurum Insight Quarterly",
    time: "05/31 09:30", priority: "high", new: true,
    impact: [
      { kind: "competitive", title: "竞争格局", text: "Maison Aurelia 在高端珠宝领域的版图进一步扩大，提升议价与渠道整合能力。" },
      { kind: "brand",       title: "品牌策略", text: "Damasco 有望获得全球渠道资源与品牌曝光支持，同业品牌定位面临升级压力。" },
      { kind: "trend",       title: "市场趋势", text: "意大利工艺与设计价值被进一步强化，利好同类品牌的定位升级。" },
    ],
    markets: ["欧洲", "北美", "中东", "亚太 (高端)"],
    brands: ["Maison Aurelia", "Damasco", "Lune Atelier", "Cartelle"],
    citation: "Aurum Insight Quarterly – Luxury Goods Market Outlook 2026",
    citationTime: "2026/05/31 09:30",
  },
  {
    id: "e2", cat: "产品",
    title: "实验室培育钻石价格持续下行，需求分化加剧",
    summary: "5 月份培育钻石毛坯价格环比下降 6%–9%，进入消费淡季后，性价比产品需求走弱，高品质大克拉需求相对稳定。",
    source: "行业报告", srcDetail: "Tenoris.BI",
    time: "05/30 16:45", priority: "high",
    impact: [
      { kind: "competitive", title: "竞争格局", text: "天然钻石与培育钻石定价差距继续扩大，分层销售策略空间放大。" },
      { kind: "brand",       title: "品牌策略", text: "高端品牌可以强化天然钻石稀缺叙事；轻奢线可以借力培育钻石性价比。" },
      { kind: "trend",       title: "市场趋势", text: "消费者教育成本上升，可追溯性与认证成为关键卖点。" },
    ],
    markets: ["北美", "欧洲", "亚太"],
    brands: ["Pandora", "Maison Aurelia", "Lab Origin", "Brilliant Earth"],
    citation: "Tenoris.BI – Diamond Price Monthly · May 2026",
    citationTime: "2026/05/30 16:45",
  },
  {
    id: "e3", cat: "社媒",
    title: "TikTok 上「Old Money 珠宝风」热度上升",
    summary: "#OldMoneyJewelry 话题播放量环比增长 38%，复古黄金与珍珠设计受 Z 世代青睐，欧美市场讨论度显著提升。",
    source: "社媒", srcDetail: "TikTok Creative Center",
    time: "05/30 11:20", priority: "mid",
    impact: [
      { kind: "competitive", title: "竞争格局", text: "复古风系列受到 DTC 品牌追捧，相关 SKU 售罄率上升。" },
      { kind: "brand",       title: "品牌策略", text: "适合推出复古金饰胶囊系列，借助社媒话题快速触达 Z 世代。" },
      { kind: "trend",       title: "市场趋势", text: "「低调奢华」叙事正在与 Old Money 美学融合，长尾内容增长可期。" },
    ],
    markets: ["北美", "欧洲", "东南亚"],
    brands: ["Lune Atelier", "Aurum Maison", "Cartelle", "Heritage Co."],
    citation: "TikTok Creative Center – Trend Pulse · May 2026",
    citationTime: "2026/05/30 11:20",
  },
  {
    id: "e4", cat: "法规",
    title: "欧盟通过新规限制黄金供应链尽职调查标准",
    summary: "欧盟理事会通过新版尽职调查指令，要求贵金属与钻石供应链加强来源透明度，企业需在 2025 年前完成合规升级。",
    source: "政府官网", srcDetail: "EUR-Lex",
    time: "05/29 18:05", priority: "high",
    impact: [
      { kind: "competitive", title: "竞争格局", text: "中小型供应商合规成本上升，集中度有望进一步提高。" },
      { kind: "brand",       title: "品牌策略", text: "需要前置披露供应链来源与可追溯证书，强化品牌信任。" },
      { kind: "trend",       title: "市场趋势", text: "ESG 与供应链透明度成为高端市场准入门槛。" },
    ],
    markets: ["欧洲", "全球"],
    brands: ["全行业适用"],
    citation: "EUR-Lex – Council Directive on Due Diligence (2026/337)",
    citationTime: "2026/05/29 18:05",
  },
  {
    id: "e5", cat: "渠道",
    title: "亚马逊推出珠宝新品类流量扶持计划",
    summary: "面向美国站珠宝类目的卖家推出广告补贴与新品流量激励，持续 90 天，最高可获 15% 广告花费返还。",
    source: "新闻", srcDetail: "Amazon Newsroom",
    time: "05/29 09:10", priority: "mid",
    impact: [
      { kind: "competitive", title: "竞争格局", text: "电商珠宝新品上架窗口期机会显著，DTC 品牌活跃度提升。" },
      { kind: "brand",       title: "品牌策略", text: "适合借助流量扶持窗口测试新品类与定价策略。" },
      { kind: "trend",       title: "市场趋势", text: "电商平台与品牌侧投放联动趋势加强。" },
    ],
    markets: ["北美"],
    brands: ["Amazon", "DTC 品牌"],
    citation: "Amazon Newsroom – Jewelry Seller Boost Program",
    citationTime: "2026/05/29 09:10",
  },
  {
    id: "e6", cat: "竞争",
    title: "Cartelle 新加坡乌节路旗舰店翻新启动",
    summary: "Cartelle 宣布对新加坡乌节路旗舰店进行为期 3 个月的翻新升级，期间将开设临时体验店。",
    source: "新闻", srcDetail: "Straits Times Lifestyle",
    time: "05/28 14:25", priority: "mid",
    impact: [
      { kind: "competitive", title: "竞争格局", text: "乌节路核心商圈短期内将释放约 5% 高端客流分流机会。" },
      { kind: "brand",       title: "品牌策略", text: "建议在翻新窗口期加强乌节路曝光与会员邀约。" },
      { kind: "trend",       title: "市场趋势", text: "旗舰店体验升级成为奢侈品零售竞争重点。" },
    ],
    markets: ["亚太", "新加坡"],
    brands: ["Cartelle"],
    citation: "Straits Times Lifestyle · May 28, 2026",
    citationTime: "2026/05/28 14:25",
  },
  {
    id: "e7", cat: "产品",
    title: "彩色宝石（碧玺、坦桑石）询价量持续走高",
    summary: "Q2 彩色宝石询价指数环比增长 22%，高端定制订单占比扩大，年轻消费者偏好色彩个性化。",
    source: "行业报告", srcDetail: "Color Stone Insight",
    time: "05/28 10:40", priority: "mid",
    impact: [
      { kind: "competitive", title: "竞争格局", text: "彩色宝石供应商议价能力上升，库存周转率成关键。" },
      { kind: "brand",       title: "品牌策略", text: "建议丰富彩色宝石 SKU，强化「色彩 × 个性」叙事。" },
      { kind: "trend",       title: "市场趋势", text: "彩色宝石与古典金属工艺组合成为新热点。" },
    ],
    markets: ["亚太", "北美"],
    brands: ["Color Atelier", "Aurum Maison", "Lune Atelier"],
    citation: "Color Stone Insight – Q2 Demand Pulse",
    citationTime: "2026/05/28 10:40",
  },
];

const StatCard = ({ icon, label, value, unit, delta, deltaKind = "sage", sub }) => (
  <div className="card" style={{ padding: 18, display: "flex", alignItems: "center", gap: 14 }}>
    <div style={{
      width: 56, height: 56, borderRadius: 14,
      background: "linear-gradient(135deg, var(--gold-tint), var(--gold-wash))",
      border: "1px solid var(--line)",
      display: "grid", placeItems: "center", color: "var(--gold-2)", flexShrink: 0,
      boxShadow: "inset 0 1px 0 rgba(255,252,244,.7)"
    }}>
      <Icon name={icon} size={22}/>
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginBottom: 4 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span className="num-display" style={{ fontSize: 30, color: "var(--ink-1)" }}>{value}</span>
        <span style={{ fontSize: 13, color: "var(--ink-3)" }}>{unit}</span>
      </div>
      <div style={{ fontSize: 11.5, color: deltaKind === "clay" ? "var(--clay-deep)" : "var(--ink-3)", marginTop: 4 }}>
        {sub}
        {delta && <span style={{ marginLeft: 8, color: deltaKind === "sage" ? "var(--sage-deep)" : deltaKind === "clay" ? "var(--clay-deep)" : "var(--ink-3)" }}>{delta}</span>}
      </div>
    </div>
  </div>
);

const EventCard = ({ e, active, onClick }) => (
  <button onClick={() => onClick(e.id)}
    style={{
      display: "block", width: "100%", textAlign: "left",
      padding: "16px 18px",
      background: active ? "linear-gradient(180deg, var(--gold-wash), var(--pearl-warm))" : "var(--pearl)",
      border: active ? "1px solid var(--line-strong)" : "1px solid var(--line-soft)",
      borderRadius: 12,
      cursor: "pointer",
      boxShadow: active ? "var(--shadow-md), var(--shadow-inner)" : "var(--shadow-sm)",
      position: "relative",
      transition: "all .15s ease",
    }}>
    {/* Left accent dot */}
    <span style={{
      position: "absolute", left: -1, top: 18, width: 4, height: 28,
      borderRadius: 4,
      background: active ? "var(--gold-1)" : "transparent",
    }}/>
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
      <span className={`chip ${TAB_TONES[e.cat]}`}>{e.cat}</span>
      {e.priority === "high" && <span className="chip clay" style={{ fontSize: 10 }}>高优先级</span>}
      {e.new && <span className="chip gold" style={{ fontSize: 10 }}>NEW</span>}
      <span style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>{e.time}</span>
      <Icon name="right" size={12} style={{ color: "var(--ink-4)" }}/>
    </div>
    <div style={{ fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 600, color: "var(--ink-1)", lineHeight: 1.4, marginBottom: 6 }}>
      {e.title}
    </div>
    <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55, marginBottom: 10 }}>
      {e.summary}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "var(--ink-3)" }}>
      <Icon name="source" size={12}/>
      <span>来源</span>
      <span style={{ color: "var(--ink-2)" }}>{e.source}</span>
      <span style={{ color: "var(--ink-4)" }}>|</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{e.srcDetail}</span>
    </div>
  </button>
);

const ImpactBlock = ({ items }) => {
  const iconMap = { competitive: "users", brand: "crown", trend: "trending" };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((it, i) => (
        <div key={i} style={{
          padding: "12px 14px",
          background: "var(--ivory)",
          border: "1px solid var(--line-soft)",
          borderRadius: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, color: "var(--gold-2)" }}>
            <Icon name={iconMap[it.kind]} size={13}/>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-1)" }}>{it.title}</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>{it.text}</div>
        </div>
      ))}
    </div>
  );
};

/* Brand pseudo-logo placeholder — text only, no real logos */
const BrandTile = ({ name }) => {
  // Hash-derived font choice for variety
  const fontIdx = name.length % 3;
  const fonts = ["var(--font-serif)", "Georgia, serif", "var(--font-sans)"];
  return (
    <div style={{
      padding: "10px 12px", minHeight: 38,
      background: "var(--pearl)",
      border: "1px solid var(--line)",
      borderRadius: 8,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: fonts[fontIdx],
      fontSize: 12, fontWeight: 600, letterSpacing: ".08em",
      color: "var(--ink-2)",
      textTransform: name.length < 16 ? "uppercase" : "none",
      textAlign: "center",
    }}>{name}</div>
  );
};

const IntelDetail = ({ e, onClose }) => (
  <div className="card" style={{ padding: 22, height: "100%", display: "flex", flexDirection: "column", overflowY: "auto" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
      <div>
        <h3 className="facet-rule" style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: 20, fontWeight: 600 }}>事件详情</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <span className={`chip ${TAB_TONES[e.cat]}`}>{e.cat}</span>
          {e.priority === "high" && <span className="chip clay" style={{ fontSize: 10 }}>高优先级</span>}
          <span style={{ fontSize: 11.5, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>{e.time}</span>
        </div>
      </div>
      <button onClick={onClose}
        style={{ background: "transparent", border: "1px solid var(--line)", borderRadius: 8, width: 30, height: 30, color: "var(--ink-3)", display: "grid", placeItems: "center" }}>
        <Icon name="x" size={14}/>
      </button>
    </div>

    {/* Diamond decoration */}
    <div style={{ position: "relative", marginBottom: 14, padding: 14, background: "linear-gradient(135deg, var(--gold-wash), var(--pearl-warm))", border: "1px solid var(--line)", borderRadius: 12 }}>
      <div style={{ fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 600, color: "var(--ink-1)", lineHeight: 1.45, paddingRight: 56 }}>
        {e.title}
      </div>
      {/* Decorative facet */}
      <svg width="48" height="48" viewBox="0 0 48 48" style={{ position: "absolute", right: 10, top: 10, opacity: .85 }}>
        <defs><linearGradient id="evd-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFCF6"/><stop offset="1" stopColor="#C8A569"/></linearGradient></defs>
        <g transform="translate(24 24)">
          <path d="M0 -16 L10 -4 L0 18 L-10 -4 Z" fill="url(#evd-g)" stroke="#B89150" strokeWidth=".6"/>
          <path d="M-10 -4 L10 -4" stroke="#B89150" strokeWidth=".5"/>
          <path d="M0 -16 L0 18" stroke="#B89150" strokeWidth=".3" opacity=".5"/>
        </g>
      </svg>
    </div>

    <DetailSection icon="clipboard" title="事件摘要">
      <div style={{ fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.65 }}>{e.summary}</div>
    </DetailSection>

    <DetailSection icon="trending" title="潜在影响">
      <ImpactBlock items={e.impact}/>
    </DetailSection>

    <DetailSection icon="globe" title="关联市场">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {e.markets.map((m, i) => <span key={i} className="chip sage">{m}</span>)}
      </div>
    </DetailSection>

    <DetailSection icon="users" title="相关品牌 / 平台">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {e.brands.map((b, i) => <BrandTile key={i} name={b}/>)}
      </div>
    </DetailSection>

    <div style={{ fontSize: 11, letterSpacing: ".18em", color: "var(--ink-3)", textTransform: "uppercase", fontWeight: 600, marginBottom: 8, marginTop: 8 }}>
      <Icon name="source" size={11} style={{ verticalAlign: "-1px" }}/> 来源引用 · SOURCE
    </div>
    <div style={{
      padding: 14,
      background: "linear-gradient(135deg, var(--ivory), var(--pearl-warm))",
      border: "1px solid var(--line)",
      borderRadius: 10,
      display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, color: "var(--ink-1)", fontWeight: 600, marginBottom: 4 }}>{e.citation}</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>发布时间: {e.citationTime}</div>
      </div>
      <button style={{
        padding: "8px 12px",
        background: "var(--pearl)", border: "1px solid var(--line-strong)", borderRadius: 8,
        fontSize: 12, fontWeight: 600, color: "var(--ink-2)",
        display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
      }}>
        查看原文 <Icon name="external" size={11}/>
      </button>
    </div>

    <div style={{ marginTop: 14, padding: 12, background: "var(--gold-wash)", borderRadius: 10, border: "1px dashed var(--line-strong)", display: "flex", alignItems: "flex-start", gap: 8, fontSize: 11.5, color: "var(--ink-3)" }}>
      <Icon name="info" size={12} style={{ color: "var(--gold-2)", marginTop: 1, flexShrink: 0 }}/>
      <span>以上为 AI 提炼内容，仅供参考。请结合原始来源进行判断。</span>
    </div>
  </div>
);

const DetailSection = ({ icon, title, children }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "var(--gold-2)" }}>
      <Icon name={icon} size={13}/>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-1)", letterSpacing: ".04em" }}>{title}</span>
    </div>
    {children}
  </div>
);

const IntelPage = () => {
  const [tab, setTab] = useStateIN("全部");
  const [activeId, setActiveId] = useStateIN("e1");
  const filtered = tab === "全部" ? EVENTS : EVENTS.filter(e => e.cat === tab);
  const active = EVENTS.find(e => e.id === activeId) || EVENTS[0];

  return (
    <div data-screen-label="03 情报中心" style={{
      display: "grid",
      gridTemplateColumns: "1fr 460px",
      gap: 18,
      padding: 22,
    }}>
      {/* Left column */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <h2 style={{ margin: "2px 0 4px", fontFamily: "var(--font-serif)", fontSize: 26, fontWeight: 600 }}>情报中心</h2>
          <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>全球珠宝行业动态与深度情报，助力把握先机与决策</div>
        </div>

        {/* Stat row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <StatCard icon="feed"     label="今日新增情报" value="28" unit="条" sub="较昨日" delta="+12"/>
          <StatCard icon="alert"    label="高优先级事件" value="7"  unit="条" sub="需重点关注" deltaKind="clay"/>
          <StatCard icon="bookmark" label="待跟踪事项"   value="15" unit="项" sub="较昨日" delta="+3"/>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["全部", "竞争", "产品", "社媒", "法规", "渠道"].map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{
                  padding: "8px 16px",
                  background: tab === t ? "var(--gold-1)" : "var(--pearl)",
                  color: tab === t ? "var(--pearl)" : "var(--ink-2)",
                  border: tab === t ? "1px solid var(--gold-2)" : "1px solid var(--line)",
                  borderRadius: 999,
                  fontSize: 12.5, fontWeight: 600,
                  boxShadow: tab === t ? "0 2px 6px rgba(184,145,80,.25)" : "none",
                }}>{t}</button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--ink-3)" }}>
            <Icon name="info" size={12} style={{ color: "var(--gold-2)" }}/>
            点击情报卡片 → 查看详情与引用来源
          </div>
        </div>

        {/* Event list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(e => (
            <EventCard key={e.id} e={e} active={e.id === activeId} onClick={setActiveId}/>
          ))}
        </div>
      </div>

      {/* Right detail panel */}
      <div style={{ position: "sticky", top: 18, maxHeight: "calc(100vh - 140px)" }}>
        <IntelDetail e={active} onClose={() => {}}/>
      </div>
    </div>
  );
};

Object.assign(window, { IntelPage });
