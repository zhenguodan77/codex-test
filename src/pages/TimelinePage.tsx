import { useState } from 'react'
import type { Entry } from '../types'
import { categoryOf } from '../types'

interface Props {
  entries: Entry[]
  onDelete: (id: string) => void
  onEcho: (id: string, text: string) => void
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

// 记录越多，藤长得越高
function stage(n: number) {
  if (n >= 30) return '🌳'
  if (n >= 10) return '🌿'
  if (n >= 3) return '🌱'
  return '✨'
}

export default function TimelinePage({ entries, onDelete, onEcho }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [echoFor, setEchoFor] = useState<string | null>(null)
  const [echoDraft, setEchoDraft] = useState('')

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

  function saveEcho(id: string) {
    const t = echoDraft.trim()
    if (!t) return
    onEcho(id, t)
    setEchoDraft('')
    setEchoFor(null)
  }

  return (
    <div className="page timeline">
      <header className="page-head">
        <div className="eyebrow">时光 {stage(entries.length)}</div>
        {first ? (
          <>
            <h1 className="stat">
              <em className="count">{entries.length}</em>
              <span className="unit">段时光</span>
            </h1>
            <p className="lede">自 {fmtDate(first)}起，一直在生长。</p>
          </>
        ) : (
          <>
            <h1>
              还空着，
              <br />
              去挂上第一段时光吧
            </h1>
            <p className="lede empty-hint">回到「记录」，从今天开始。</p>
          </>
        )}
      </header>

      <div className="vine">
        {groups.map((g) => (
          <section key={g.date} className="day-group">
            <div className="day-sign">{g.date}</div>
            {g.items.map((e) => {
              const c = categoryOf(e.category)
              const echoes = e.echoes ?? []
              return (
                <article key={e.id} className="entry">
                  <span className="fruit" style={{ background: c.color }} />
                  <div className="tag-card">
                    <div className="entry-top">
                      <span className="entry-tag" style={{ color: c.color }}>
                        {c.emoji} {c.label}
                      </span>
                      <span className="entry-time">{fmtTime(e.createdAt)}</span>
                    </div>
                    {e.photo && <img className="entry-photo" src={e.photo} alt="" loading="lazy" />}
                    <p className="entry-line">{e.line}</p>
                    {e.text && <p className="entry-text">{e.text}</p>}

                    {/* 追记：在原记录上的二次感悟 */}
                    {echoes.length > 0 && (
                      <div className="echoes">
                        {echoes.map((ec, i) => (
                          <div key={i} className="echo" style={{ borderColor: `${c.color}55` }}>
                            <div className="echo-meta">追记 · {fmtShort(ec.ts)} {fmtTime(ec.ts)}</div>
                            <p className="echo-text">{ec.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {echoFor === e.id ? (
                      <div className="echo-composer">
                        <textarea
                          className="echo-input"
                          value={echoDraft}
                          rows={3}
                          maxLength={300}
                          placeholder="今天再看这条记录，有什么新的想法？"
                          onChange={(ev) => setEchoDraft(ev.target.value)}
                          autoFocus
                        />
                        <div className="echo-ops">
                          <button className="echo-save" onClick={() => saveEcho(e.id)}>
                            保存追记
                          </button>
                          <button
                            className="echo-cancel"
                            onClick={() => {
                              setEchoFor(null)
                              setEchoDraft('')
                            }}
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="entry-actions">
                        <button
                          className="echo-btn"
                          onClick={() => {
                            setEchoFor(e.id)
                            setEchoDraft('')
                          }}
                        >
                          ✎ 追记一笔
                        </button>
                        {confirmId === e.id ? (
                          <span className="del-group">
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
                          </span>
                        ) : (
                          <button className="entry-del" onClick={() => setConfirmId(e.id)}>
                            删除
                          </button>
                        )}
                      </div>
                    )}
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
