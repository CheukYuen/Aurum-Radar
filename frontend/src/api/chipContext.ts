import { fetchLatestBrief, fetchCountryDetail, fetchEvents, fetchDepartments, getMarketDisplayName } from './index'

export type ChipId = 'brief' | 'market' | 'priority' | 'actions' | 'correlation'

export interface ChipDef {
  id: ChipId
  label: (country: string) => string
  needsFetch: boolean
}

export const CHIP_DEFS: ChipDef[] = [
  { id: 'brief',       label: () => '今日战略简报',                       needsFetch: true },
  { id: 'market',      label: (c) => `${getMarketDisplayName(c)} 市场判断`, needsFetch: true },
  { id: 'priority',    label: () => '高优先级事件',                        needsFetch: true },
  { id: 'actions',     label: () => '部门行动建议',                        needsFetch: true },
  { id: 'correlation', label: () => '关联分析',                            needsFetch: false },
]

/** 拉取 chip 对应的上下文数据并格式化为可直接注入 prompt 的纯文本块 */
export async function buildChipContext(id: ChipId, country: string): Promise<string> {
  switch (id) {
    case 'brief': {
      const brief = await fetchLatestBrief(country)
      const opps = brief.impacts.filter(i => i.kind === 'opportunity').map(i => i.text)
      const risks = brief.impacts.filter(i => i.kind === 'risk').map(i => i.text)
      return [
        `【今日战略简报 ${brief.briefDate}】`,
        `综合: ${brief.executiveSummary}`,
        opps.length ? `机会: ${opps.join('; ')}` : '',
        risks.length ? `风险: ${risks.join('; ')}` : '',
        `（情报 ${brief.sourceCount} 条, 事件 ${brief.eventCount} 条）`,
      ].filter(Boolean).join('\n')
    }

    case 'market': {
      const detail = await fetchCountryDetail(country)
      if (!detail) return `【${getMarketDisplayName(country)} 市场判断】暂无数据`
      const opps = detail.impacts.filter(i => i.kind === 'opportunity').map(i => i.text)
      const risks = detail.impacts.filter(i => i.kind === 'risk').map(i => i.text)
      const watches = detail.impacts.filter(i => i.kind === 'watch').map(i => i.text)
      return [
        `【${detail.name} 市场判断】状态: ${detail.status || '—'} | opp=${detail.score} | 竞争=${detail.competitionLabel}`,
        opps.length ? `机会: ${opps.join('; ')}` : '',
        risks.length ? `风险: ${risks.join('; ')}` : '',
        watches.length ? `关注: ${watches.join('; ')}` : '',
      ].filter(Boolean).join('\n')
    }

    case 'priority': {
      const res = await fetchEvents('全部', 1, 20, country)
      const top = res.items
        .filter(e => e.priority === 'high')
        .slice(0, 10)
      if (!top.length) return '【高优先级事件】当前无 P0/P1 事件'
      const lines = top.map(e =>
        `[#${e.id} ${e.priority === 'high' ? 'P0/P1' : 'P2'} ${e.signalDirection}] ${e.title} — ${e.keyClaim || e.summary}`
      )
      return `【高优先级事件 top ${top.length}】\n${lines.join('\n')}`
    }

    case 'actions': {
      const depts = await fetchDepartments(country)
      const lines: string[] = []
      for (const dept of depts) {
        for (const step of dept.steps.slice(0, 1)) {
          const pri = dept.priority === 'high' ? 'P0' : dept.priority === 'mid' ? 'P1' : 'P2'
          lines.push(`[${dept.name} ${pri}] ${step.title} — 截止 ${step.when}`)
        }
      }
      const top = lines.slice(0, 6)
      if (!top.length) return '【部门行动建议】暂无数据'
      return `【部门行动建议 (top ${top.length})】\n${top.join('\n')}`
    }

    case 'correlation':
      // 不注入文本，仅作为切换 agent_type 的信号
      return ''

    default:
      return ''
  }
}
