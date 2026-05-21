/**
 * API layer — currently returns mock data.
 * Replace each function body with a real fetch() call once the backend is ready.
 *
 * Example swap:
 *   export async function fetchEvents() {
 *     const res = await fetch('/api/events')
 *     return res.json() as Promise<IntelEvent[]>
 *   }
 */

import {
  COUNTRIES,
  COUNTRY_DETAIL,
  SG_REGIONS,
  REGION_DETAIL,
  EVENTS,
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

export async function fetchEvents(category?: string): Promise<IntelEvent[]> {
  if (!category || category === '全部') return EVENTS
  return EVENTS.filter(e => e.cat === category)
}

export async function fetchDepartments(): Promise<Department[]> {
  return DEPTS
}
