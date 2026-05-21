import { useState } from 'react'
import SingaporeMap from './SingaporeMap'
import RegionPanel from './RegionPanel'
import Icon from '../ui/Icon'
import { SG_REGIONS, REGION_DETAIL } from '../../api/mockData'
import type { Filters } from '../../api/types'

function StoreDistribution() {
  const rows = [...SG_REGIONS].sort((a, b) => b.stores - a.stores)
  const max = Math.max(...rows.map(r => r.stores))
  const total = rows.reduce((s, r) => s + r.stores, 0)
  return (
    <BottomCard icon="store" title="门店分布概览">
      <div className="flex flex-col gap-1.5">
        {rows.map(r => (
          <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 32px', alignItems: 'center', gap: 10, fontSize: 12.5 }}>
            <span style={{ color: 'var(--ink-2)' }}>{r.name}</span>
            <div style={{ height: 8, background: 'var(--gold-wash)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ width: `${(r.stores / max) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--gold-3), var(--gold-1))', borderRadius: 8 }} />
            </div>
            <span style={{ textAlign: 'right', color: 'var(--ink-2)', fontWeight: 600 }}>{r.stores}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line-soft)', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ color: 'var(--ink-3)' }}>合计</span>
        <span className="num-display" style={{ color: 'var(--ink-1)', fontSize: 15 }}>{total} <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>家门店</span></span>
      </div>
    </BottomCard>
  )
}

function HeatList({ onPick, selected }: { onPick: (id: string) => void; selected: string }) {
  const items = [
    { id: 'orchard', name: '乌节路', desc: '高端商业核心区，客流密集、品牌竞争激烈', heat: '高' },
    { id: 'marina',  name: '滨海湾', desc: '地标商圈，旅游客流集中、消费力强', heat: '高' },
    { id: 'bugis',   name: '武吉士', desc: '商业氛围浓厚，交通枢纽、游客集中', heat: '中' },
    { id: 'cbd',     name: '市中心', desc: '白领客群稳定，节假日客流回升明显', heat: '中' },
  ]
  return (
    <BottomCard icon="flame" title="核心商圈热力">
      <div className="flex flex-col gap-2">
        {items.map(it => (
          <button key={it.id} onClick={() => onPick(it.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: 8, borderRadius: 10,
              background: selected === it.id ? 'var(--gold-wash)' : 'transparent',
              border: selected === it.id ? '1px solid var(--line)' : '1px solid transparent',
              textAlign: 'left', cursor: 'pointer',
            }}>
            <div style={{
              width: 38, height: 38, flexShrink: 0, borderRadius: 8,
              background: 'linear-gradient(135deg, var(--silk), var(--gold-tint))',
              position: 'relative', overflow: 'hidden', border: '1px solid var(--line-soft)',
            }}>
              <svg viewBox="0 0 38 38" style={{ position: 'absolute', inset: 0 }}>
                <rect x="6"  y="20" width="6" height="14" fill="rgba(168,144,96,.5)" />
                <rect x="14" y="14" width="8" height="20" fill="rgba(168,144,96,.65)" />
                <rect x="24" y="18" width="6" height="16" fill="rgba(168,144,96,.5)" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-1)' }}>{it.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, lineHeight: 1.35 }}>{it.desc}</div>
            </div>
            <span className={`chip ${it.heat === '高' ? 'sage' : 'bone'}`}>热力{it.heat}</span>
          </button>
        ))}
      </div>
    </BottomCard>
  )
}

function TrafficSignals() {
  const sigs = [
    { icon: 'users',   label: '日均客流指数', value: '高', delta: '+12%' },
    { icon: 'diamond', label: '高净值客群占比', value: '高', delta: '+9%' },
    { icon: 'globe',   label: '游客占比',       value: '高', delta: '+15%' },
    { icon: 'target',  label: '平均客单价指数', value: '高', delta: '+8%' },
  ]
  return (
    <BottomCard icon="broadcast" title="客流与消费信号">
      <div className="flex flex-col gap-2">
        {sigs.map((s, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', alignItems: 'center', gap: 10,
            padding: '10px 12px',
            background: 'var(--ivory)', borderRadius: 10, border: '1px solid var(--line-soft)',
          }}>
            <span style={{ color: 'var(--gold-2)' }}><Icon name={s.icon} size={14} /></span>
            <span style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{s.label}</span>
            <span style={{ fontSize: 12.5, color: 'var(--sage-deep)', fontWeight: 600 }}>{s.value}</span>
            <span style={{ fontSize: 11.5, color: 'var(--sage-deep)', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Icon name="trending" size={11} /> {s.delta}
            </span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, fontSize: 10.5, color: 'var(--ink-3)' }}>* 相较新加坡整体平均</div>
    </BottomCard>
  )
}

function OpsRisk() {
  const risks = [
    { kind: 'clay', label: '核心商圈租金', value: '偏高', note: '需提升坪效与转化' },
    { kind: 'bone', label: '汇率波动',     value: '中等', note: '对进口成本影响显著' },
    { kind: 'sage', label: '员工招聘',     value: '稳定', note: '本地导购供给充足' },
    { kind: 'clay', label: '竞品扩张',     value: '加剧', note: 'Maison Aurelia 新增 2 店' },
  ]
  return (
    <BottomCard icon="shield" title="区域运营风险">
      <div className="flex flex-col gap-2">
        {risks.map((r, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '10px 1fr auto', gap: 10, alignItems: 'center',
            padding: '10px 12px',
            background: 'var(--ivory)', borderRadius: 10, border: '1px solid var(--line-soft)',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: 8,
              background: r.kind === 'clay' ? 'var(--clay)' : r.kind === 'sage' ? 'var(--sage)' : 'var(--ink-4)',
              boxShadow: `0 0 0 3px ${r.kind === 'clay' ? 'var(--clay-tint)' : r.kind === 'sage' ? 'var(--sage-tint)' : 'var(--gold-wash)'}`,
              marginLeft: 4,
            }} />
            <div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-1)', fontWeight: 600 }}>{r.label}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>{r.note}</div>
            </div>
            <span className={`chip ${r.kind}`}>{r.value}</span>
          </div>
        ))}
      </div>
    </BottomCard>
  )
}

function BottomCard({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
        <span style={{ color: 'var(--gold-2)' }}><Icon name={icon} size={15} /></span>
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 600, color: 'var(--ink-1)' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

export default function MapInsightPage({ filters }: { filters: Filters }) {
  const [selected, setSelected] = useState('orchard')
  const regionName = REGION_DETAIL[selected]?.name ?? ''

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 440px',
      gridTemplateRows: 'auto auto',
      gap: 18,
      padding: 22,
    }}>
      {/* Map */}
      <div className="card" style={{ padding: 20, gridColumn: '1 / 2', gridRow: '1 / 2' }}>
        <div className="flex justify-between items-center flex-wrap" style={{ marginBottom: 14, gap: 12 }}>
          <div className="flex items-center flex-wrap" style={{ gap: 16 }}>
            <h3 className="facet-rule" style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600 }}>地图洞察</h3>
            <div className="flex gap-2 items-center" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
              <span>当前国家:</span>
              <span className="chip sage">{filters.region === '全球' ? '新加坡' : filters.region}</span>
              <span style={{ marginLeft: 10 }}>当前选中区域:</span>
              <span className="chip gold">{regionName}</span>
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
            background: 'var(--gold-wash)', borderRadius: 999, border: '1px solid var(--line)',
            fontSize: 11.5, color: 'var(--ink-2)',
          }}>
            <Icon name="info" size={12} style={{ color: 'var(--gold-2)' }} />
            点击区域卡片，查看该商圈详细洞察与机会建议
          </div>
        </div>
        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line-soft)' }}>
          <SingaporeMap selected={selected} onSelect={setSelected} />
          <div style={{
            position: 'absolute', right: 16, top: 16,
            width: 44, height: 44, borderRadius: 22,
            background: 'rgba(255,252,244,.85)', border: '1px solid var(--line)',
            display: 'grid', placeItems: 'center', color: 'var(--gold-2)',
            backdropFilter: 'blur(4px)',
          }}>
            <Icon name="compass" size={20} />
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ gridColumn: '2 / 3', gridRow: '1 / 3' }}>
        <RegionPanel id={selected} />
      </div>

      {/* Bottom modules */}
      <div style={{ gridColumn: '1 / 2', gridRow: '2 / 3', display: 'grid', gridTemplateColumns: '1fr 1.1fr 1fr 1fr', gap: 14 }}>
        <StoreDistribution />
        <HeatList onPick={setSelected} selected={selected} />
        <TrafficSignals />
        <OpsRisk />
      </div>
    </div>
  )
}
