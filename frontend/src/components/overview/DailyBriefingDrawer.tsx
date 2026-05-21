import Icon from '../ui/Icon'

interface DailyBriefingDrawerProps {
  open: boolean
  onClose: () => void
}

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
        <span style={{ color: 'var(--gold-2)' }}><Icon name={icon} size={14} /></span>
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 600, color: 'var(--ink-1)' }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

function ImpactRow({ kind, label, text }: { kind: string; label: string; text: string }) {
  return (
    <div style={{
      padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start',
      background: 'var(--ivory)', border: '1px solid var(--line-soft)', borderRadius: 10,
    }}>
      <span className={`chip ${kind}`} style={{ flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>{text}</span>
    </div>
  )
}

export default function DailyBriefingDrawer({ open, onClose }: DailyBriefingDrawerProps) {
  if (!open) return null

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(42, 36, 25, 0.32)',
        backdropFilter: 'blur(2px)',
      }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 51,
        width: 480,
        background: 'var(--pearl)',
        borderLeft: '1px solid var(--line)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          padding: '22px 24px 18px',
          borderBottom: '1px solid var(--line-soft)',
          background: 'linear-gradient(180deg, rgba(255,252,244,.95), rgba(250,246,238,.6))',
          position: 'sticky', top: 0, zIndex: 1, backdropFilter: 'blur(6px)',
        }}>
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
                <span style={{
                  width: 7, height: 7, borderRadius: 4,
                  background: 'var(--sage)', display: 'inline-block',
                  boxShadow: '0 0 0 2px var(--sage-tint)',
                }} />
                <span style={{ fontSize: 11, color: 'var(--sage-deep)', fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                  Market Radar Agent · 自动生成
                </span>
              </div>
              <h2 style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 600, color: 'var(--ink-1)' }}>
                每日战略简报
              </h2>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>
                2026/05/21 09:30 · 基于公开信息自动生成
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'transparent', border: '1px solid var(--line)',
              borderRadius: 8, width: 32, height: 32,
              color: 'var(--ink-3)', display: 'grid', placeItems: 'center', flexShrink: 0,
            }}>
              <Icon name="x" size={14} />
            </button>
          </div>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 今日重点市场 */}
          <Section icon="globe" title="今日重点市场">
            <div className="flex flex-col gap-2">
              {[
                { market: '新加坡', status: '机会增强', kind: 'sage' },
                { market: '中东',   status: '风险升温', kind: 'clay' },
                { market: '欧洲',   status: '法规变化', kind: 'indigo' },
                { market: '北美',   status: '竞争加剧', kind: 'bone' },
              ].map((m, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--ivory)', border: '1px solid var(--line-soft)', borderRadius: 10,
                }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-1)' }}>{m.market}</span>
                  <span className={`chip ${m.kind}`}>{m.status}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* 关键变化 */}
          <Section icon="trending" title="关键变化">
            <div className="flex flex-col gap-2">
              {[
                { dim: '竞争', text: 'LVMH 收购 Damiani，强化高端珠宝版图', kind: 'clay' },
                { dim: '产品', text: '培育钻价格下行，高端天然钻需求分化', kind: 'gold' },
                { dim: '平台', text: '亚马逊推出珠宝新品类流量扶持计划', kind: 'sage' },
                { dim: '社媒', text: 'TikTok 上 Old Money 珠宝风热度持续上升', kind: 'plum' },
                { dim: '法规', text: '欧盟强化贵金属供应链尽调要求', kind: 'indigo' },
              ].map((c, i) => (
                <div key={i} style={{
                  padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start',
                  background: 'var(--ivory)', border: '1px solid var(--line-soft)', borderRadius: 10,
                }}>
                  <span className={`chip ${c.kind}`} style={{ flexShrink: 0, marginTop: 1 }}>{c.dim}</span>
                  <span style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>{c.text}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* 业务影响判断 */}
          <Section icon="target" title="业务影响判断">
            <div className="flex flex-col gap-2">
              <ImpactRow kind="sage"   label="机会"  text="新加坡高端商圈适合加大品牌曝光" />
              <ImpactRow kind="clay"   label="风险"  text="欧洲合规成本可能提升" />
              <ImpactRow kind="indigo" label="需关注" text="中东市场节日营销窗口与竞品投放节奏" />
            </div>
          </Section>

          {/* 建议后续行动 */}
          <Section icon="clipboard" title="建议后续行动">
            <div className="flex flex-col gap-2">
              {[
                { dept: '市场部',  text: '优先推进乌节路 / 滨海湾商圈投放' },
                { dept: '产品部',  text: '关注轻奢与高端礼赠系列组合' },
                { dept: '法务合规', text: '跟踪欧盟供应链尽调新规' },
              ].map((a, i) => (
                <div key={i} style={{
                  padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center',
                  background: 'linear-gradient(135deg, var(--gold-wash), var(--pearl-warm))',
                  border: '1px solid var(--line)', borderRadius: 10,
                }}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 6, flexShrink: 0,
                    background: 'var(--pearl)', border: '1px solid var(--line)',
                    fontSize: 11, fontWeight: 700, color: 'var(--gold-2)',
                  }}>{a.dept}</span>
                  <span style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>{a.text}</span>
                </div>
              ))}
            </div>
          </Section>

          <div style={{
            fontSize: 11.5, color: 'var(--ink-3)', lineHeight: 1.65,
            padding: '10px 14px',
            background: 'var(--gold-wash)', borderRadius: 10,
            border: '1px dashed var(--line-strong)',
          }}>
            <Icon name="info" size={11} style={{ color: 'var(--gold-2)', verticalAlign: '-1px', marginRight: 6 }} />
            本简报由 Market Radar Agent 基于公开信息自动生成，仅供参考。请结合实际情况进行判断。
          </div>
        </div>
      </div>
    </>
  )
}
