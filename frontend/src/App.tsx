import { useState } from 'react'
import TopBar from './components/shell/TopBar'
import Sidebar from './components/shell/Sidebar'
import OverviewPage from './components/overview/OverviewPage'
import MapInsightPage from './components/map/MapInsightPage'
import IntelPage from './components/intel/IntelPage'
import ActionsPage from './components/actions/ActionsPage'
import DailyBriefingDrawer from './components/overview/DailyBriefingDrawer'
import type { Filters, PageId } from './api/types'

export default function App() {
  const [page, setPage] = useState<PageId>('overview')
  const [filters, setFilters] = useState<Filters>({
    time: '2026/05/01 – 2026/05/31',
    region: '全球',
    category: '全部品类',
  })
  const [briefingOpen, setBriefingOpen] = useState(false)
  const [activeDept, setActiveDept] = useState('mkt')

  const handleNav = (id: PageId) => {
    setPage(id)
    if (id === 'map') {
      setFilters(f => ({ ...f, region: f.region === '全球' ? '新加坡' : f.region }))
    }
  }

  const PageComp = {
    overview: <OverviewPage onNav={handleNav} onOpenBriefing={() => setBriefingOpen(true)} />,
    map:      <MapInsightPage filters={filters} />,
    intel:    <IntelPage />,
    actions:  <ActionsPage activeDept={activeDept} onDeptChange={setActiveDept} />,
  }[page]

  return (
    <div className="flex flex-col" style={{ minHeight: '100vh' }}>
      <TopBar filters={filters} setFilters={setFilters} onOpenBriefing={() => setBriefingOpen(true)} />
      <div className="flex flex-1" style={{ minHeight: 0 }}>
        <Sidebar current={page} onNav={handleNav} />
        <main className="flex-1 overflow-auto" style={{ minWidth: 0 }}>
          {PageComp}
        </main>
      </div>
      <DailyBriefingDrawer
        open={briefingOpen}
        onClose={() => setBriefingOpen(false)}
        onNav={handleNav}
        onNavToActions={(deptId) => { setActiveDept(deptId); handleNav('actions'); setBriefingOpen(false) }}
      />
    </div>
  )
}
