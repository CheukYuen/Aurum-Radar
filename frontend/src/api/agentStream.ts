export interface StreamChunk {
  content?: string
  sessionId?: string
  done?: boolean
  error?: string
}

export type AgentType = 'general_chat' | 'correlation_analysis'

export interface StreamAgentOpts {
  type: AgentType
  sessionId: string | null
  messages: { role: 'user' | 'assistant'; content: string }[]
  signal?: AbortSignal
}

export async function* streamAgent(opts: StreamAgentOpts): AsyncGenerator<StreamChunk> {
  const { type, sessionId, messages, signal } = opts

  let res: Response
  try {
    res = await fetch('/api/agents/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, session_id: sessionId, messages }),
      signal,
    })
  } catch (err) {
    yield { error: String(err) }
    return
  }

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    yield { error: `HTTP ${res.status}: ${text}` }
    return
  }

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buf = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })

      // SSE 事件以两个换行分隔
      const parts = buf.split('\n\n')
      buf = parts.pop() ?? ''

      for (const part of parts) {
        const line = part.trim()
        if (!line.startsWith('data: ')) continue
        const payload = line.slice(6).trim()
        if (payload === '[DONE]') {
          yield { done: true }
          return
        }
        try {
          const chunk = JSON.parse(payload)
          const sid: string | undefined = chunk.session_id
          const delta = chunk.choices?.[0]?.delta
          if (delta?.content) {
            yield { content: delta.content, sessionId: sid }
          } else if (sid) {
            yield { sessionId: sid }
          }
          // error embedded in content
          if (delta?.content) {
            try {
              const inner = JSON.parse(delta.content)
              if (inner?.error) yield { error: inner.error }
            } catch {
              // not json, that's fine
            }
          }
        } catch {
          // malformed SSE line, skip
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
