import { geoEqualEarth } from 'd3-geo'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import worldTopo from 'world-atlas/countries-110m.json'
import type { CountryNode, StatusKind } from '../../api/types'

const STATUS_COLORS: Record<StatusKind, { fill: string; glow: string; label: string }> = {
  high:        { fill: '#7A9D7E', glow: 'rgba(122,157,126,.35)', label: '机会增强' },
  mid:         { fill: '#C8A569', glow: 'rgba(200,165,105,.35)', label: '' },
  risk:        { fill: '#C97F6E', glow: 'rgba(201,127,110,.35)', label: '风险升温' },
  competition: { fill: '#5B88B0', glow: 'rgba(91,136,176,.35)',  label: '竞争加剧' },
  regulation:  { fill: '#6B7A9E', glow: 'rgba(107,122,158,.35)', label: '法规变化' },
  watch:       { fill: '#A89776', glow: 'rgba(168,151,118,.3)',  label: '' },
}

const WIDTH = 1600
const HEIGHT = 780

// Single projection shared by the continent layer and node/arc positioning.
// Rotate -20° to center Asia-Pacific; scale 300 gives ~22% zoom so countries are more spaced out.
const proj = geoEqualEarth().rotate([-20, 0]).scale(300).translate([WIDTH / 2, HEIGHT / 2 - 10])

function project(lon: number, lat: number): [number, number] {
  return proj([lon, lat]) ?? [WIDTH / 2, HEIGHT / 2]
}

function Arc({ from, to, opacity = 0.5 }: { from: [number, number]; to: [number, number]; opacity?: number }) {
  const [fx, fy] = from
  const [tx, ty] = to
  const mx = (fx + tx) / 2
  const my = (fy + ty) / 2 - Math.abs(fx - tx) * 0.15
  return (
    <path d={`M ${fx} ${fy} Q ${mx} ${my} ${tx} ${ty}`}
      fill="none" stroke="url(#arc-grad)" strokeWidth="1"
      strokeDasharray="2 4" opacity={opacity} />
  )
}

function CountryNodeEl({ c, hot, onClick }: { c: CountryNode; hot: boolean; onClick: (id: string) => void }) {
  const s = STATUS_COLORS[c.status]
  const [cx, cy] = project(c.lon, c.lat)
  return (
    <g style={{ cursor: 'pointer' }} onClick={() => onClick(c.id)}>
      {hot && (
        <circle cx={cx} cy={cy} r={c.size + 14} fill="none" stroke={s.fill} strokeWidth="1" opacity={.4}>
          <animate attributeName="r" values={`${c.size + 6};${c.size + 28};${c.size + 6}`} dur="3.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values=".5;0;.5" dur="3.6s" repeatCount="indefinite" />
        </circle>
      )}
      <circle cx={cx} cy={cy} r={c.size + 6} fill={s.glow} opacity={hot ? .9 : .55} />
      <circle cx={cx} cy={cy} r={c.size} fill={s.fill}
        stroke="#FFFCF6" strokeWidth={hot ? 3 : 2}
        style={{ filter: `drop-shadow(0 4px 8px ${s.glow})` }} />
      <circle cx={cx - c.size * 0.3} cy={cy - c.size * 0.3} r={c.size * 0.3} fill="rgba(255,255,255,.5)" />
      <g transform={`translate(${cx + c.size + 12} ${cy - 4})`}>
        <text fontFamily="var(--font-serif)" fontSize="20" fontWeight="600" fill="#2A2419">{c.name}</text>
        {s.label && (
          <text y="20" fontFamily="var(--font-sans)" fontSize="12" fill={s.fill} fontWeight="600">{s.label}</text>
        )}
      </g>
    </g>
  )
}

// Fixed badge in the top-right corner of the SVG for the GLOBAL market
function GlobalCornerNode({ c, hot, onClick }: { c: CountryNode; hot: boolean; onClick: (id: string) => void }) {
  const s = STATUS_COLORS[c.status]
  const bx = 1418, by = 28, bw = 158, bh = 52, br = 10
  return (
    <g style={{ cursor: 'pointer' }} onClick={() => onClick(c.id)}>
      {hot && (
        <rect x={bx - 4} y={by - 4} width={bw + 8} height={bh + 8} rx={br + 4}
          fill="none" stroke={s.fill} strokeWidth="1" opacity={0}>
          <animate attributeName="opacity" values="0.5;0;0.5" dur="3.6s" repeatCount="indefinite" />
        </rect>
      )}
      <rect x={bx} y={by} width={bw} height={bh} rx={br}
        fill={hot ? s.glow : 'rgba(251,247,236,0.88)'}
        stroke={hot ? s.fill : 'rgba(168,144,96,0.25)'}
        strokeWidth={hot ? 1.5 : 1} />
      <circle cx={bx + 22} cy={by + bh / 2} r={6} fill={s.fill}
        style={{ filter: `drop-shadow(0 2px 4px ${s.glow})` }} />
      <text x={bx + 36} y={by + bh / 2 + 8}
        fontFamily="var(--font-serif)" fontSize="22" fontWeight="600" fill="#2A2419">
        全球总览
      </text>
    </g>
  )
}

interface WorldMapProps {
  selected: string
  countries: CountryNode[]
  onSelect: (id: string) => void
}

export default function WorldMap({ selected, countries, onSelect }: WorldMapProps) {
  const hub = countries.find(c => c.id === 'SG') ?? countries[0]
  const geoCountries = countries.filter(c => c.id !== 'GLOBAL')
  const globalNode = countries.find(c => c.id === 'GLOBAL')

  return (
    <ComposableMap
      // Pass the d3 projection instance directly so Geographies and nodes share the same transform
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      projection={proj as any}
      width={WIDTH}
      height={HEIGHT}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <defs>
        <radialGradient id="globe-bg" cx="50%" cy="40%" r="60%">
          <stop offset="0" stopColor="#FBF7EC" />
          <stop offset="1" stopColor="#F4EEE1" />
        </radialGradient>
        <linearGradient id="arc-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#C8A569" stopOpacity="0" />
          <stop offset=".5" stopColor="#C8A569" stopOpacity=".7" />
          <stop offset="1" stopColor="#C8A569" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width={WIDTH} height={HEIGHT} fill="url(#globe-bg)" />

      {/* 大陆轮廓底图 — 浅金色，无交互 */}
      <Geographies geography={worldTopo as any}>
        {({ geographies }) =>
          geographies.map(geo => (
            <Geography
              key={geo.rsmKey}
              geography={geo}
              style={{
                default: { fill: 'rgba(190, 150, 80, 0.06)', stroke: 'rgba(150, 110, 60, 0.12)', strokeWidth: 0.5, outline: 'none' },
                hover:   { fill: 'rgba(190, 150, 80, 0.06)', stroke: 'rgba(150, 110, 60, 0.12)', strokeWidth: 0.5, outline: 'none' },
                pressed: { fill: 'rgba(190, 150, 80, 0.06)', stroke: 'rgba(150, 110, 60, 0.12)', strokeWidth: 0.5, outline: 'none' },
              }}
            />
          ))
        }
      </Geographies>

      {/* 虚线经纬网格叠加层 */}
      {[160, 320, 480, 640].map(y =>
        <line key={y} x1="0" y1={y} x2="1600" y2={y} stroke="rgba(200,165,105,.08)" strokeDasharray="2 8" />
      )}
      {[200, 400, 600, 800, 1000, 1200, 1400].map(x =>
        <line key={x} x1={x} y1="0" x2={x} y2="780" stroke="rgba(200,165,105,.06)" strokeDasharray="2 8" />
      )}

      {/* Hub → 其他地理市场的金色弧线（排除 GLOBAL） */}
      {hub && geoCountries.filter(c => c.id !== hub.id).map(c =>
        <Arc key={c.id}
          from={project(hub.lon, hub.lat)}
          to={project(c.lon, c.lat)}
          opacity={selected === c.id || selected === hub.id ? .55 : .25} />
      )}

      {/* 地理市场节点（排除 GLOBAL） */}
      {geoCountries.map(c => (
        <CountryNodeEl key={c.id} c={c} hot={selected === c.id} onClick={onSelect} />
      ))}

      {/* 全球总览 — 固定在右上角的徽章，不参与地理投影 */}
      {globalNode && (
        <GlobalCornerNode c={globalNode} hot={selected === 'GLOBAL'} onClick={onSelect} />
      )}
    </ComposableMap>
  )
}

export function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span style={{ width: 8, height: 8, borderRadius: 8, background: dot, boxShadow: `0 0 0 2px rgba(255,252,244,.8), 0 0 0 3px ${dot}30` }} />
      {label}
    </span>
  )
}
