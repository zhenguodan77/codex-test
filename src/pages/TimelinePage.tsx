import { useState } from 'react'
import type { Entry } from '../types'
import { categoryOf } from '../types'

interface Props {
  entries: Entry[]
  onDelete: (id: string) => void
  onEcho: (id: string, text: string) => void
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function fmtShort(ts: number) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function fmtTime(ts: number) {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export default function TimelinePage({ entries, onDelete, onEcho }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [echoFor, setEchoFor] = useState<string | null>(null)
  const [echoDraft, setEchoDraft] = useState('')

  const sorted = [...entries].sort((a, b) => b.createdAt - a.createdAt)
  // 记录覆盖的天数
  const dayKeys = new Set(entries.map((e) => new Date(e.createdAt).toDateString()))

  // 按日期分组
  const groups: { key: string; ts: number; items: Entry[] }[] = []
  for (const e of sorted) {
    const key = fmtShort(e.createdAt)
    const g = groups[groups.length - 1]
    if (g && g.key === key) g.items.push(e)
    else groups.push({ key, ts: e.createdAt, items: [e] })
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
      <div className="glow" aria-hidden />
      <header className="topbar">
        <span className="topbar-label">时光</span>
        <span className="topbar-meta">共 {entries.length} 则</span>
      </header>

      {entries.length ? (
        <div className="hero-stat">
          <span className="stat-num">{dayKeys.size}</span>
          <span className="stat-unit">
            天里的
            <br />
            <b>{entries.length}</b> 个瞬间
          </span>
        </div>
      ) : (
        <>
          <h1 className="hero">还空着</h1>
          <p className="hero-sub">回到「记录」，留下第一个瞬间。</p>
        </>
      )}

      <div className="feed">
        {groups.map((g) => {
          const d = new Date(g.ts)
          return (
            <section key={g.key} className="day-block">
              <div className="day-head">
                <span className="day-key">{g.key}</span>
                <span className="day-sub">星期{WEEKDAYS[d.getDay()]} · {g.items.length} 则</span>
              </div>

              {g.items.map((e) => {
                const c = categoryOf(e.category)
                const echoes = e.echoes ?? []
                return (
                  <article key={e.id} className={`card ${e.photo ? 'has-photo' : ''}`}>
                    {e.photo && (
                      <div className="card-media">
                        <img src={e.photo} alt="" loading="lazy" />
                        <span className="media-tag" style={{ background: c.color }}>
                          {c.label}
                        </span>
                      </div>
                    )}
                    <div className="card-body">
                      {!e.photo && (
                        <div className="card-head">
                          <span className="chip" style={{ color: c.color, background: `${c.color}1f` }}>
                            {c.label}
                          </span>
                          <span className="card-time">{fmtTime(e.createdAt)}</span>
                        </div>
                      )}
                      <p className="card-line">{e.line}</p>
                      {e.text && <p className="card-text">{e.text}</p>}
                      {e.photo && <span className="card-time photo-time">{fmtTime(e.createdAt)}</span>}

                      {echoes.length > 0 && (
                        <div className="echoes">
                          {echoes.map((ec, i) => (
                            <div key={i} className="echo" style={{ borderColor: c.color }}>
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
                            ＋ 追记
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
          )
        })}
      </div>
    </div>
  )
}
