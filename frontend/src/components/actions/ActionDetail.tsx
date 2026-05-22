import Icon from '../ui/Icon'
import type { Department } from '../../api/types'

const PRIORITY_LABEL = {
  high: { text: '高优先级', k: 'clay' },
  mid:  { text: '中优先级', k: 'bone' },
  low:  { text: '低优先级', k: 'sage' },
} as const

const btnSecondary: React.CSSProperties = {
  padding: '12px 14px',
  background: 'var(--pearl)',
  border: '1px solid var(--line)',
  color: 'var(--ink-2)',
  borderRadius: 10, fontSize: 13, fontWeight: 600,
}

const btnPrimary: React.CSSProperties = {
  padding: '12px 14px',
  background: 'linear-gradient(135deg, var(--gold-1), var(--gold-2))',
  border: '1px solid var(--gold-2)',
  color: 'var(--pearl)',
  borderRadius: 10, fontSize: 13, fontWeight: 600,
  boxShadow: '0 4px 10px rgba(184,145,80,.25), inset 0 1px 0 rgba(255,252,244,.4)',
}

export default function ActionDetail({ d }: { d: Department }) {
  const pl = PRIORITY_LABEL[d.priority]
  return (
    <div className="card flex flex-col" style={{ padding: 24, height: '100%' }}>
      <div className="flex items-center gap-3">
        <span style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'var(--gold-wash)', border: '1px solid var(--line)',
          display: 'grid', placeItems: 'center', color: 'var(--gold-2)',
        }}>
          <Icon name={d.icon} size={20} />
        </span>
        <div>
          <h3 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 600 }}>{d.name}行动清单</h3>
          <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
            基于{d.market || '当前市场'}洞察生成 · {d.sub} Action Plan
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--sage)', display: 'inline-block', boxShadow: '0 0 0 2px var(--sage-tint)' }} />
            <span style={{ fontSize: 11, color: 'var(--sage-deep)', fontWeight: 600 }}>基于今日战略简报生成</span>
          </div>
        </div>
      </div>

      <div className="gold-divider" style={{ margin: '16px 0 14px' }}>
        <Icon name="diamond" size={10} />
      </div>

      <div className="flex flex-wrap gap-2" style={{ marginBottom: 16 }}>
        <span className={`chip ${pl.k}`} style={{ padding: '4px 12px', fontSize: 11.5 }}>{pl.text}</span>
        <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
          建议周期: <span style={{ color: 'var(--ink-1)', fontWeight: 600 }}>{d.cycle}</span>
        </span>
        <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
          负责人: <span style={{ color: 'var(--ink-1)', fontWeight: 600 }}>{d.owner}</span>
        </span>
      </div>

      <div style={{ fontSize: 11, letterSpacing: '.18em', color: 'var(--ink-3)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
        A. 核心目标
      </div>
      <div style={{
        padding: '14px 16px',
        background: 'linear-gradient(135deg, var(--sage-tint), #EEF2EB)',
        border: '1px solid rgba(122,157,126,.3)',
        borderRadius: 10, marginBottom: 18,
        fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 600, color: 'var(--sage-deep)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Icon name="target" size={16} />
        {d.goal}
      </div>

      <div style={{ fontSize: 11, letterSpacing: '.18em', color: 'var(--ink-3)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
        B. 行动步骤
      </div>
      <div className="flex flex-col gap-2" style={{ marginBottom: 18, position: 'relative' }}>
        <div style={{ position: 'absolute', left: 16, top: 22, bottom: 22, width: 1, background: 'var(--line-strong)', opacity: .4 }} />
        {d.steps.map((s, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '34px 1fr', gap: 12, alignItems: 'stretch', position: 'relative' }}>
            <div style={{
              width: 34, height: 34, borderRadius: 17,
              background: 'var(--pearl)', border: '2px solid var(--gold-1)',
              display: 'grid', placeItems: 'center',
              fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 600,
              color: 'var(--gold-2)', zIndex: 1,
              boxShadow: '0 2px 6px rgba(184,145,80,.18)',
            }}>{String(i + 1).padStart(2, '0')}</div>
            <div style={{
              padding: '12px 14px',
              background: 'var(--ivory)',
              border: '1px solid var(--line-soft)',
              borderRadius: 10,
              display: 'grid', gridTemplateColumns: '1fr auto', gap: 12,
            }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink-1)', marginBottom: 6 }}>{s.title}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', fontSize: 12, color: 'var(--ink-2)' }}>
                  <span style={{ color: 'var(--ink-3)' }}>目标:</span><span>{s.goal}</span>
                  <span style={{ color: 'var(--ink-3)' }}>执行:</span><span>{s.how}</span>
                  {s.expectedOutput && (
                    <>
                      <span style={{ color: 'var(--ink-3)' }}>产出:</span><span>{s.expectedOutput}</span>
                    </>
                  )}
                  {s.successMetric && (
                    <>
                      <span style={{ color: 'var(--ink-3)' }}>指标:</span><span>{s.successMetric}</span>
                    </>
                  )}
                  <span style={{ color: 'var(--ink-3)' }}>时间:</span><span style={{ color: 'var(--gold-2)', fontWeight: 600 }}>{s.when}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11, letterSpacing: '.18em', color: 'var(--ink-3)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
        C. 关联依据
      </div>
      <div style={{
        padding: 14,
        background: 'linear-gradient(135deg, var(--pearl-warm), var(--ivory))',
        border: '1px solid var(--line-soft)',
        borderRadius: 10,
        display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 18,
      }}>
        {d.refs.map((r, i) => (
          <div key={i} className="flex items-start gap-2" style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>
            <span style={{ color: 'var(--gold-2)', marginTop: 1, flexShrink: 0 }}><Icon name={r.icon} size={13} /></span>
            <span>{r.text}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 'auto' }}>
        <button style={btnSecondary}>查看详情</button>
        <button style={btnSecondary}>导出清单</button>
        <button style={btnPrimary}>标记已跟进</button>
      </div>
    </div>
  )
}
