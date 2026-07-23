import { lazy, Suspense, useEffect, useState } from 'react'
import type { ChatSession, Entry } from './types'
import type { Prefs } from './storage'
import {
  loadApiKey,
  loadChats,
  loadEntries,
  loadLastNotified,
  loadPrefs,
  saveApiKey,
  saveChats,
  saveEntries,
  saveLastNotified,
  savePrefs,
} from './storage'
import { computeStreak, dayKey, MILESTONES } from './utils'
import HomePage from './pages/HomePage'
import TimelinePage from './pages/TimelinePage'
// 絮语页会引入体积较大的 Anthropic SDK，按需懒加载，避免拖慢记录/时光的首屏
const ChatPage = lazy(() => import('./pages/ChatPage'))

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

const REMIND_BODY = '今天还没记录哦，来写一句吧'

export default function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [entries, setEntries] = useState<Entry[]>(() => loadEntries())
  const [chats, setChats] = useState<ChatSession[]>(() => loadChats())
  const [apiKey, setApiKey] = useState<string>(() => loadApiKey())
  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs())
  const [notice, setNotice] = useState('')

  useEffect(() => {
    saveChats(chats)
  }, [chats])
  useEffect(() => saveApiKey(apiKey), [apiKey])
  useEffect(() => savePrefs(prefs), [prefs])

  function flash(msg: string, ms = 3000) {
    setNotice(msg)
    setTimeout(() => setNotice(''), ms)
  }

  // ————— 主题（跟随系统 / 浅色 / 深色） —————
  useEffect(() => {
    const root = document.documentElement
    if (prefs.theme === 'system') delete root.dataset.theme
    else root.dataset.theme = prefs.theme

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const applyMeta = () => {
      const dark = prefs.theme === 'dark' || (prefs.theme === 'system' && mq.matches)
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#1c1917' : '#f4f1ea')
    }
    applyMeta()
    mq.addEventListener('change', applyMeta)
    return () => mq.removeEventListener('change', applyMeta)
  }, [prefs.theme])

  // ————— 每日提醒 —————
  useEffect(() => {
    if (!prefs.reminderEnabled) return

    const tick = () => {
      const now = new Date()
      const hhmm = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      const today = dayKey(Date.now())
      if (hhmm < prefs.reminderTime) return
      if (loadLastNotified() === today) return
      if (entries.some((e) => dayKey(e.createdAt) === today)) return

      saveLastNotified(today)
      if (document.visibilityState === 'visible') {
        flash(`${REMIND_BODY} ✎`, 3600)
      } else if ('Notification' in window && Notification.permission === 'granted') {
        navigator.serviceWorker
          ?.getRegistration()
          .then((reg) => {
            if (reg) reg.showNotification('拾绪', { body: REMIND_BODY, icon: './icon.svg' })
            else new Notification('拾绪', { body: REMIND_BODY })
          })
          .catch(() => {
            try {
              new Notification('拾绪', { body: REMIND_BODY })
            } catch {
              /* ignore */
            }
          })
      }
    }

    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [prefs.reminderEnabled, prefs.reminderTime, entries])

  /** 先落盘再更新内存：写入失败时不改状态，草稿不丢，交由调用方提示 */
  function commitEntries(next: Entry[]): boolean {
    if (!saveEntries(next)) return false
    setEntries(next)
    return true
  }

  const streak = computeStreak(entries)

  return (
    <div className="app">
      <main className="main">
        {tab === 'home' && (
          <HomePage
            count={entries.length}
            streak={streak}
            onSave={(e) => {
              const firstToday = !entries.some((x) => dayKey(x.createdAt) === dayKey(e.createdAt))
              const next = [e, ...entries]
              const ok = commitEntries(next)
              if (ok) {
                setTab('timeline') // 发布后自动跳到时光页
                if (firstToday) {
                  const s = computeStreak(next)
                  if (MILESTONES.includes(s)) flash(`连续记录 ${s} 天了，为你高兴 ✦`)
                  else if (s >= 2) flash(`已连续记录 ${s} 天 ✦`)
                }
              }
              return ok
            }}
          />
        )}
        {tab === 'timeline' && (
          <TimelinePage
            entries={entries}
            onDelete={(id) => commitEntries(entries.filter((e) => e.id !== id))}
            onEdit={(id, line) =>
              commitEntries(entries.map((e) => (e.id === id ? { ...e, line } : e)))
            }
            onEcho={(id, text) =>
              commitEntries(
                entries.map((e) =>
                  e.id === id ? { ...e, echoes: [...(e.echoes ?? []), { ts: Date.now(), text }] } : e,
                ),
              )
            }
          />
        )}
        {tab === 'chat' && (
          <Suspense fallback={<div className="page-loading">载入中…</div>}>
            <ChatPage
              chats={chats}
              setChats={setChats}
              entries={entries}
              apiKey={apiKey}
              setApiKey={setApiKey}
              prefs={prefs}
              setPrefs={setPrefs}
              onImport={(data) => {
                const ok = commitEntries(data.entries)
                if (ok) setChats(data.chats)
                return ok
              }}
            />
          </Suspense>
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

      {notice && <div className="toast">{notice}</div>}
    </div>
  )
}
