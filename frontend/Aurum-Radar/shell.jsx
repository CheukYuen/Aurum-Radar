/* global React */
const { useState, useEffect, useRef, useMemo } = React;

/* ============================================================
   Shared icon set — simple stroke icons + a facet diamond mark
   ============================================================ */

const Icon = ({ name, size = 16, stroke = 1.6, className = "", style = {} }) => {
  const s = { width: size, height: size, ...style };
  const common = {
    width: size, height: size, viewBox: "0 0 24 24",
    fill: "none", stroke: "currentColor",
    strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round",
    className, style: s
  };
  switch (name) {
    case "home":     return <svg {...common}><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg>;
    case "map":      return <svg {...common}><path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14"/><path d="M15 6v14"/></svg>;
    case "feed":     return <svg {...common}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>;
    case "check":    return <svg {...common}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>;
    case "calendar": return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>;
    case "globe":    return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>;
    case "tag":      return <svg {...common}><path d="M20 13l-7 7-9-9V4h7l9 9z"/><circle cx="8" cy="8" r="1.4" fill="currentColor"/></svg>;
    case "chevron":  return <svg {...common}><path d="M6 9l6 6 6-6"/></svg>;
    case "right":    return <svg {...common}><path d="M9 6l6 6-6 6"/></svg>;
    case "left":     return <svg {...common}><path d="M15 6l-6 6 6 6"/></svg>;
    case "info":     return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>;
    case "alert":    return <svg {...common}><path d="M12 3l10 18H2L12 3z"/><path d="M12 10v5M12 18v.5"/></svg>;
    case "bookmark": return <svg {...common}><path d="M6 3h12v18l-6-4-6 4z"/></svg>;
    case "source":   return <svg {...common}><path d="M4 6h12a4 4 0 0 1 4 4v10H8a4 4 0 0 1-4-4z"/><path d="M4 6v10a4 4 0 0 0 4 4"/></svg>;
    case "link":     return <svg {...common}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 1 0-5.7-5.7L11 7"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7L13 17"/></svg>;
    case "store":    return <svg {...common}><path d="M3 9l2-5h14l2 5"/><path d="M3 9v11h18V9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/></svg>;
    case "flame":    return <svg {...common}><path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4-1 3 1 5 3 4-1-3 0-7 0-10z"/></svg>;
    case "wave":     return <svg {...common}><path d="M3 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/><path d="M3 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/></svg>;
    case "compass":  return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M15 9l-2 6-4 1 2-6z" fill="currentColor" stroke="none"/></svg>;
    case "users":    return <svg {...common}><circle cx="9" cy="8" r="3.5"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6"/><circle cx="17" cy="9" r="2.8"/><path d="M16 15c4 0 6 2 6 6"/></svg>;
    case "clipboard":return <svg {...common}><rect x="5" y="4" width="14" height="17" rx="2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M9 11h6M9 15h4"/></svg>;
    case "clock":    return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case "scale":    return <svg {...common}><path d="M12 3v18"/><path d="M5 21h14"/><path d="M6 7l-3 7a4 4 0 0 0 6 0L6 7zM18 7l-3 7a4 4 0 0 0 6 0l-3-7z"/></svg>;
    case "crown":    return <svg {...common}><path d="M3 7l4 4 5-7 5 7 4-4-2 12H5z"/></svg>;
    case "ring":     return <svg {...common}><circle cx="12" cy="15" r="6"/><path d="M9 5l3-2 3 2-3 4z"/></svg>;
    case "shield":   return <svg {...common}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg>;
    case "target":   return <svg {...common}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>;
    case "trending": return <svg {...common}><path d="M3 17l6-6 4 4 8-9"/><path d="M14 6h7v7"/></svg>;
    case "x":        return <svg {...common}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case "diamond":  return <svg {...common}><path d="M6 9l6-6 6 6-6 12z"/><path d="M3 9h18M9 3l3 6 3-6"/></svg>;
    case "search":   return <svg {...common}><circle cx="11" cy="11" r="7"/><path d="M16 16l4 4"/></svg>;
    case "external": return <svg {...common}><path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>;
    case "broadcast":return <svg {...common}><circle cx="12" cy="12" r="2"/><path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7"/><path d="M5.5 5.5a9 9 0 0 0 0 13M18.5 5.5a9 9 0 0 1 0 13"/></svg>;
    case "mountain": return <svg {...common}><path d="M3 20l6-10 4 6 3-4 5 8z"/></svg>;
    case "lab":      return <svg {...common}><path d="M9 3v6L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-5-10V3"/><path d="M8 3h8"/><path d="M7 14h10"/></svg>;
    case "cart":     return <svg {...common}><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M3 4h3l2 12h12l2-8H7"/></svg>;
    default: return null;
  }
};

/* Diamond mark — small decorative facet logo  */
const DiamondMark = ({ size = 36 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <defs>
      <linearGradient id="dm-g1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#EEDBA8"/>
        <stop offset=".55" stopColor="#C8A569"/>
        <stop offset="1" stopColor="#9C7A3E"/>
      </linearGradient>
      <linearGradient id="dm-g2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFFCF6"/>
        <stop offset="1" stopColor="#F0E2BB"/>
      </linearGradient>
    </defs>
    <g transform="translate(20 20)">
      {[0,1,2,3,4,5].map(i => (
        <path key={i}
          d="M0 -14 L7 -4 L0 14 L-7 -4 Z"
          fill={i % 2 ? "url(#dm-g1)" : "url(#dm-g2)"}
          stroke="#B89150" strokeWidth=".5"
          transform={`rotate(${i * 60})`}
          opacity={i % 2 ? .85 : .95}
        />
      ))}
      <circle r="3" fill="#FFFCF6" stroke="#C8A569" strokeWidth=".8"/>
    </g>
  </svg>
);

/* ============================================================
   Header — system title + 3 filter pills (no search)
   ============================================================ */

const FilterPill = ({ icon, label, value, onClick }) => (
  <button onClick={onClick}
    style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 18px",
      background: "var(--pearl)",
      border: "1px solid var(--line)",
      borderRadius: 12,
      boxShadow: "var(--shadow-sm), var(--shadow-inner)",
      minWidth: 220, textAlign: "left",
      transition: "all .15s ease",
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = "var(--line-strong)"}
    onMouseLeave={e => e.currentTarget.style.borderColor = "var(--line)"}>
    <span style={{
      width: 32, height: 32, borderRadius: 8,
      background: "var(--gold-wash)",
      display: "grid", placeItems: "center",
      color: "var(--gold-2)", border: "1px solid var(--line-soft)"
    }}>
      <Icon name={icon} size={16}/>
    </span>
    <span style={{ flex: 1, lineHeight: 1.2 }}>
      <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: ".06em" }}>{label}</div>
      <div style={{ fontSize: 13.5, color: "var(--ink-1)", fontWeight: 600 }}>{value}</div>
    </span>
    <Icon name="chevron" size={14} style={{ color: "var(--ink-4)" }}/>
  </button>
);

const TopBar = ({ filters, setFilters }) => (
  <header style={{
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "18px 32px 18px 28px",
    borderBottom: "1px solid var(--line-soft)",
    background: "linear-gradient(180deg, rgba(255,252,244,.7), rgba(250,246,238,.3))",
    backdropFilter: "blur(6px)",
    position: "relative", zIndex: 5,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <DiamondMark size={44}/>
      <div>
        <h1 style={{
          margin: 0, fontFamily: "var(--font-serif)",
          fontSize: 24, fontWeight: 600, letterSpacing: "0.04em",
          color: "var(--ink-1)",
        }}>全球市场战略情报看板</h1>
        <div style={{
          fontSize: 11, color: "var(--ink-3)", marginTop: 2,
          letterSpacing: ".18em", textTransform: "uppercase",
          fontWeight: 500,
        }}>Jewelry Overseas Market Intelligence · Aurum Radar</div>
      </div>
    </div>
    <div style={{ display: "flex", gap: 12 }}>
      <FilterPill icon="calendar" label="时间范围 / TIME"
        value={filters.time}
        onClick={() => setFilters(f => ({ ...f, time: f.time === "2024/05/01 – 2024/05/31" ? "2024/06/01 – 2024/06/30" : "2024/05/01 – 2024/05/31" }))} />
      <FilterPill icon="globe" label="地区 / REGION"
        value={filters.region}
        onClick={() => setFilters(f => ({ ...f, region: f.region === "全球" ? "亚太" : "全球" }))} />
      <FilterPill icon="tag" label="品类 / CATEGORY"
        value={filters.category}
        onClick={() => setFilters(f => ({ ...f, category: f.category === "全部品类" ? "高端品类" : "全部品类" }))} />
    </div>
  </header>
);

/* ============================================================
   Sidebar nav — gold highlight on active
   ============================================================ */
const NAV = [
  { id: "overview",   label: "概览",   sub: "Overview",     icon: "home"   },
  { id: "map",        label: "地图洞察", sub: "Map Insight",  icon: "map"    },
  { id: "intel",      label: "情报中心", sub: "Intelligence", icon: "feed"   },
  { id: "actions",    label: "行动建议", sub: "Actions",      icon: "check"  },
];

const Sidebar = ({ current, onNav }) => (
  <aside style={{
    width: 108, flexShrink: 0,
    background: "linear-gradient(180deg, var(--pearl-warm), var(--ivory))",
    borderRight: "1px solid var(--line-soft)",
    display: "flex", flexDirection: "column",
    padding: "24px 14px",
    gap: 8,
    position: "relative",
  }}>
    {NAV.map(item => {
      const active = current === item.id;
      return (
        <button key={item.id} onClick={() => onNav(item.id)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            padding: "16px 8px",
            borderRadius: 14,
            background: active
              ? "linear-gradient(180deg, var(--gold-tint), var(--gold-wash))"
              : "transparent",
            border: active ? "1px solid var(--line-strong)" : "1px solid transparent",
            boxShadow: active ? "var(--shadow-sm), var(--shadow-inner)" : "none",
            color: active ? "var(--ink-1)" : "var(--ink-3)",
            transition: "all .18s ease",
            position: "relative",
          }}
          onMouseEnter={e => { if (!active) e.currentTarget.style.background = "rgba(200,165,105,.06)"; }}
          onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
        >
          {active && (
            <span style={{
              position: "absolute", left: -14, top: "50%", transform: "translateY(-50%) rotate(45deg)",
              width: 8, height: 8, background: "var(--gold-1)",
              boxShadow: "0 0 0 2px var(--ivory), 0 0 0 3px var(--gold-3)"
            }}/>
          )}
          <span style={{
            width: 34, height: 34, borderRadius: 10,
            background: active ? "var(--pearl)" : "transparent",
            display: "grid", placeItems: "center",
            color: active ? "var(--gold-2)" : "var(--ink-4)",
            border: active ? "1px solid var(--line)" : "1px solid transparent",
          }}>
            <Icon name={item.icon} size={18}/>
          </span>
          <div style={{
            fontFamily: "var(--font-serif)",
            fontSize: 14, fontWeight: 600, letterSpacing: ".05em",
          }}>{item.label}</div>
          <div style={{
            fontSize: 9.5, letterSpacing: ".14em", textTransform: "uppercase",
            color: active ? "var(--gold-2)" : "var(--ink-4)",
          }}>{item.sub}</div>
        </button>
      );
    })}

    {/* Footer mark - silk + diamond decoration */}
    <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, paddingTop: 24, opacity: .7 }}>
      <div style={{
        width: 56, height: 80,
        background: "linear-gradient(135deg, #FFFCF6 0%, #F0E8D6 40%, #E8DFC8 70%, #FFFCF6 100%)",
        borderRadius: "40% 60% 50% 50%",
        filter: "blur(.4px)",
        boxShadow: "inset 4px 6px 12px rgba(168,144,96,.18), inset -4px -2px 8px rgba(255,255,255,.6)",
        position: "relative",
      }}>
        <div style={{
          position: "absolute", left: "50%", top: "50%",
          transform: "translate(-50%,-50%) rotate(45deg)",
          width: 18, height: 18,
          background: "linear-gradient(135deg, #FFFCF6, #DCC089)",
          boxShadow: "0 2px 8px rgba(168,144,96,.4), inset 0 0 0 1px rgba(255,255,255,.5)",
        }}/>
      </div>
      <div style={{ fontSize: 9, letterSpacing: ".2em", color: "var(--ink-4)", textTransform: "uppercase" }}>v0.6 · MVP</div>
    </div>
  </aside>
);

Object.assign(window, { Icon, DiamondMark, TopBar, Sidebar, FilterPill, NAV });
