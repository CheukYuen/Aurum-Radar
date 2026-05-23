// Market codes are ISO-3166 alpha-2 (plus the synthetic "GLOBAL" bucket).
// Coordinates are WGS-84 lon/lat; projected to screen pixels at render time.
export const MARKET_LAYOUT: Record<string, { name: string; lon: number; lat: number; size: number }> = {
  // East / Southeast Asia (clustered around SG hub)
  SG: { name: '新加坡', lon: 103.82, lat:   1.35, size: 18 },
  TH: { name: '泰国',   lon: 100.99, lat:  13.75, size: 15 },
  JP: { name: '日本',   lon: 138.50, lat:  36.20, size: 14 },
  KR: { name: '韩国',   lon: 127.77, lat:  35.91, size: 13 },
  ID: { name: '印尼',   lon: 106.85, lat:  -6.20, size: 13 },
  MY: { name: '马来西亚', lon: 101.69, lat:   3.14, size: 13 },
  VN: { name: '越南',   lon: 105.84, lat:  21.03, size: 13 },
  PH: { name: '菲律宾', lon: 121.77, lat:  12.88, size: 13 },
  // Other regions
  US:     { name: '美国', lon:  -98.50, lat: 39.80, size: 16 },
  GLOBAL: { name: '全球', lon:   10.00, lat: 52.00, size: 14 },
}

/** UI display order: 全球 → 美国 → 发达国家 → 新兴市场 */
export const MARKET_DISPLAY_ORDER: readonly string[] = [
  'GLOBAL',
  'US',
  'JP', 'KR', 'SG',
  'TH', 'MY', 'ID', 'VN', 'PH',
]

export function compareMarketDisplayOrder(a: string, b: string): number {
  const ia = MARKET_DISPLAY_ORDER.indexOf(a)
  const ib = MARKET_DISPLAY_ORDER.indexOf(b)
  const rankA = ia === -1 ? MARKET_DISPLAY_ORDER.length + 1 : ia
  const rankB = ib === -1 ? MARKET_DISPLAY_ORDER.length + 1 : ib
  if (rankA !== rankB) return rankA - rankB
  return a.localeCompare(b)
}

export const DISTRICT_LAYOUT: Record<string, { x: number; y: number; sub: string }> = {
  orchard: { x: 540, y: 340, sub: 'Orchard' },
  marina: { x: 700, y: 425, sub: 'Marina Bay' },
  bugis: { x: 600, y: 270, sub: 'Bugis' },
  jurong: { x: 280, y: 360, sub: 'Jurong East' },
  tampines: { x: 830, y: 320, sub: 'Tampines' },
  changi: { x: 940, y: 295, sub: 'Changi' },
  cbd: { x: 620, y: 405, sub: 'CBD' },
}
