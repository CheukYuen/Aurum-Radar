import { useState, useRef, useEffect, useCallback } from 'react'
import Icon from '../ui/Icon'
import { streamAgent, type AgentType } from '../../api/agentStream'
import { CHIP_DEFS, buildChipContext, type ChipId } from '../../api/chipContext'

const SUGGESTED_QUESTIONS = [
  '为什么今天的市场被判断为机会增强？',
  '金价高位对哪些产品线影响最大？',
  '今天有哪些 P0 / P1 行动建议？',
  '哪些判断有最高可信来源？',
]

interface ChatMessage {
  id: string
  role: 'user' | 'agent'
  text: string
  loading?: boolean
  streaming?: boolean
}

export interface AgentChatDrawerProps {
  open: boolean
  onClose: () => void
  initialQuestion?: string
  currentCountry: string
}

function AgentAvatar() {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 8, flexShrink: 0,
      background: 'linear-gradient(135deg, var(--gold-tint), var(--gold-wash))',
      border: '1px solid var(--line)',
      display: 'grid', placeItems: 'center', color: 'var(--gold-2)',
    }}>
      <Icon name="diamond" size={12} />
    </div>
  )
}

function LoadingBubble() {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <AgentAvatar />
      <div style={{
        padding: '12px 16px',
        background: 'var(--pearl)', border: '1px solid var(--line-soft)', borderRadius: '4px 12px 12px 12px',
      }}>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {[0, 1, 2].map(i => (
            <span key={i} style={{
              width: 6, height: 6, borderRadius: 3,
              background: 'var(--gold-3)',
              display: 'inline-block',
              animation: 'agent-pulse 1.2s ease infinite',
              animationDelay: `${i * 0.22}s`,
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function AgentBubble({ msg }: { msg: ChatMessage }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <AgentAvatar />
      <div style={{
        flex: 1,
        padding: '12px 14px',
        background: 'var(--pearl)', border: '1px solid var(--line-soft)', borderRadius: '4px 12px 12px 12px',
        fontSize: 13.5, color: 'var(--ink-1)', lineHeight: 1.65,
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
      }}>
        {msg.text}
        {msg.streaming && (
          <span style={{
            display: 'inline-block', width: 8, height: 14,
            background: 'var(--gold-2)', marginLeft: 2, verticalAlign: 'text-bottom',
            animation: 'agent-pulse 0.8s ease infinite',
          }} />
        )}
      </div>
    </div>
  )
}

export default function AgentChatDrawer({ open, onClose, initialQuestion, currentCountry }: AgentChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [selected, setSelected] = useState<Set<ChipId>>(new Set())
  const [chipCache, setChipCache] = useState<Map<ChipId, string>>(new Map())
  const [chipLoading, setChipLoading] = useState<Set<ChipId>>(new Set())
  const [chipError, setChipError] = useState<Set<ChipId>>(new Set())
  const [inlineError, setInlineError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const sessionIdRef = useRef<string | null>(null)
  const streamingRef = useRef(false)
  const didSendRef = useRef(false)

  useEffect(() => {
    if (open) {
      setMessages([])
      setInput('')
      setSelected(new Set())
      setChipCache(new Map())
      setChipLoading(new Set())
      setChipError(new Set())
      setInlineError('')
      sessionIdRef.current = null
      streamingRef.current = false
      didSendRef.current = false
    }
  }, [open])

  useEffect(() => {
    if (open && initialQuestion && !didSendRef.current) {
      didSendRef.current = true
      doSend(initialQuestion)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialQuestion])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleChipClick = useCallback(async (id: ChipId) => {
    const def = CHIP_DEFS.find(d => d.id === id)!
    const isSelecting = !selected.has(id)

    const newSelected = new Set(selected)
    if (isSelecting) {
      newSelected.add(id)
      // 选中 correlation → 同步选中 priority（关联分析需要事件 ID 上下文）
      if (id === 'correlation') newSelected.add('priority')
    } else {
      newSelected.delete(id)
      // 取消 correlation → 同步取消 priority（priority 是联动进来的）
      if (id === 'correlation') newSelected.delete('priority')
      // 取消 priority → 同步取消 correlation（关联分析失去事件上下文，无法继续）
      if (id === 'priority') newSelected.delete('correlation')
    }
    setSelected(newSelected)
    setInlineError('')

    // 拉当前 chip 的数据（未缓存）
    if (isSelecting && def.needsFetch && !chipCache.has(id)) {
      setChipLoading(prev => new Set([...prev, id]))
      setChipError(prev => { const s = new Set(prev); s.delete(id); return s })
      try {
        const text = await buildChipContext(id, currentCountry)
        setChipCache(prev => new Map([...prev, [id, text]]))
      } catch {
        setChipError(prev => new Set([...prev, id]))
        setSelected(prev => { const s = new Set(prev); s.delete(id); return s })
      } finally {
        setChipLoading(prev => { const s = new Set(prev); s.delete(id); return s })
      }
    }

    // 选中 correlation 时，联动拉 priority 数据（强制刷新，确保事件 ID 是最新的）
    if (isSelecting && id === 'correlation') {
      setChipLoading(prev => new Set([...prev, 'priority']))
      setChipError(prev => { const s = new Set(prev); s.delete('priority'); return s })
      try {
        const text = await buildChipContext('priority', currentCountry)
        setChipCache(prev => new Map([...prev, ['priority', text]]))
      } catch {
        setChipError(prev => new Set([...prev, 'priority']))
      } finally {
        setChipLoading(prev => { const s = new Set(prev); s.delete('priority'); return s })
      }
    }
  }, [selected, chipCache, currentCountry])

  const doSend = useCallback(async (text: string) => {
    const q = text.trim()
    if (!q || streamingRef.current) return
    setInlineError('')

    // 组装 chip 上下文块（发给后端但UI只显示用户原始文字）
    const ctxBlocks = [...selected]
      .filter(id => id !== 'correlation')
      .map(id => chipCache.get(id))
      .filter(Boolean) as string[]

    const userContent = ctxBlocks.length
      ? ctxBlocks.join('\n\n') + '\n\n## 提问\n' + q
      : q

    const agentType: AgentType = selected.has('correlation') ? 'correlation_analysis' : 'general_chat'

    // 关联分析校验 ≥3 个事件 ID
    if (agentType === 'correlation_analysis') {
      const ids = userContent.match(/#\d{1,6}/g) ?? []
      if (ids.length < 3) {
        setInlineError(`关联分析需至少 3 条带 ID 的事件（当前识别到 ${ids.length} 条），请确认「高优先级事件」已加载完成`)
        return
      }
    }

    const userMsgId = `${Date.now()}-u`
    const agentMsgId = `${Date.now()}-a`

    // 组装多轮历史（UI text，非上下文注入版）
    const history = messages
      .filter(m => !m.loading && !m.streaming && m.text)
      .map(m => ({ role: m.role === 'user' ? 'user' as const : 'assistant' as const, content: m.text }))
    history.push({ role: 'user', content: userContent })

    setMessages(prev => [
      ...prev,
      { id: userMsgId, role: 'user', text: q },
      { id: agentMsgId, role: 'agent', text: '', loading: true },
    ])

    streamingRef.current = true
    let started = false

    try {
      for await (const chunk of streamAgent({
        type: agentType,
        sessionId: sessionIdRef.current,
        messages: history,
      })) {
        if (chunk.sessionId) sessionIdRef.current = chunk.sessionId
        if (chunk.done) break
        if (chunk.error) {
          setMessages(prev => prev.map(m =>
            m.id === agentMsgId
              ? { ...m, loading: false, streaming: false, text: `（请求失败）${chunk.error}` }
              : m
          ))
          break
        }
        if (chunk.content) {
          if (!started) {
            started = true
            setMessages(prev => prev.map(m =>
              m.id === agentMsgId ? { ...m, loading: false, streaming: true, text: chunk.content! } : m
            ))
          } else {
            setMessages(prev => prev.map(m =>
              m.id === agentMsgId ? { ...m, text: m.text + chunk.content! } : m
            ))
          }
        }
      }
    } finally {
      streamingRef.current = false
      setMessages(prev => prev.map(m =>
        m.id === agentMsgId ? { ...m, loading: false, streaming: false } : m
      ))
    }
  }, [messages, selected, chipCache])

  function handleSend() {
    const q = input.trim()
    if (!q) return
    setInput('')
    doSend(q)
  }

  if (!open) return null

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(42,36,25,.12)',
        animation: 'backdrop-fade-in 0.25s ease both',
      }} />

      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 51,
        width: 420,
        background: 'linear-gradient(180deg, #FDFAF3, #FAF7EE)',
        borderLeft: '1px solid var(--line-strong)',
        boxShadow: '-4px 0 24px rgba(120,92,40,.10)',
        display: 'flex', flexDirection: 'column',
        animation: 'drawer-slide-in 0.32s cubic-bezier(.22,.68,0,1.2) both',
      }}>

        {/* Header */}
        <div style={{
          padding: '18px 20px 14px',
          background: 'linear-gradient(180deg, #FDFAF3 60%, rgba(253,250,243,.5))',
          borderBottom: '1px solid var(--line-soft)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'linear-gradient(135deg, var(--gold-tint), var(--gold-wash))',
                border: '1px solid var(--line)',
                display: 'grid', placeItems: 'center', color: 'var(--gold-2)',
              }}>
                <Icon name="broadcast" size={18} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--ink-1)', lineHeight: 1.2 }}>
                  Aurum Agent
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, letterSpacing: '.04em' }}>
                  继续追问今日战略简报
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'transparent', border: '1px solid var(--line)',
              borderRadius: 8, width: 30, height: 30,
              color: 'var(--ink-3)', display: 'grid', placeItems: 'center',
              fontSize: 16, cursor: 'pointer',
            }}>×</button>
          </div>

          {/* Context chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
            {CHIP_DEFS.map(def => {
              const isSelected = selected.has(def.id)
              const isLoading = chipLoading.has(def.id)
              const hasError = chipError.has(def.id)
              return (
                <button
                  key={def.id}
                  onClick={() => handleChipClick(def.id)}
                  title={hasError ? '加载失败，点击重试' : undefined}
                  style={{
                    padding: '3px 10px', borderRadius: 20,
                    background: isSelected ? 'var(--gold-tint)' : 'var(--gold-wash)',
                    border: `1px solid ${isSelected ? 'var(--gold-2)' : hasError ? '#c0392b' : 'var(--line)'}`,
                    fontSize: 11, color: isSelected ? 'var(--ink-1)' : hasError ? '#c0392b' : 'var(--ink-2)',
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                    transition: 'all .15s ease',
                  }}
                >
                  {isLoading && (
                    <span style={{
                      width: 8, height: 8, borderRadius: 4,
                      border: '1.5px solid var(--gold-2)',
                      borderTopColor: 'transparent',
                      display: 'inline-block',
                      animation: 'spin 0.7s linear infinite',
                    }} />
                  )}
                  {hasError && !isLoading && <span>✕</span>}
                  {def.label(currentCountry)}
                </button>
              )
            })}
          </div>
        </div>

        {/* Conversation */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.length === 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-4)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 10 }}>
                建议问题
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {SUGGESTED_QUESTIONS.map(q => (
                  <button key={q} onClick={() => doSend(q)}
                    style={{
                      textAlign: 'left', padding: '10px 14px',
                      background: 'var(--pearl)', border: '1px solid var(--line-soft)', borderRadius: 10,
                      fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5,
                      cursor: 'pointer', transition: 'all .15s ease',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--line-strong)'; e.currentTarget.style.background = 'var(--gold-wash)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line-soft)'; e.currentTarget.style.background = 'var(--pearl)' }}
                  >{q}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            msg.role === 'user' ? (
              <div key={msg.id} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{
                  maxWidth: '82%', padding: '10px 14px',
                  background: 'linear-gradient(135deg, var(--gold-3), var(--gold-1))',
                  border: '1px solid var(--gold-2)',
                  borderRadius: '12px 4px 12px 12px',
                  fontSize: 13.5, color: 'var(--pearl)', lineHeight: 1.5,
                }}>
                  {msg.text}
                </div>
              </div>
            ) : msg.loading ? (
              <LoadingBubble key={msg.id} />
            ) : (
              <AgentBubble key={msg.id} msg={msg} />
            )
          ))}
        </div>

        {/* Input bar */}
        <div style={{
          padding: '10px 16px 12px',
          borderTop: '1px solid var(--line-soft)',
          background: 'var(--pearl)',
          flexShrink: 0,
        }}>
          {inlineError && (
            <div style={{
              marginBottom: 8, padding: '6px 10px', borderRadius: 8,
              background: 'rgba(192,57,43,.06)', border: '1px solid rgba(192,57,43,.2)',
              fontSize: 11.5, color: '#c0392b',
            }}>
              {inlineError}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
              placeholder="Ask about market signals, brief, sources, or actions…"
              style={{
                flex: 1, padding: '10px 14px',
                background: 'var(--ivory)', border: '1px solid var(--line)',
                borderRadius: 10, fontSize: 13, color: 'var(--ink-1)',
                outline: 'none', fontFamily: 'inherit',
                transition: 'border-color .15s',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--line-strong)')}
              onBlur={e => (e.target.style.borderColor = 'var(--line)')}
            />
            <button
              onClick={handleSend}
              disabled={streamingRef.current}
              style={{
                padding: '10px 18px',
                background: 'linear-gradient(135deg, var(--gold-3), var(--gold-1))',
                border: '1px solid var(--gold-2)', borderRadius: 10,
                fontSize: 13, fontWeight: 700, color: 'var(--pearl)',
                cursor: streamingRef.current ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(184,145,80,.2)',
                opacity: streamingRef.current ? 0.6 : 1,
              }}>Send</button>
          </div>
        </div>
      </div>
    </>
  )
}
