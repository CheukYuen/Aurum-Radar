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
  onOpenBriefing: () => void
}

function AgentStatusCapsule({ onOpenBriefing }: { onOpenBriefing: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '8px 16px',
      background: 'linear-gradient(135deg, rgba(250,242,221,.85), rgba(255,252,246,.9))',
      border: '1px solid var(--line)',
      borderRadius: 12,
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Status dot + name */}
      <div className="flex items-center gap-2">
        <span style={{
          width: 7, height: 7, borderRadius: 4, flexShrink: 0,
          background: 'var(--sage)',
          boxShadow: '0 0 0 2px var(--sage-tint)',
          animation: 'pulse 2.5s ease-in-out infinite',
        }} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)', letterSpacing: '.04em', lineHeight: 1.2 }}>
            Market Radar Agent
          </div>
          <div style={{ fontSize: 10, color: 'var(--sage-deep)', fontWeight: 600, letterSpacing: '.06em' }}>
            运行中
          </div>
        </div>
      </div>

      <div style={{ width: 1, height: 28, background: 'var(--line-strong)' }} />

      {/* Status lines */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', columnGap: 12, rowGap: 2 }}>
        <StatusLine dot="sage" text="今日扫描已完成" />
        <StatusLine dot="sage" text="战略简报已生成" />
        <StatusLine dot="bone" text="下次扫描：明日 09:00" />
        <StatusLine dot="bone" text="数据来源：公开信息" />
      </div>

      <div style={{ width: 1, height: 28, background: 'var(--line-strong)' }} />

      {/* Briefing button */}
      <button onClick={onOpenBriefing} style={{
        padding: '6px 12px',
        background: 'linear-gradient(135deg, var(--gold-1), var(--gold-2))',
        border: '1px solid var(--gold-2)',
        borderRadius: 8,
        color: 'var(--pearl)',
        fontSize: 11.5, fontWeight: 700, letterSpacing: '.02em',
        boxShadow: '0 2px 6px rgba(184,145,80,.22), inset 0 1px 0 rgba(255,252,244,.3)',
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        查看今日战略简报
      </button>
    </div>
  )
}

function StatusLine({ dot, text }: { dot: 'sage' | 'bone'; text: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span style={{
        width: 5, height: 5, borderRadius: 3, flexShrink: 0,
        background: dot === 'sage' ? 'var(--sage)' : 'var(--ink-4)',
      }} />
      <span style={{ fontSize: 10.5, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{text}</span>
    </div>
  )
}

export default function TopBar({ filters, setFilters, onOpenBriefing }: TopBarProps) {
  return (
    <header style={{
      padding: '14px 32px 14px 28px',
      borderBottom: '1px solid var(--line-soft)',
      background: 'linear-gradient(180deg, rgba(255,252,244,.7), rgba(250,246,238,.3))',
      backdropFilter: 'blur(6px)',
      position: 'relative', zIndex: 5,
    }}>
      <div className="flex items-center justify-between" style={{ gap: 16, flexWrap: 'wrap' }}>
        {/* Left: Logo + title */}
        <div className="flex items-center gap-3">
          <DiamondMark size={40} />
          <div>
            <h1 style={{
              margin: 0, fontFamily: 'var(--font-serif)',
              fontSize: 22, fontWeight: 600, letterSpacing: '0.04em',
              color: 'var(--ink-1)',
            }}>全球市场战略情报看板</h1>
            <div style={{
              fontSize: 10.5, color: 'var(--ink-3)', marginTop: 1,
              letterSpacing: '.18em', textTransform: 'uppercase', fontWeight: 500,
            }}>Jewelry Overseas Market Intelligence · Aurum Radar</div>
          </div>
        </div>

        {/* Center: Agent status */}
        <AgentStatusCapsule onOpenBriefing={onOpenBriefing} />

        {/* Right: Filters */}
        <div className="flex gap-2.5">
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
      </div>
    </header>
  )
}
