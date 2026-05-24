import { useState, useEffect } from 'react'
import EventCard from './EventCard'
import IntelDetail from './IntelDetail'
import Icon from '../ui/Icon'
import { fetchEvents, fetchDashboardSummary } from '../../api'
import type { DashboardSummary, IntelEvent } from '../../api'
import type { Filters } from '../../api/types'

const TABS = ['全部', '竞争', '产品', '社媒', '法规', '渠道', '宏观', '供应链']
const PAGE_SIZE = 20

function PaginationBar({ page, total, size, loading, onPageChange }: {
  page: number
  total: number
  size: number
  loading: boolean
  onPageChange: (page: number) => void
}) {
  const totalPages = Math.max(1, Math.ceil(total / size))
  const from = total === 0 ? 0 : (page - 1) * size + 1
  const to = Math.min(page * size, total)

  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 32, height: 32,
    background: disabled ? 'var(--silk)' : 'var(--pearl)',
    color: disabled ? 'var(--ink-4)' : 'var(--ink-2)',
    border: '1px solid var(--line)',
    borderRadius: 8,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  })

  return (
    <div className="flex items-center justify-between flex-wrap gap-3" style={{ paddingTop: 4 }}>
      <span style={{ fontSize: 11.5, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
        {loading ? '加载中…' : total === 0 ? '暂无情报' : `共 ${total} 条 · 显示 ${from}–${to}`}
      </span>
      {total > size && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={loading || page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="上一页"
            style={btnStyle(loading || page <= 1)}>
            <Icon name="left" size={14} />
          </button>
          <span style={{ fontSize: 12, color: 'var(--ink-2)', fontFamily: 'var(--font-mono)', minWidth: 72, textAlign: 'center' }}>
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={loading || page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="下一页"
            style={btnStyle(loading || page >= totalPages)}>
            <Icon name="right" size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, unit, delta, deltaKind = 'sage', sub }: {
  icon: string; label: string; value: string; unit: string;
  delta?: string; deltaKind?: 'sage' | 'clay'; sub: string
}) {
  return (
    <div className="card flex items-center gap-3" style={{ padding: 18 }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: 'linear-gradient(135deg, var(--gold-tint), var(--gold-wash))',
        border: '1px solid var(--line)',
        display: 'grid', placeItems: 'center', color: 'var(--gold-2)', flexShrink: 0,
        boxShadow: 'inset 0 1px 0 rgba(255,252,244,.7)',
      }}>
        <Icon name={icon} size={22} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 4 }}>{label}</div>
        <div className="flex items-baseline gap-1.5">
          <span className="num-display" style={{ fontSize: 30, color: 'var(--ink-1)' }}>{value}</span>
          <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{unit}</span>
        </div>
        <div style={{ fontSize: 11.5, marginTop: 4, color: 'var(--ink-3)' }}>
          {sub}
          {delta && (
            <span style={{ marginLeft: 8, color: deltaKind === 'sage' ? 'var(--sage-deep)' : 'var(--clay-deep)' }}>{delta}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function IntelPage({ filters }: { filters: Filters }) {
  const [tab, setTab] = useState('全部')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [events, setEvents] = useState<IntelEvent[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [summary, setSummary] = useState<DashboardSummary | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchDashboardSummary(filters.country).then(s => {
      if (cancelled) return
      setSummary(s)
    }).catch(console.error)
    return () => { cancelled = true }
  }, [filters.country])

  useEffect(() => {
    setPage(1)
  }, [filters.country])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchEvents(tab, page, PAGE_SIZE, filters.country).then(res => {
      if (cancelled) return
      setEvents(res.items)
      setTotal(res.total)
      if (res.items.length > 0) setActiveId(res.items[0]!.id)
      else setActiveId('')
      setLoading(false)
    }).catch(err => {
      console.error(err)
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [tab, filters.country, page])

  const changeTab = (t: string) => {
    setPage(1)
    setTab(t)
  }

  const active = events.find(e => e.id === activeId) ?? events[0]

  return (
    <div className="w-full min-h-0">
      <div className="mx-auto w-full max-w-[1440px] px-6 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_460px]">
      {/* Left */}
      <div className="flex min-w-0 flex-col gap-4">
        <div>
          <h2 style={{ margin: '2px 0 4px', fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 600 }}>情报中心</h2>
          <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>全球珠宝行业动态与深度情报，助力把握先机与决策</div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard icon="feed"     label="今日新增情报"
            value={String(summary?.events_today ?? '—')} unit="条"
            sub="较昨日" delta={summary ? `+${summary.events_today_delta}` : undefined} deltaKind="sage" />
          <StatCard icon="alert"    label="高优先级事件"
            value={String(summary?.high_priority_events ?? '—')} unit="条"
            sub="需重点关注" deltaKind="clay" />
          <StatCard icon="bookmark" label="待跟踪事项"
            value={String(summary?.pending_actions ?? '—')} unit="项"
            sub="较昨日" delta={summary ? `+${summary.pending_actions_delta}` : undefined} deltaKind="sage" />
        </div>

        <div className="flex justify-between items-center flex-wrap gap-3">
          <div className="flex flex-wrap gap-1.5">
            {TABS.map(t => (
              <button key={t} onClick={() => changeTab(t)}
                style={{
                  padding: '8px 16px',
                  background: tab === t ? 'var(--gold-1)' : 'var(--pearl)',
                  color: tab === t ? 'var(--pearl)' : 'var(--ink-2)',
                  border: tab === t ? '1px solid var(--gold-2)' : '1px solid var(--line)',
                  borderRadius: 999,
                  fontSize: 12.5, fontWeight: 600,
                  boxShadow: tab === t ? '0 2px 6px rgba(184,145,80,.25)' : 'none',
                }}>{t}</button>
            ))}
          </div>
          <div className="flex items-center gap-1.5" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
            <Icon name="info" size={12} style={{ color: 'var(--gold-2)' }} />
            点击情报卡片 → 查看详情与引用来源
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {events.map(e => (
            <EventCard key={e.id} e={e} active={e.id === activeId} onClick={setActiveId} />
          ))}
        </div>

        <PaginationBar
          page={page}
          total={total}
          size={PAGE_SIZE}
          loading={loading}
          onPageChange={setPage}
        />
      </div>

      {/* Right detail — sticky on large screens */}
      {active && (
        <div className="min-w-0 lg:sticky lg:top-[18px] lg:max-h-[calc(100vh-140px)]">
          <IntelDetail e={active} onClose={() => {}} />
        </div>
      )}
        </div>
      </div>
    </div>
  )
}
