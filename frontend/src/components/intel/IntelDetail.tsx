import Icon from '../ui/Icon'
import { TAB_TONES } from './EventCard'
import type { IntelEvent, EventImpact } from '../../api/types'

const IMPACT_ICONS: Record<string, string> = { competitive: 'users', brand: 'crown', trend: 'trending' }

function ImpactBlock({ items }: { items: EventImpact[] }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((it, i) => (
        <div key={i} style={{ padding: '12px 14px', background: 'var(--ivory)', border: '1px solid var(--line-soft)', borderRadius: 10 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 5, color: 'var(--gold-2)' }}>
            <Icon name={IMPACT_ICONS[it.kind] ?? 'info'} size={13} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-1)' }}>{it.title}</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.55 }}>{it.text}</div>
        </div>
      ))}
    </div>
  )
}

function BrandTile({ name }: { name: string }) {
  return (
    <div style={{
      padding: '10px 12px', minHeight: 38,
      background: 'var(--pearl)',
      border: '1px solid var(--line)',
      borderRadius: 8,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: name.length % 3 === 0 ? 'var(--font-serif)' : name.length % 3 === 1 ? 'Georgia, serif' : 'var(--font-sans)',
      fontSize: 12, fontWeight: 600, letterSpacing: '.08em',
      color: 'var(--ink-2)',
      textTransform: name.length < 16 ? 'uppercase' : 'none',
      textAlign: 'center',
    }}>{name}</div>
  )
}

function DetailSection({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 8, color: 'var(--gold-2)' }}>
        <Icon name={icon} size={13} />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '.04em' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

export default function IntelDetail({ e, onClose }: { e: IntelEvent; onClose: () => void }) {
  return (
    <div className="card flex flex-col" style={{ padding: 22, height: '100%', overflowY: 'auto' }}>
      <div className="flex justify-between items-start" style={{ marginBottom: 14 }}>
        <div>
          <h3 className="facet-rule" style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 600 }}>事件详情</h3>
          <div className="flex items-center gap-2" style={{ marginTop: 8 }}>
            <span className={`chip ${TAB_TONES[e.cat] ?? 'bone'}`}>{e.cat}</span>
            {e.priority === 'high' && <span className="chip clay" style={{ fontSize: 10 }}>高优先级</span>}
            <span style={{ fontSize: 11.5, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{e.time}</span>
          </div>
        </div>
        <button onClick={onClose}
          style={{ background: 'transparent', border: '1px solid var(--line)', borderRadius: 8, width: 30, height: 30, color: 'var(--ink-3)', display: 'grid', placeItems: 'center' }}>
          <Icon name="x" size={14} />
        </button>
      </div>

      <div style={{ position: 'relative', marginBottom: 14, padding: 14, background: 'linear-gradient(135deg, var(--gold-wash), var(--pearl-warm))', border: '1px solid var(--line)', borderRadius: 12 }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 600, color: 'var(--ink-1)', lineHeight: 1.45, paddingRight: 56 }}>
          {e.title}
        </div>
        <svg width="48" height="48" viewBox="0 0 48 48" style={{ position: 'absolute', right: 10, top: 10, opacity: .85 }}>
          <defs>
            <linearGradient id="evd-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FFFCF6" />
              <stop offset="1" stopColor="#C8A569" />
            </linearGradient>
          </defs>
          <g transform="translate(24 24)">
            <path d="M0 -16 L10 -4 L0 18 L-10 -4 Z" fill="url(#evd-g)" stroke="#B89150" strokeWidth=".6" />
            <path d="M-10 -4 L10 -4" stroke="#B89150" strokeWidth=".5" />
            <path d="M0 -16 L0 18" stroke="#B89150" strokeWidth=".3" opacity=".5" />
          </g>
        </svg>
      </div>

      <DetailSection icon="clipboard" title="事件摘要">
        <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.65 }}>{e.summary}</div>
      </DetailSection>

      <DetailSection icon="trending" title="潜在影响">
        <ImpactBlock items={e.impact} />
      </DetailSection>

      <DetailSection icon="globe" title="关联市场">
        <div className="flex flex-wrap gap-2">
          {e.markets.map((m, i) => <span key={i} className="chip sage">{m}</span>)}
        </div>
      </DetailSection>

      <DetailSection icon="users" title="相关品牌 / 平台">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {e.brands.map((b, i) => <BrandTile key={i} name={b} />)}
        </div>
      </DetailSection>

      <div style={{ fontSize: 11, letterSpacing: '.18em', color: 'var(--ink-3)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8, marginTop: 8 }}>
        <Icon name="source" size={11} style={{ verticalAlign: '-1px' }} /> 来源引用 · SOURCE
      </div>
      <div style={{
        padding: 14,
        background: 'linear-gradient(135deg, var(--ivory), var(--pearl-warm))',
        border: '1px solid var(--line)', borderRadius: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, color: 'var(--ink-1)', fontWeight: 600, marginBottom: 4 }}>{e.citation}</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>发布时间: {e.citationTime}</div>
        </div>
        <button style={{
          padding: '8px 12px',
          background: 'var(--pearl)', border: '1px solid var(--line-strong)', borderRadius: 8,
          fontSize: 12, fontWeight: 600, color: 'var(--ink-2)',
          display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
        }}>
          查看原文 <Icon name="external" size={11} />
        </button>
      </div>

      <div style={{ marginTop: 14, padding: 12, background: 'var(--gold-wash)', borderRadius: 10, border: '1px dashed var(--line-strong)', display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 11.5, color: 'var(--ink-3)' }}>
        <Icon name="info" size={12} style={{ color: 'var(--gold-2)', marginTop: 1, flexShrink: 0 }} />
        <span>以上为 AI 提炼内容，仅供参考。请结合原始来源进行判断。</span>
      </div>
    </div>
  )
}
