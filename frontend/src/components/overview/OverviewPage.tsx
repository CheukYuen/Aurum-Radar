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
    { label: '战略判断生成',   value: '12', unit: '条' },
  ]
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '12px 18px',
      background: 'linear-gradient(135deg, rgba(250,242,221,.7), rgba(255,252,246,.85))',
      border: '1px solid var(--line)', borderRadius: 12,
      marginBottom: 14, gap: 0,
    }}>
      {/* Icon + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingRight: 20, marginRight: 20, borderRight: '1px solid var(--line-strong)', flexShrink: 0 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, var(--gold-tint), var(--gold-wash))',
          border: '1px solid var(--line)',
          display: 'grid', placeItems: 'center', color: 'var(--gold-2)',
        }}>
          <Icon name="broadcast" size={20} />
        </div>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-3)', letterSpacing: '.12em', textTransform: 'uppercase', lineHeight: 1 }}>AI Market Radar</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-1)', marginTop: 2, lineHeight: 1.1 }}>AI 市场雷达·今日扫描</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', flex: 1, gap: 0 }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            paddingRight: 16, marginRight: 16,
            borderRight: i < stats.length - 1 ? '1px solid var(--line-soft)' : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 600, color: 'var(--ink-1)', letterSpacing: '-0.01em' }}>{s.value}</span>
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{s.unit}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 2, textAlign: 'center' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Timestamp + briefing button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 16, borderLeft: '1px solid var(--line-strong)', flexShrink: 0 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10.5, color: 'var(--ink-4)', letterSpacing: '.04em' }}>最近更新</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', fontFamily: 'var(--font-mono)' }}>2026/05/21 09:30</div>
        </div>
        <button onClick={onOpenBriefing} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 14px', flexShrink: 0,
          background: 'var(--pearl)',
          border: '1px solid var(--line-strong)',
          borderRadius: 9, fontSize: 12, fontWeight: 700, color: 'var(--gold-2)',
          boxShadow: 'var(--shadow-sm)',
        }}>
          战略简报
          <Icon name="right" size={12} />
        </button>
      </div>
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

        <div className="flex justify-between items-center flex-wrap" style={{ marginBottom: 14, gap: 10 }}>
          <div className="flex items-center gap-3">
            <h3 className="facet-rule" style={{ margin: 0, fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600 }}>
              全球市场雷达
            </h3>
            <span style={{
              padding: '3px 10px', borderRadius: 999,
              background: 'var(--sage-tint)', border: '1px solid rgba(122,157,126,.3)',
              fontSize: 11, fontWeight: 700, color: 'var(--sage-deep)',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: 3, background: 'var(--sage)', display: 'inline-block' }} />
              Agent · Live
            </span>
          </div>
          <div className="flex gap-3 items-center flex-wrap" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            <Legend dot="#7A9D7E" label="机会增强" />
            <Legend dot="#5B88B0" label="竞争加剧" />
            <Legend dot="#C97F6E" label="风险升温" />
            <Legend dot="#6B7A9E" label="法规变化" />
            <Legend dot="#A89776" label="需持续观察" />
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
            <span>点击地图国家，右侧刷新 Agent 今日市场判断</span>
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
