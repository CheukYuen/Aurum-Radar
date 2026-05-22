export type PageId = 'overview' | 'intel' | 'actions'

export interface Filters {
  time: string
  region: string
  category: string
}

// ── Overview types ──────────────────────────────────────────────

export type StatusKind = 'high' | 'mid' | 'risk' | 'competition' | 'regulation' | 'watch'
export type ChipTone = 'sage' | 'clay' | 'gold' | 'indigo' | 'plum' | 'bone'

export interface CountryNode {
  id: string
  name: string
  sub: string
  x: number
  y: number
  status: StatusKind
  size: number
  headline?: string
}

export interface CountryBullet {
  icon: string
  text: string
}

export interface CountryImpact {
  kind: 'opportunity' | 'risk' | 'watch'
  text: string
}

export interface CountryDetail {
  name: string
  sub: string
  status: string
  statusKind: ChipTone
  score: number
  competition: number
  competitionLabel: string
  policy: string
  policyKind: ChipTone
  growth: string
  bullets: CountryBullet[]
  triggers?: string[]
  impacts?: CountryImpact[]
  asOf?: string
}

// ── Map insight types ───────────────────────────────────────────

export type HeatLevel = 'high' | 'mid'

export interface SgRegion {
  id: string
  name: string
  sub: string
  x: number
  y: number
  stores: number
  hot: HeatLevel
  priority?: boolean
}

export interface RegionMetric {
  icon: string
  label: string
  value: string
  unit?: string
  valueClass?: ChipTone
  small?: boolean
}

export interface RegionProfile {
  type: string
  scene: string
  consumption: string
  action: string
}

export interface RegionDetail {
  name: string
  sub: string
  priority: string
  metrics: RegionMetric[]
  profile: RegionProfile
  insights: string[]
  actions: string[]
}

// ── Intelligence types ──────────────────────────────────────────

export type ImpactKind = 'competitive' | 'brand' | 'trend'

export interface EventImpact {
  kind: ImpactKind
  title: string
  text: string
}

export interface IntelEvent {
  id: string
  cat: string
  title: string
  summary: string
  source: string
  srcDetail: string
  time: string
  priority: 'high' | 'mid'
  new?: boolean
  impact: EventImpact[]
  markets: string[]
  brands: string[]
  citation: string
  citationTime: string
}

// ── Actions types ───────────────────────────────────────────────

export type DeptPriority = 'high' | 'mid' | 'low'

export interface DeptStep {
  title: string
  goal: string
  how: string
  when: string
  expectedOutput?: string
  successMetric?: string
}

export interface DeptRef {
  icon: string
  text: string
}

export interface DeptSummaryItem {
  text: string
  when: string
}

export interface Department {
  id: string
  name: string
  sub: string
  icon: string
  priority: DeptPriority
  cycle: string
  owner: string
  market?: string
  actionCount?: number
  summary: DeptSummaryItem[]
  goal: string
  steps: DeptStep[]
  refs: DeptRef[]
}

// ── Council strategy (上中下三策) ─────────────────────────────────

export type StrategyTier = 'upper' | 'middle' | 'lower'

export interface StrategyOption {
  tier: StrategyTier
  name: string
  classicalBasis: string
  description: string
  preconditions: string[]
  cost: string
  expectedOutcome: string
}

export interface CouncilStrategy {
  market: string
  summary: string
  timeWindow: string
  options: StrategyOption[]
}

export interface DailyBriefMarket {
  id: string
  name: string
  sub: string
  status: string
  desc: string
}

export interface BriefAction {
  dept: string
  deptId: string
  text: string
}

export interface DailyBrief {
  briefDate: string
  asOf?: string
  executiveSummary: string
  markets: DailyBriefMarket[]
  signalChanges: { cat: string; text: string }[]
  impacts: CountryImpact[]
  actions: BriefAction[]
  sourceCount: number
  eventCount: number
}

export interface JobsStatus {
  status: string
  lastRun?: string | null
  nextRun?: string | null
  stages: { stage: string; status: string; finishedAt?: string | null; rowsAffected?: number | null }[]
}
