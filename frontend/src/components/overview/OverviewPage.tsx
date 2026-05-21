import { useState } from 'react'
import WorldMap, { Legend } from './WorldMap'
import CountryPanel from './CountryPanel'
import KeyAnalysis from './KeyAnalysis'
import BusinessImpact from './BusinessImpact'
import Icon from '../ui/Icon'
import type { PageId } from '../../api/types'

export default function OverviewPage({ onNav }: { onNav: (id: PageId) => void }) {
  const [selected, setSelected] = useState('sg')
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 420px',
      gridTemplateRows: 'auto auto',
      gap: 18,
      padding: 22,
      minHeight: 0,
    }}>
      {/* Main map */}
      <div className="card" style={{ padding: 20, gridColumn: '1 / 2', gridRow: '1 / 2' }}>
        <div className="flex justify-between items-center" style={{ marginBottom: 14 }}>
          <h3 className="facet-rule" style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600 }}>
            全球市场热力与机会分布
          </h3>
          <div className="flex gap-4 items-center" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            <Legend dot="#7A9D7E" label="机会高" />
            <Legend dot="#C8A569" label="机会中" />
            <Legend dot="#C97F6E" label="风险高" />
          </div>
        </div>
        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--line-soft)', background: 'linear-gradient(135deg, var(--pearl-warm), var(--ivory))' }}>
          <WorldMap selected={selected} onSelect={setSelected} />
          <div style={{
            position: 'absolute', left: 18, bottom: 18,
            padding: '10px 14px',
            background: 'rgba(255,252,244,.92)',
            border: '1px solid var(--line)',
            borderRadius: 10,
            fontSize: 12, color: 'var(--ink-2)',
            display: 'flex', alignItems: 'center', gap: 10,
            backdropFilter: 'blur(6px)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <Icon name="info" size={14} style={{ color: 'var(--gold-2)' }} />
            <span>点击地图国家 <Icon name="right" size={10} /> 右侧刷新市场详情</span>
          </div>
        </div>
      </div>

      {/* Right country panel — spans both rows */}
      <div style={{ gridColumn: '2 / 3', gridRow: '1 / 3' }}>
        <CountryPanel id={selected} onJumpToMap={onNav} />
      </div>

      {/* Bottom row */}
      <div style={{ gridColumn: '1 / 2', gridRow: '2 / 3', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <KeyAnalysis onCard={onNav} />
        <BusinessImpact onAct={onNav} />
      </div>
    </div>
  )
}
