import { useState } from 'react'
import type { Entry } from '../types'
import { categoryOf } from '../types'

interface Props {
  entries: Entry[]
  onDelete: (id: string) => void
}

function fmtDate(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

function fmtShort(ts: number) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function fmtTime(ts: number) {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export default function TimelinePage({ entries, onDelete }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const sorted = [...entries].sort((a, b) => b.createdAt - a.createdAt)
  const first = entries.length ? Math.min(...entries.map((e) => e.createdAt)) : null

  // 按日期分组
  const groups: { date: string; items: Entry[] }[] = []
  for (const e of sorted) {
    const date = fmtShort(e.createdAt)
    const g = groups[groups.length - 1]
    if (g && g.date === date) g.items.push(e)
    else groups.push({ date, items: [e] })
  }

  return (
    <div className="page timeline">
      <header className="page-head">
        <div className="eyebrow">时光</div>
        <h1>
          {first ? (
            <>
              自 {fmtDate(first)}起，
              <br />
              已记下 <em className="count">{entries.length}</em> 个瞬间
            </>
          ) : (
            <>
              时间还空着，
              <br />
              等你记下第一个瞬间
            </>
          )}
        </h1>
      </header>

      {!first && <p className="empty-hint">回到「记录」，从今天开始。</p>}

      {groups.map((g) => (
        <section key={g.date} className="day-group">
          <div className="day-label">{g.date}</div>
          {g.items.map((e) => {
            const c = categoryOf(e.category)
            return (
              <article key={e.id} className="glass entry-card">
                <div className="entry-top">
                  <span className="entry-tag" style={{ background: `${c.color}1c`, color: c.color }}>
                    {c.emoji} {c.label}
                  </span>
                  <span className="entry-time">{fmtTime(e.createdAt)}</span>
                </div>
                <p className="entry-line">{e.line}</p>
                {e.photo && <img className="entry-photo" src={e.photo} alt="" loading="lazy" />}
                {e.text && <p className="entry-text">{e.text}</p>}
                <div className="entry-actions">
                  {confirmId === e.id ? (
                    <>
                      <button
                        className="entry-del confirm"
                        onClick={() => {
                          onDelete(e.id)
                          setConfirmId(null)
                        }}
                      >
                        确认删除
                      </button>
                      <button className="entry-del" onClick={() => setConfirmId(null)}>
                        取消
                      </button>
                    </>
                  ) : (
                    <button className="entry-del" onClick={() => setConfirmId(e.id)}>
                      删除
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </section>
      ))}
    </div>
  )
}
