import { useEffect, useState } from 'react'
import DiamondMark from '../ui/DiamondMark'
import Icon from '../ui/Icon'
import { fetchJobsStatus } from '../../api'
import type { Filters } from '../../api/types'

// ── Agent status bar (top thin strip) ───────────────────────────

function AgentBar({ onOpenBriefing }: { onOpenBriefing: () => void }) {
  const [status, setStatus] = useState('连接中')
  const [lastRun, setLastRun] = useState('—')

  useEffect(() => {
    fetchJobsStatus().then(data => {
      setStatus(data.status === 'success' ? '已完成' : data.status === 'running' ? '运行中' : data.status)
      setLastRun(data.lastRun ? new Date(data.lastRun).toLocaleString('zh-CN', { hour12: false }) : '—')
    }).catch(error => {
      console.error(error)
      setStatus('待连接')
    })
  }, [])

  const items = [
    { label: '流水线状态', value: status, dot: status === '待连接' ? 'bone' : 'sage' },
    { label: '最近运行', value: lastRun, dot: 'bone' },
    { label: '数据源', value: '公开信息', dot: 'bone' },
  ]
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0,
      padding: '5px 28px',
      background: 'linear-gradient(90deg, rgba(250,242,221,.55), rgba(255,252,246,.45))',
      borderBottom: '1px solid var(--line-soft)',
      fontSize: 11.5,
    }}>
      {/* Agent name + status */}
      <div className="flex items-center gap-2" style={{ paddingRight: 20, marginRight: 20, borderRight: '1px solid var(--line)' }}>
        <span style={{
          width: 7, height: 7, borderRadius: 4,
          background: 'var(--sage)', display: 'inline-block',
          boxShadow: '0 0 0 2px var(--sage-tint)',
        }} />
        <span style={{ fontWeight: 700, color: 'var(--ink-2)', letterSpacing: '.06em', textTransform: 'uppercase', fontSize: 11 }}>
          Market Radar Agent
        </span>
        <button onClick={onOpenBriefing} style={{ background: 'transparent', border: 'none', color: 'var(--sage-deep)', fontWeight: 600, cursor: 'pointer', padding: 0 }}>查看简报</button>
      </div>

      {/* Status items */}
      {items.map((it, i) => (
        <div key={i} className="flex items-center gap-1.5" style={{ paddingRight: 20, marginRight: 20, borderRight: i < items.length - 1 ? '1px solid var(--line)' : 'none' }}>
          <span style={{
            width: 5, height: 5, borderRadius: 3,
            background: it.dot === 'sage' ? 'var(--sage)' : 'var(--ink-4)',
            display: 'inline-block',
          }} />
          {it.label && <span style={{ color: 'var(--ink-4)' }}>{it.label}</span>}
          <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{it.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Filter pill ──────────────────────────────────────────────────

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
        padding: '8px 16px',
        background: 'var(--pearl)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        boxShadow: 'var(--shadow-sm), var(--shadow-inner)',
        minWidth: 190, textAlign: 'left',
        transition: 'all .15s ease',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--line-strong)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--line)')}>
      <span style={{
        width: 28, height: 28, borderRadius: 7,
        background: 'var(--gold-wash)',
        display: 'grid', placeItems: 'center',
        color: 'var(--gold-2)', border: '1px solid var(--line-soft)',
      }}>
        <Icon name={icon} size={14} />
      </span>
      <span style={{ flex: 1, lineHeight: 1.2 }}>
        <div style={{ fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '.06em' }}>{label}</div>
        <div style={{ fontSize: 13, color: 'var(--ink-1)', fontWeight: 600 }}>{value}</div>
      </span>
      <Icon name="chevron" size={13} style={{ color: 'var(--ink-4)' }} />
    </button>
  )
}

// ── TopBar ───────────────────────────────────────────────────────

interface TopBarProps {
  filters: Filters
  setFilters: React.Dispatch<React.SetStateAction<Filters>>
  onOpenBriefing: () => void
  onOpenAgentChat: () => void
}

export default function TopBar({ filters, setFilters, onOpenBriefing, onOpenAgentChat }: TopBarProps) {
  return (
    <header style={{ borderBottom: '1px solid var(--line-soft)', position: 'relative', zIndex: 5 }}>
      {/* Thin agent status bar */}
      <AgentBar onOpenBriefing={onOpenBriefing} />

      {/* Main header row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 28px',
        background: 'linear-gradient(180deg, rgba(255,252,244,.8), rgba(250,246,238,.4))',
        backdropFilter: 'blur(6px)',
        gap: 16, flexWrap: 'wrap',
      }}>
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

        {/* Right: Filters + CTA */}
        <div className="flex items-center gap-3">
          <FilterPill icon="calendar" label="时间 / TIME"
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

          {/* Ask Agent button */}
          <button onClick={onOpenAgentChat} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '10px 16px',
            background: 'var(--pearl)',
            border: '1px solid var(--line-strong)',
            borderRadius: 12,
            color: 'var(--gold-2)',
            fontSize: 13, fontWeight: 700, letterSpacing: '.02em',
            boxShadow: 'var(--shadow-sm)',
            whiteSpace: 'nowrap',
            transition: 'all .15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--gold-wash)'; e.currentTarget.style.borderColor = 'var(--gold-2)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--pearl)'; e.currentTarget.style.borderColor = 'var(--line-strong)' }}
          >
            <Icon name="broadcast" size={14} />
            Ask Agent
          </button>

          {/* Gold CTA */}
          <button onClick={onOpenBriefing} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px',
            background: 'linear-gradient(135deg, var(--gold-1), var(--gold-2))',
            border: '1px solid var(--gold-2)',
            borderRadius: 12,
            color: 'var(--pearl)',
            fontSize: 13.5, fontWeight: 700, letterSpacing: '.02em',
            boxShadow: '0 4px 12px rgba(184,145,80,.3), inset 0 1px 0 rgba(255,252,244,.4)',
            whiteSpace: 'nowrap',
          }}>
            <Icon name="calendar" size={15} />
            查看今日战略简报
            <Icon name="right" size={13} />
          </button>
        </div>
      </div>
    </header>
  )
}
