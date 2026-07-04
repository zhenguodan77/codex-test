import { useState } from 'react'
import type { Entry } from '../types'
import { moodOf } from '../types'

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
      <header className="timeline-head">
        <div className="eyebrow">时光</div>
        <h1 className="display">
          {first ? (
            <>
              自 {fmtDate(first)}，
              <br />
              已拾起 <em>{entries.length}</em> 缕情绪
            </>
          ) : (
            <>
              时间还空着，
              <br />
              等你拾起第一缕
            </>
          )}
        </h1>
      </header>

      {!first && <p className="empty-hint">回到「记录」，从此刻开始。</p>}

      <div className="rail">
        {groups.map((g) => (
          <section key={g.date} className="day-group">
            <div className="day-label">{g.date}</div>
            {g.items.map((e) => {
              const m = moodOf(e.mood)
              return (
                <article key={e.id} className="entry">
                  <span
                    className="entry-dot"
                    style={{ background: `radial-gradient(circle at 32% 28%, ${m.g1}, ${m.g2})` }}
                  />
                  <div className="entry-card">
                    <div className="entry-top">
                      <span className="entry-mood" style={{ color: m.color }}>
                        {m.label}
                      </span>
                      <span className="entry-time">{fmtTime(e.createdAt)}</span>
                    </div>
                    <p className="entry-line display">{e.line}</p>
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
                  </div>
                </article>
              )
            })}
          </section>
        ))}
      </div>
    </div>
  )
}
