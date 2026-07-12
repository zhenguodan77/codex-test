import { useEffect, useState } from 'react'
import type { ChatSession, Entry } from './types'
import {
  loadApiKey,
  loadChats,
  loadEntries,
  saveApiKey,
  saveChats,
  saveEntries,
} from './storage'
import HomePage from './pages/HomePage'
import TimelinePage from './pages/TimelinePage'
import ChatPage from './pages/ChatPage'

type Tab = 'home' | 'timeline' | 'chat'

const ICONS: Record<Tab, JSX.Element> = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  ),
  timeline: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-2.9-.4-4.1-1L3 20l1-5.4a8.5 8.5 0 1 1 17-3.1Z" />
    </svg>
  ),
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'home', label: '记录' },
  { key: 'timeline', label: '时光' },
  { key: 'chat', label: '絮语' },
]

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [entries, setEntries] = useState<Entry[]>(() => loadEntries())
  const [chats, setChats] = useState<ChatSession[]>(() => loadChats())
  const [apiKey, setApiKey] = useState<string>(() => loadApiKey())

  useEffect(() => saveEntries(entries), [entries])
  useEffect(() => saveChats(chats), [chats])
  useEffect(() => saveApiKey(apiKey), [apiKey])

  return (
    <div className="app">
      {/* 毛玻璃底下的彩色光斑壁纸 */}
      <div className="bg-canvas" aria-hidden>
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
        <span className="blob b4" />
      </div>
      <main className="main">
        {tab === 'home' && (
          <HomePage
            count={entries.length}
            onSave={(e) => {
              setEntries([e, ...entries])
              setTab('timeline') // 发布后自动跳到时光页
            }}
          />
        )}
        {tab === 'timeline' && (
          <TimelinePage
            entries={entries}
            onDelete={(id) => setEntries(entries.filter((e) => e.id !== id))}
            onEcho={(id, text) =>
              setEntries(
                entries.map((e) =>
                  e.id === id ? { ...e, echoes: [...(e.echoes ?? []), { ts: Date.now(), text }] } : e,
                ),
              )
            }
          />
        )}
        {tab === 'chat' && (
          <ChatPage chats={chats} setChats={setChats} entries={entries} apiKey={apiKey} setApiKey={setApiKey} />
        )}
      </main>

      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab ${tab === t.key ? 'active' : ''}`}
            aria-label={t.label}
            onClick={() => setTab(t.key)}
          >
            <span className="tab-icon">{ICONS[t.key]}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
