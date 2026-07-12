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
  const first = entries.length ? Math.min(...entries.map((e) => e.createdAt)) : null

  // 按日期分组，每组是一期「日刊」
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
      {/* 刊头 */}
      <header className="masthead">
        <span className="masthead-mark">拾绪 · 时光</span>
        <span className="masthead-date">
          {first ? `自${fmtShort(first)}起 · 共 ${entries.length} 段` : '创刊号 · 待写入'}
        </span>
      </header>

      {!first && (
        <div className="blank-issue">
          <h1 className="prompt">
            第一期，
            <br />
            等你来写。
          </h1>
          <p className="empty-hint">回到「记录」，写下第一段时光。</p>
        </div>
      )}

      {groups.map((g) => {
        const d = new Date(g.ts)
        return (
          <section key={g.key} className="issue">
            {/* 头版日期 */}
            <div className="issue-date">
              <span className="issue-num">{d.getDate()}</span>
              <span className="issue-side">
                {d.getMonth() + 1}月 · 星期{WEEKDAYS[d.getDay()]}
              </span>
              <span className="issue-count">{g.items.length} 则</span>
            </div>

            <div className="issue-body">
              {g.items.map((e) => {
                const c = categoryOf(e.category)
                const echoes = e.echoes ?? []
                return (
                  <article key={e.id} className="piece">
                    {e.photo && <img className="piece-photo" src={e.photo} alt="" loading="lazy" />}
                    <div className="piece-head">
                      <span className="piece-cat">{c.label}</span>
                      <span className="piece-time">{fmtTime(e.createdAt)}</span>
                    </div>
                    <p className="piece-line">{e.line}</p>
                    {e.text && <p className="piece-text">{e.text}</p>}

                    {echoes.length > 0 && (
                      <div className="echoes">
                        {echoes.map((ec, i) => (
                          <div key={i} className="echo">
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
                          ✎ 追记
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
                  </article>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
