import {
  COUNTRIES,
  COUNTRY_DETAIL,
  SG_REGIONS,
  REGION_DETAIL,
  DEPTS,
} from './mockData'
import type {
  CountryNode,
  CountryDetail,
  SgRegion,
  RegionDetail,
  IntelEvent,
  Department,
} from './types'

export type { IntelEvent, Department, CountryNode, CountryDetail, SgRegion, RegionDetail } from './types'

const BASE = '/api'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
  return res.json()
}

// ── Events（已接后端）──────────────────────────────────────────

export interface EventsResponse {
  items: IntelEvent[]
  total: number
  page: number
  size: number
}

function mapEvent(e: Record<string, unknown>): IntelEvent {
  return {
    id:           e.event_id as string,
    cat:          e.cat as string,
    title:        e.title as string,
    summary:      e.summary as string,
    source:       e.source as string,
    srcDetail:    e.src_detail as string,
    time:         e.time as string,
    priority:     e.priority as 'high' | 'mid',
    new:          e.new as boolean | undefined,
    impact:       e.impact as IntelEvent['impact'],
    markets:      e.markets as string[],
    brands:       e.brands as string[],
    citation:     e.citation as string,
    citationTime: e.citation_time as string,
  }
}

export async function fetchEvents(category?: string, page = 1, size = 20): Promise<EventsResponse> {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (category && category !== '全部') params.set('category', category)
  const raw = await get<{ items: Record<string, unknown>[]; total: number; page: number; size: number }>(`/events?${params}`)
  return { ...raw, items: raw.items.map(mapEvent) }
}

export async function fetchEventDetail(eventId: string): Promise<IntelEvent> {
  return get<IntelEvent>(`/events/${eventId}`)
}

// ── Dashboard summary（已接后端）──────────────────────────────

export interface DashboardSummary {
  as_of: string
  radar: {
    markets_scanned: number
    documents_integrated: number
    high_priority_changes: number
    judgments_generated: number
  }
  events_today: number
  events_today_delta: number
  high_priority_events: number
  pending_actions: number
  pending_actions_delta: number
  key_analysis: {
    opportunities: number
    competition: number
    regulation: number
  }
}

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  return get<DashboardSummary>('/dashboard/summary')
}

// ── 以下仍使用 mock 数据，待后续接口实现后替换 ─────────────────

export async function fetchCountries(): Promise<CountryNode[]> {
  return COUNTRIES
}

export async function fetchCountryDetail(id: string): Promise<CountryDetail | undefined> {
  return COUNTRY_DETAIL[id]
}

export async function fetchSgRegions(): Promise<SgRegion[]> {
  return SG_REGIONS
}

export async function fetchRegionDetail(id: string): Promise<RegionDetail | undefined> {
  return REGION_DETAIL[id]
}

export async function fetchDepartments(): Promise<Department[]> {
  return DEPTS
}
