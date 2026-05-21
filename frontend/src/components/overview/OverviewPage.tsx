import { useState } from 'react'
import WorldMap, { Legend } from './WorldMap'
import CountryPanel from './CountryPanel'
import KeyAnalysis from './KeyAnalysis'
import BusinessImpact from './BusinessImpact'
import Icon from '../ui/Icon'
import type { PageId } from '../../api/types'

function AiRadarStrip({ onOpenBriefing }: { onOpenBriefing: () => void }) {
  const stats = [
    { label: '今日已扫描市场', value: '128', unit: '个' },
    { label: '整合公开信息',   value: '2,458', unit: '条' },
    { label: '高优先级变化',   value: '23', unit: '条' },
    { label: '生成战略判断',   value: '12', unit: '条' },
  ]
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0,
      padding: '10px 16px',
      background: 'linear-gradient(135deg, var(--gold-wash), rgba(255,252,246,.9))',
      border: '1px solid var(--line)', borderRadius: 12,
      marginBottom: 14,
    }}>
      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 16, marginRight: 16, borderRight: '1px solid var(--line-strong)' }}>
        <span style={{
          width: 7, height: 7, borderRadius: 4,
          background: 'var(--sage)', display: 'inline-block',
          boxShadow: '0 0 0 2px var(--sage-tint)', flexShrink: 0,
        }} />
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-1)', letterSpacing: '.02em', lineHeight: 1.2 }}>AI 市场雷达</div>
          <div style={{ fontSize: 10, color: 'var(--ink-3)', letterSpacing: '.06em' }}>最近更新 09:30</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 18, flex: 1 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--ink-1)', letterSpacing: '-0.01em' }}>{s.value}</span>
            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{s.unit}</span>
            <span style={{ fontSize: 10.5, color: 'var(--ink-4)', marginLeft: 2 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button onClick={onOpenBriefing} style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '7px 14px', flexShrink: 0,
        background: 'var(--pearl)',
        border: '1px solid var(--line-strong)',
        borderRadius: 9, fontSize: 12, fontWeight: 700, color: 'var(--gold-2)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all .15s ease',
      }}>
        <Icon name="feed" size={13} />
        查看今日战略简报
      </button>
    </div>
  )
}

export default function OverviewPage({ onNav, onOpenBriefing }: { onNav: (id: PageId) => void; onOpenBriefing: () => void }) {
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
        {/* AI Radar strip */}
        <AiRadarStrip onOpenBriefing={onOpenBriefing} />

        <div className="flex justify-between items-center" style={{ marginBottom: 14 }}>
          <h3 className="facet-rule" style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600 }}>
            全球市场雷达
          </h3>
          <div className="flex gap-4 items-center" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            <Legend dot="#7A9D7E" label="机会增强" />
            <Legend dot="#C8A569" label="需持续观察" />
            <Legend dot="#C97F6E" label="风险升温" />
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
