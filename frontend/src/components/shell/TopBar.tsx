import DiamondMark from '../ui/DiamondMark'
import Icon from '../ui/Icon'
import type { Filters } from '../../api/types'

interface FilterPillProps {
  icon: string
  label: string
  value: string
  onClick: () => void
}

function FilterPill({ icon, label, value, onClick }: FilterPillProps) {
  return (
    <button onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 18px',
        background: 'var(--pearl)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        boxShadow: 'var(--shadow-sm), var(--shadow-inner)',
        minWidth: 220, textAlign: 'left',
        transition: 'all .15s ease',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--line-strong)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--line)')}>
      <span style={{
        width: 32, height: 32, borderRadius: 8,
        background: 'var(--gold-wash)',
        display: 'grid', placeItems: 'center',
        color: 'var(--gold-2)', border: '1px solid var(--line-soft)',
      }}>
        <Icon name={icon} size={16} />
      </span>
      <span style={{ flex: 1, lineHeight: 1.2 }}>
        <div style={{ fontSize: 11, color: 'var(--ink-3)', letterSpacing: '.06em' }}>{label}</div>
        <div style={{ fontSize: 13.5, color: 'var(--ink-1)', fontWeight: 600 }}>{value}</div>
      </span>
      <Icon name="chevron" size={14} style={{ color: 'var(--ink-4)' }} />
    </button>
  )
}

interface TopBarProps {
  filters: Filters
  setFilters: React.Dispatch<React.SetStateAction<Filters>>
}

export default function TopBar({ filters, setFilters }: TopBarProps) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 32px 18px 28px',
      borderBottom: '1px solid var(--line-soft)',
      background: 'linear-gradient(180deg, rgba(255,252,244,.7), rgba(250,246,238,.3))',
      backdropFilter: 'blur(6px)',
      position: 'relative', zIndex: 5,
    }}>
      <div className="flex items-center gap-3">
        <DiamondMark size={44} />
        <div>
          <h1 style={{
            margin: 0, fontFamily: 'var(--font-serif)',
            fontSize: 24, fontWeight: 600, letterSpacing: '0.04em',
            color: 'var(--ink-1)',
          }}>全球市场战略情报看板</h1>
          <div style={{
            fontSize: 11, color: 'var(--ink-3)', marginTop: 2,
            letterSpacing: '.18em', textTransform: 'uppercase', fontWeight: 500,
          }}>Jewelry Overseas Market Intelligence · Aurum Radar</div>
        </div>
      </div>
      <div className="flex gap-3">
        <FilterPill icon="calendar" label="时间范围 / TIME"
          value={filters.time}
          onClick={() => setFilters(f => ({
            ...f,
            time: f.time === '2026/05/01 – 2026/05/31'
              ? '2026/04/01 – 2026/04/30'
              : '2026/05/01 – 2026/05/31',
          }))} />
        <FilterPill icon="globe" label="地区 / REGION"
          value={filters.region}
          onClick={() => setFilters(f => ({ ...f, region: f.region === '全球' ? '亚太' : '全球' }))} />
        <FilterPill icon="tag" label="品类 / CATEGORY"
          value={filters.category}
          onClick={() => setFilters(f => ({ ...f, category: f.category === '全部品类' ? '高端品类' : '全部品类' }))} />
      </div>
    </header>
  )
}
