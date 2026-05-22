import { useState } from 'react'
import TopBar from './components/shell/TopBar'
import Sidebar from './components/shell/Sidebar'
import OverviewPage from './components/overview/OverviewPage'
import IntelPage from './components/intel/IntelPage'
import ActionsPage from './components/actions/ActionsPage'
import DailyBriefingDrawer from './components/overview/DailyBriefingDrawer'
import AgentChatDrawer from './components/agent/AgentChatDrawer'
import type { Filters, PageId } from './api/types'

export default function App() {
  const [page, setPage] = useState<PageId>('overview')
  const [filters, setFilters] = useState<Filters>({
    time: '2026/05/01 – 2026/05/31',
    region: '全球',
    category: '全部品类',
  })
  const [briefingOpen, setBriefingOpen] = useState(false)
  const [agentChatOpen, setAgentChatOpen] = useState(false)
  const [agentChatQuestion, setAgentChatQuestion] = useState<string | undefined>()
  const [agentChatKey, setAgentChatKey] = useState(0)
  const [activeDept, setActiveDept] = useState('')

  const handleNav = (id: PageId) => setPage(id)

  const openBriefing = () => {
    setAgentChatOpen(false)
    setBriefingOpen(true)
  }

  const openAgentChat = (q?: string) => {
    setBriefingOpen(false)
    setAgentChatQuestion(q)
    setAgentChatKey(k => k + 1)
    setAgentChatOpen(true)
  }

  const PageComp = {
    overview: <OverviewPage onNav={handleNav} onOpenBriefing={openBriefing} />,
    intel:    <IntelPage />,
    actions:  <ActionsPage activeDept={activeDept} onDeptChange={setActiveDept} />,
  }[page]

  return (
    <div className="flex flex-col" style={{ minHeight: '100vh' }}>
      <TopBar
        filters={filters}
        setFilters={setFilters}
        onOpenBriefing={openBriefing}
        onOpenAgentChat={() => openAgentChat()}
      />
      <div className="flex flex-1" style={{ minHeight: 0 }}>
        <Sidebar current={page} onNav={handleNav} />
        <main className="flex-1 overflow-auto" style={{ minWidth: 0 }}>
          {PageComp}
        </main>
      </div>
      <DailyBriefingDrawer
        open={briefingOpen}
        onClose={() => setBriefingOpen(false)}
        onNavToActions={(deptId) => { setActiveDept(deptId); handleNav('actions'); setBriefingOpen(false) }}
        onOpenAgentChat={openAgentChat}
      />
      <AgentChatDrawer
        key={agentChatKey}
        open={agentChatOpen}
        onClose={() => setAgentChatOpen(false)}
        initialQuestion={agentChatQuestion}
      />
    </div>
  )
}
