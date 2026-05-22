import Icon from '../ui/Icon'
import type { CountryDetail, PageId } from '../../api/types'

export default function BusinessImpact({ detail, onAct }: { detail?: CountryDetail | null; onAct: (id: PageId) => void }) {
  const impacts = detail?.impacts ?? []
  const blocks = [
    {
      kind: 'sage', icon: 'diamond', title: '机会',
      items: impacts.filter(item => item.kind === 'opportunity').map(item => item.text), cta: '把握机会',
    },
    {
      kind: 'clay', icon: 'alert', title: '风险',
      items: impacts.filter(item => item.kind === 'risk').map(item => item.text), cta: '管控风险',
    },
    {
      kind: 'gold', icon: 'target', title: '需关注',
      items: impacts.filter(item => item.kind === 'watch').map(item => item.text), cta: '制定计划',
    },
  ]

  return (
    <div className="card" style={{ padding: 22 }}>
      <div className="flex justify-between items-center" style={{ marginBottom: 16 }}>
        <h3 className="facet-rule" style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600 }}>业务影响与建议</h3>
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>基于当前国家 · {detail?.name ?? '—'}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        {blocks.map((b, i) => {
          const bg = b.kind === 'sage'
            ? 'linear-gradient(180deg, var(--sage-tint), rgba(228,236,224,.4))'
            : b.kind === 'clay'
            ? 'linear-gradient(180deg, var(--clay-tint), rgba(242,222,218,.4))'
            : 'linear-gradient(180deg, var(--gold-tint), var(--gold-wash))'
          const border = b.kind === 'sage'
            ? 'rgba(122,157,126,.3)' : b.kind === 'clay'
            ? 'rgba(201,127,110,.3)' : 'rgba(200,165,105,.4)'
          const textColor = b.kind === 'sage'
            ? 'var(--sage-deep)' : b.kind === 'clay'
            ? 'var(--clay-deep)' : 'var(--ink-2)'
          return (
            <div key={i} style={{ padding: 16, background: bg, border: `1px solid ${border}`, borderRadius: 12 }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 10, color: textColor }}>
                <Icon name={b.icon} size={15} />
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 600 }}>{b.title}</span>
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(b.items.length > 0 ? b.items : ['暂无数据']).map((t, j) => (
                  <li key={j} style={{ fontSize: 13, color: 'var(--ink-2)', display: 'flex', gap: 8, lineHeight: 1.5 }}>
                    <span style={{ width: 4, height: 4, borderRadius: 4, background: 'currentColor', marginTop: 8, flexShrink: 0, opacity: .6 }} />
                    {t}
                  </li>
                ))}
              </ul>
              <button onClick={() => onAct('actions')}
                style={{
                  marginTop: 14, width: '100%',
                  padding: '9px 12px',
                  background: 'var(--pearl)',
                  border: `1px solid ${border.replace('.3)', '.4)').replace('.4)', '.5)')}`,
                  color: b.kind === 'sage' ? 'var(--sage-deep)' : b.kind === 'clay' ? 'var(--clay-deep)' : 'var(--gold-2)',
                  borderRadius: 9, fontSize: 12.5, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                → {b.cta}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
