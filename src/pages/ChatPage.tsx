import { useEffect, useRef, useState } from 'react'
import type { ChatSession, Entry } from '../types'
import { uid } from '../storage'
import { streamReply } from '../ai'

interface Props {
  chats: ChatSession[]
  setChats: (chats: ChatSession[]) => void
  entries: Entry[]
  apiKey: string
  setApiKey: (k: string) => void
}

export default function ChatPage({ chats, setChats, entries, apiKey, setApiKey }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState('')
  const [busy, setBusy] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [keyDraft, setKeyDraft] = useState(apiKey)
  const bottomRef = useRef<HTMLDivElement>(null)

  const active = chats.find((c) => c.id === activeId) ?? null

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [active?.messages.length, streaming])

  function newChat() {
    const session: ChatSession = {
      id: uid(),
      name: `新的对话 ${chats.length + 1}`,
      createdAt: Date.now(),
      messages: [],
    }
    setChats([session, ...chats])
    setActiveId(session.id)
  }

  function renameChat(id: string) {
    const current = chats.find((c) => c.id === id)
    const name = window.prompt('给这个对话起个名字：', current?.name ?? '')
    if (name?.trim()) {
      setChats(chats.map((c) => (c.id === id ? { ...c, name: name.trim() } : c)))
    }
  }

  function deleteChat(id: string) {
    if (!window.confirm('删除这个对话？聊天记录不会保留。')) return
    setChats(chats.filter((c) => c.id !== id))
    if (activeId === id) setActiveId(null)
  }

  async function send() {
    const content = input.trim()
    if (!content || busy || !active) return
    setInput('')
    setBusy(true)

    const userMsg = { role: 'user' as const, content, ts: Date.now() }
    const history = [...active.messages, userMsg]
    // 先落一次用户消息
    let next = chats.map((c) => (c.id === active.id ? { ...c, messages: history } : c))
    setChats(next)

    let acc = ''
    try {
      const full = await streamReply(apiKey, history, entries, (delta) => {
        acc += delta
        setStreaming(acc)
      })
      const aiMsg = { role: 'assistant' as const, content: full, ts: Date.now() }
      next = next.map((c) => (c.id === active.id ? { ...c, messages: [...history, aiMsg] } : c))
      setChats(next)
    } catch (err) {
      const msg =
        err instanceof Error && /401|auth/i.test(err.message)
          ? '（API Key 好像不对，去右上角设置里检查一下？）'
          : '（刚才走神了，没听清…再说一次好吗？）'
      next = next.map((c) =>
        c.id === active.id
          ? { ...c, messages: [...history, { role: 'assistant' as const, content: msg, ts: Date.now() }] }
          : c,
      )
      setChats(next)
    } finally {
      setStreaming('')
      setBusy(false)
    }
  }

  // 会话列表视图
  if (!active) {
    return (
      <div className="page chat-list">
        <div className="glow" aria-hidden />
        <header className="topbar">
          <span className="topbar-label">絮语</span>
          <button className="icon-btn" onClick={() => setShowSettings(true)} title="设置">
            ⚙
          </button>
        </header>
        <h1 className="hero">
          有些话，
          <br />
          说出来就轻了
        </h1>
        <button className="new-chat-btn" onClick={newChat}>
          ＋ 新建对话
        </button>
        {chats.map((c) => (
          <div key={c.id} className="chat-item">
            <button className="chat-item-main" onClick={() => setActiveId(c.id)}>
              <span className="chat-item-name">{c.name}</span>
              <span className="chat-item-preview">
                {c.messages.length ? c.messages[c.messages.length - 1].content.slice(0, 30) : '还没聊过，点开说点什么吧'}
              </span>
            </button>
            <div className="chat-item-ops">
              <button className="icon-btn" onClick={() => renameChat(c.id)} title="重命名">
                ✏️
              </button>
              <button className="icon-btn" onClick={() => deleteChat(c.id)} title="删除">
                🗑
              </button>
            </div>
          </div>
        ))}

        {showSettings && (
          <div className="modal-mask" onClick={() => setShowSettings(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>设置</h2>
              <p className="modal-tip">
                填入 Anthropic API Key 后，对话由 Claude 驱动。Key 只保存在你自己的浏览器里。留空则使用内置的简单陪伴回复。
              </p>
              <input
                className="line-input"
                type="password"
                value={keyDraft}
                placeholder="sk-ant-..."
                onChange={(e) => setKeyDraft(e.target.value)}
              />
              <div className="modal-ops">
                <button
                  className="save-btn small"
                  onClick={() => {
                    setApiKey(keyDraft.trim())
                    setShowSettings(false)
                  }}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // 对话视图
  return (
    <div className="page chat-view">
      <header className="chat-head">
        <button className="icon-btn" onClick={() => setActiveId(null)}>
          ←
        </button>
        <h1 className="chat-title" onClick={() => renameChat(active.id)} title="点击重命名">
          {active.name}
        </h1>
        <button className="icon-btn" onClick={() => deleteChat(active.id)} title="删除">
          🗑
        </button>
      </header>

      <div className="messages">
        {active.messages.length === 0 && !streaming && (
          <div className="chat-empty">我在这儿。<br />今天过得怎么样？</div>
        )}
        {active.messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.content}
          </div>
        ))}
        {streaming && <div className="bubble assistant">{streaming}</div>}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-bar">
        <textarea
          className="chat-input"
          value={input}
          rows={1}
          placeholder="说点什么…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
        />
        <button className="send-btn" disabled={busy || !input.trim()} onClick={send}>
          {busy ? '…' : '发送'}
        </button>
      </div>
    </div>
  )
}
