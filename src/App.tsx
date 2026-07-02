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
      <main className="main">
        {tab === 'home' && <HomePage onSave={(e) => setEntries([e, ...entries])} />}
        {tab === 'timeline' && (
          <TimelinePage entries={entries} onDelete={(id) => setEntries(entries.filter((e) => e.id !== id))} />
        )}
        {tab === 'chat' && (
          <ChatPage chats={chats} setChats={setChats} entries={entries} apiKey={apiKey} setApiKey={setApiKey} />
        )}
      </main>

      <nav className="tabbar">
        <button className={tab === 'home' ? 'active' : ''} onClick={() => setTab('home')}>
          <span className="tab-icon">✎</span>记录
        </button>
        <button className={tab === 'timeline' ? 'active' : ''} onClick={() => setTab('timeline')}>
          <span className="tab-icon">⧗</span>时光
        </button>
        <button className={tab === 'chat' ? 'active' : ''} onClick={() => setTab('chat')}>
          <span className="tab-icon">✉</span>絮语
        </button>
      </nav>
    </div>
  )
}
