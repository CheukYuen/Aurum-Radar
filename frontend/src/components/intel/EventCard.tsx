import Icon from '../ui/Icon'
import type { IntelEvent } from '../../api/types'

const TAB_TONES: Record<string, string> = {
  全部: 'bone', 竞争: 'clay', 产品: 'gold', 社媒: 'plum', 法规: 'indigo', 渠道: 'sage',
}

interface EventCardProps {
  e: IntelEvent
  active: boolean
  onClick: (id: string) => void
}

export default function EventCard({ e, active, onClick }: EventCardProps) {
  return (
    <button onClick={() => onClick(e.id)}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        padding: '16px 18px',
        background: active ? 'linear-gradient(180deg, var(--gold-wash), var(--pearl-warm))' : 'var(--pearl)',
        border: active ? '1px solid var(--line-strong)' : '1px solid var(--line-soft)',
        borderRadius: 12,
        cursor: 'pointer',
        boxShadow: active ? 'var(--shadow-md), var(--shadow-inner)' : 'var(--shadow-sm)',
        position: 'relative',
        transition: 'all .15s ease',
      }}>
      <span style={{
        position: 'absolute', left: -1, top: 18, width: 4, height: 28, borderRadius: 4,
        background: active ? 'var(--gold-1)' : 'transparent',
      }} />
      <div className="flex items-center gap-3" style={{ marginBottom: 8 }}>
        <span className={`chip ${TAB_TONES[e.cat] ?? 'bone'}`}>{e.cat}</span>
        {e.priority === 'high' && <span className="chip clay" style={{ fontSize: 10 }}>高优先级</span>}
        {e.new && <span className="chip gold" style={{ fontSize: 10 }}>NEW</span>}
        <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{e.time}</span>
        <Icon name="right" size={12} style={{ color: 'var(--ink-4)' }} />
      </div>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 600, color: 'var(--ink-1)', lineHeight: 1.4, marginBottom: 6 }}>
        {e.title}
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55, marginBottom: 10 }}>
        {e.summary}
      </div>
      <div className="flex items-center gap-2" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
        <Icon name="source" size={12} />
        <span>来源</span>
        <span style={{ color: 'var(--ink-2)' }}>{e.source}</span>
        <span style={{ color: 'var(--ink-4)' }}>|</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{e.srcDetail}</span>
      </div>
    </button>
  )
}

export { TAB_TONES }
