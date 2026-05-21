/* global React, ReactDOM, TopBar, Sidebar, OverviewPage, MapInsightPage, IntelPage, ActionsPage,
          useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakToggle, TweakSelect */

const { useState: useStateApp, useEffect: useEffectApp } = React;

/* ============================================================
   Aurum Radar — main app
   ============================================================ */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#C8A569",
  "density": "regular",
  "page": "overview",
  "headingFont": "serif"
}/*EDITMODE-END*/;

const PAGE_OPTIONS = [
  ["overview", "概览"],
  ["map",      "地图洞察"],
  ["intel",    "情报中心"],
  ["actions",  "行动建议"],
];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // ── Filters (top bar) — shared across pages
  const [filters, setFilters] = useStateApp({
    time: "2024/05/01 – 2024/05/31",
    region: "全球",
    category: "全部品类",
  });

  // ── Current page
  const [page, setPage] = useStateApp(t.page || "overview");
  useEffectApp(() => { setPage(t.page); }, [t.page]);

  const onNav = (id) => {
    setPage(id);
    setTweak("page", id);
    // When navigating to map from overview, lock region to Singapore
    if (id === "map") setFilters(f => ({ ...f, region: f.region === "全球" ? "新加坡" : f.region }));
  };

  // ── Apply tweak: accent color (write to CSS var)
  useEffectApp(() => {
    const root = document.documentElement.style;
    const accent = t.accent;
    // derive softer / deeper from base
    root.setProperty("--gold-1", accent);
    // Approximate deeper / lighter ramps
    root.setProperty("--gold-2", shade(accent, -0.12));
    root.setProperty("--gold-3", shade(accent,  0.18));
    root.setProperty("--gold-4", shade(accent,  0.38));
    root.setProperty("--gold-tint", withAlpha(accent, 0.20));
    root.setProperty("--gold-wash", withAlpha(accent, 0.10));
  }, [t.accent]);

  // ── Heading font swap
  useEffectApp(() => {
    const serif = '"Noto Serif SC", "Source Han Serif SC", "PingFang SC", Georgia, serif';
    const sans  = '"Manrope", "PingFang SC", "Helvetica Neue", system-ui, sans-serif';
    document.documentElement.style.setProperty("--font-serif",
      t.headingFont === "sans" ? sans : serif);
  }, [t.headingFont]);

  // ── Density
  const padding = t.density === "compact" ? 14 : t.density === "spacious" ? 28 : 22;

  // Render current page
  const PageComp = {
    overview: <OverviewPage onNav={onNav}/>,
    map:      <MapInsightPage filters={filters}/>,
    intel:    <IntelPage/>,
    actions:  <ActionsPage/>,
  }[page] || <OverviewPage onNav={onNav}/>;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <TopBar filters={filters} setFilters={setFilters}/>
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <Sidebar current={page} onNav={onNav}/>
        <main style={{ flex: 1, minWidth: 0, overflow: "auto" }}>
          {/* density override wrapping via CSS var if you want; we re-render */}
          <div style={{ "--page-pad": padding + "px" }}>
            {PageComp}
          </div>
        </main>
      </div>

      <TweaksPanel title="Aurum · Tweaks">
        <TweakSection label="Navigation"/>
        <TweakSelect label="Active page" value={t.page}
          options={PAGE_OPTIONS.map(([v, l]) => ({ value: v, label: l }))}
          onChange={v => setTweak("page", v)}/>

        <TweakSection label="Brand · Accent"/>
        <TweakColor label="Champagne" value={t.accent}
          options={["#C8A569", "#B89150", "#A67C52", "#8E9F8A", "#6E7DA0"]}
          onChange={v => setTweak("accent", v)}/>

        <TweakSection label="Type"/>
        <TweakRadio label="Headings" value={t.headingFont}
          options={[{ value: "serif", label: "Serif" }, { value: "sans", label: "Sans" }]}
          onChange={v => setTweak("headingFont", v)}/>

        <TweakSection label="Layout"/>
        <TweakRadio label="Density" value={t.density}
          options={[{ value: "compact", label: "Compact" }, { value: "regular", label: "Regular" }, { value: "spacious", label: "Spacious" }]}
          onChange={v => setTweak("density", v)}/>
      </TweaksPanel>
    </div>
  );
}

/* ----- color helpers ----- */
function hexToRgb(hex) {
  const m = hex.replace("#","");
  const n = parseInt(m.length === 3 ? m.split("").map(c => c+c).join("") : m, 16);
  return [(n>>16)&255, (n>>8)&255, n&255];
}
function rgbToHex(r,g,b) {
  const h = v => v.toString(16).padStart(2,"0");
  return "#" + h(Math.max(0,Math.min(255,Math.round(r)))) + h(Math.max(0,Math.min(255,Math.round(g)))) + h(Math.max(0,Math.min(255,Math.round(b))));
}
function shade(hex, amt) {
  // -1..1 ; negative -> darker, positive -> lighter
  const [r,g,b] = hexToRgb(hex);
  const t = amt < 0 ? 0 : 255;
  const p = Math.abs(amt);
  return rgbToHex(r + (t - r) * p, g + (t - g) * p, b + (t - b) * p);
}
function withAlpha(hex, a) {
  const [r,g,b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
