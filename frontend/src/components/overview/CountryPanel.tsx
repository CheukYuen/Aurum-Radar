import Icon from '../ui/Icon'
import { COUNTRY_DETAIL } from '../../api/mockData'
import type { PageId } from '../../api/types'

function ScoreRing({ value }: { value: number }) {
  const r = 52, c = 2 * Math.PI * r, pct = value / 100
  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      <defs>
        <linearGradient id="ring-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#EEDBA8" />
          <stop offset="1" stopColor="#B89150" />
        </linearGradient>
      </defs>
      <circle cx="70" cy="70" r={r} fill="none" stroke="var(--gold-wash)" strokeWidth="10" />
      <circle cx="70" cy="70" r={r} fill="none"
        stroke="url(#ring-g)" strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${c * pct} ${c}`}
        transform="rotate(-90 70 70)"
        style={{ filter: 'drop-shadow(0 2px 6px rgba(200,165,105,.4))' }} />
      <text x="70" y="72" textAnchor="middle" fontFamily="var(--font-serif)"
        fontSize="34" fontWeight="600" fill="#2A2419" dominantBaseline="middle">{value}</text>
      <text x="70" y="96" textAnchor="middle" fontSize="10" letterSpacing=".15em" fill="#786C53">/ 100</text>
    </svg>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <span style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>{label}</span>
      <span>{value}</span>
    </div>
  )
}

interface CountryPanelProps {
  id: string
  onJumpToMap: (id: PageId) => void
}

export default function CountryPanel({ id, onJumpToMap }: CountryPanelProps) {
  const d = COUNTRY_DETAIL[id] ?? COUNTRY_DETAIL['sg']!
  return (
    <div className="card flex flex-col" style={{ padding: 24, height: '100%' }}>
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600 }}>{d.name}</h2>
            <span className={`chip ${d.statusKind}`}>{d.status}</span>
          </div>
          <div style={{ fontSize: 11, letterSpacing: '.18em', color: 'var(--ink-3)', marginTop: 4, textTransform: 'uppercase' }}>
            {d.sub} · Country brief
          </div>
        </div>
        <div style={{
          width: 56, height: 64,
          background: 'linear-gradient(135deg, var(--silk), var(--pearl) 60%, var(--gold-wash))',
          borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
          boxShadow: 'inset -4px -2px 8px rgba(168,144,96,.15), inset 4px 4px 10px rgba(255,255,255,.6)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 10, left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: 10, height: 10,
            background: 'var(--gold-1)',
            boxShadow: '0 0 0 1px var(--pearl)',
          }} />
        </div>
      </div>

      <div className="gold-divider" style={{ margin: '18px 0 14px' }}>
        <Icon name="diamond" size={10} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 18, alignItems: 'center' }}>
        <ScoreRing value={d.score} />
        <div className="flex flex-col gap-3">
          <Row label="竞争强度" value={
            <span className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <Icon key={i} name="diamond" size={14}
                  style={{ color: i <= d.competition ? 'var(--gold-2)' : 'var(--ink-5)', opacity: i <= d.competition ? 1 : .4 }} />
              ))}
              <span style={{ fontSize: 12, color: 'var(--ink-3)', marginLeft: 6, alignSelf: 'center' }}>{d.competitionLabel}</span>
            </span>
          } />
          <Row label="政策环境" value={<span className={`chip ${d.policyKind}`} style={{ fontSize: 12 }}>{d.policy}</span>} />
          <Row label="市场增速 (YoY)" value={
            <span style={{ color: 'var(--sage-deep)', fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600 }}>{d.growth}</span>
          } />
        </div>
      </div>

      <div style={{ marginTop: 22, marginBottom: 10, fontSize: 11, letterSpacing: '.18em', color: 'var(--ink-3)', textTransform: 'uppercase', fontWeight: 600 }}>
        市场亮点 · MARKET HIGHLIGHTS
      </div>
      <div className="flex flex-col gap-2">
        {d.bullets.map((b, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px',
            background: 'var(--ivory)',
            border: '1px solid var(--line-soft)',
            borderRadius: 10,
            fontSize: 13.5, color: 'var(--ink-2)',
          }}>
            <span style={{
              width: 26, height: 26, borderRadius: 8,
              background: 'var(--gold-wash)', display: 'grid', placeItems: 'center',
              color: 'var(--gold-2)', flexShrink: 0,
            }}><Icon name={b.icon} size={14} /></span>
            <span>{b.text}</span>
          </div>
        ))}
      </div>

      <button onClick={() => onJumpToMap('map')}
        style={{
          marginTop: 22,
          background: 'linear-gradient(135deg, var(--gold-1), var(--gold-2))',
          color: 'var(--pearl)',
          border: 'none', borderRadius: 12,
          padding: '14px 18px', fontSize: 13.5, fontWeight: 600, letterSpacing: '.04em',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: '0 4px 12px rgba(184,145,80,.25), inset 0 1px 0 rgba(255,252,244,.4)',
        }}>
        进入 {d.name} 地图洞察
        <Icon name="right" size={14} />
      </button>
    </div>
  )
}
