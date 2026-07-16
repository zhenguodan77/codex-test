import { useState } from 'react'
import type { Entry } from '../types'
import { downloadBlob } from '../storage'
import { exportTimelineImage } from '../exportImage'

interface Props {
  entries: Entry[]
  onDelete: (id: string) => void
  onEdit: (id: string, line: string) => void
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

export default function TimelinePage({ entries, onDelete, onEdit, onEcho }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [echoFor, setEchoFor] = useState<string | null>(null)
  const [echoDraft, setEchoDraft] = useState('')
  const [editFor, setEditFor] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [viewPhoto, setViewPhoto] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [note, setNote] = useState('')
  const [exporting, setExporting] = useState(false)

  function flash(msg: string) {
    setNote(msg)
    setTimeout(() => setNote(''), 2600)
  }

  function saveEdit(id: string) {
    const t = editDraft.trim()
    if (t) onEdit(id, t)
    setEditFor(null)
    setEditDraft('')
  }

  function saveEcho(id: string) {
    const t = echoDraft.trim()
    if (!t) return
    onEcho(id, t)
    setEchoDraft('')
    setEchoFor(null)
  }

  const q = query.trim().toLowerCase()
  const matched = q
    ? entries.filter(
        (e) =>
          e.line.toLowerCase().includes(q) ||
          !!e.text?.toLowerCase().includes(q) ||
          !!e.echoes?.some((ec) => ec.text.toLowerCase().includes(q)),
      )
    : entries

  const sorted = [...matched].sort((a, b) => b.createdAt - a.createdAt)

  // 按日期分组
  const groups: { key: string; ts: number; items: Entry[] }[] = []
  for (const e of sorted) {
    const key = fmtShort(e.createdAt)
    const g = groups[groups.length - 1]
    if (g && g.key === key) g.items.push(e)
    else groups.push({ key, ts: e.createdAt, items: [e] })
  }

  async function doExport() {
    if (exporting) return
    if (!matched.length) {
      flash('没有可导出的记录')
      return
    }
    setExporting(true)
    flash('正在生成长图…')
    try {
      const { blob, truncated } = await exportTimelineImage(matched)
      const d = new Date()
      const stamp = `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}${d
        .getDate()
        .toString()
        .padStart(2, '0')}`
      downloadBlob(`拾绪时光-${stamp}.png`, blob)
      flash(truncated ? '已导出长图（最近 40 条）' : '已导出长图 ✓')
    } catch {
      flash('导出失败，再试一次')
    } finally {
      setExporting(false)
    }
  }

  // 插入月份分隔
  type Row = { kind: 'month'; label: string } | { kind: 'day'; group: (typeof groups)[number] }
  const rows: Row[] = []
  let prevMonth = ''
  for (const g of groups) {
    const d = new Date(g.ts)
    const m = `${d.getFullYear()}年${d.getMonth() + 1}月`
    if (m !== prevMonth) {
      rows.push({ kind: 'month', label: m })
      prevMonth = m
    }
    rows.push({ kind: 'day', group: g })
  }

  return (
    <div className="page timeline">
      <header className="topbar">
        <span className="topbar-label">时光</span>
        <span className="topbar-meta">共 {entries.length} 则</span>
      </header>

      {entries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-mark">
            <ClockIcon />
          </div>
          <h1 className="page-title">时光还空着</h1>
          <p className="page-desc">回到「记录」，写下第一件想留住的小事吧。</p>
        </div>
      ) : (
        <>
          <h1 className="page-title">此刻之前</h1>
          <p className="page-desc">你留下的每一个瞬间，都在这里。</p>

          <div className="list-tools">
            <div className="search">
              <SearchIcon />
              <input
                className="search-input"
                value={query}
                placeholder="搜索记录…"
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button className="search-clear" onClick={() => setQuery('')} aria-label="清除搜索">
                  ✕
                </button>
              )}
            </div>
            <button className="export-btn" onClick={doExport} disabled={exporting} aria-label="导出长图" title="导出长图">
              <DownloadIcon />
            </button>
          </div>

          {q && (
            <p className="result-count">
              {matched.length ? `找到 ${matched.length} 条相关记录` : `没有找到「${query.trim()}」相关的记录`}
            </p>
          )}

          <div className="feed">
            {rows.map((row) =>
              row.kind === 'month' ? (
                <div key={'m' + row.label} className="month-sep">
                  {row.label}
                </div>
              ) : (
                <section key={row.group.ts} className="day-block">
                  <div className="day-head">
                    <span className="day-key">{row.group.key}</span>
                    <span className="day-sub">星期{WEEKDAYS[new Date(row.group.ts).getDay()]}</span>
                  </div>

                  {row.group.items.map((e) => {
                    const echoes = e.echoes ?? []
                    return (
                      <article key={e.id} className="card">
                        <div className="card-head">
                          <span className="card-time">
                            <span className="time-dot" />
                            {fmtTime(e.createdAt)}
                          </span>
                        </div>

                        {e.photo && (
                          <button className="card-photo" onClick={() => setViewPhoto(e.photo!)} aria-label="查看大图">
                            <img src={e.photo} alt="" loading="lazy" />
                          </button>
                        )}

                        <p className="card-line">{e.line}</p>
                        {e.text && <p className="card-text">{e.text}</p>}

                        {echoes.length > 0 && (
                          <div className="echoes">
                            {echoes.map((ec, i) => (
                              <div key={i} className="echo">
                                <span className="echo-dot" />
                                <div>
                                  <div className="echo-meta">追记 · {fmtShort(ec.ts)} {fmtTime(ec.ts)}</div>
                                  <p className="echo-text">{ec.text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {editFor === e.id ? (
                          <div className="echo-composer">
                            <textarea
                              className="echo-input"
                              value={editDraft}
                              rows={2}
                              maxLength={60}
                              placeholder="改写这句记录…"
                              onChange={(ev) => setEditDraft(ev.target.value)}
                              autoFocus
                            />
                            <div className="echo-ops">
                              <button className="echo-save" onClick={() => saveEdit(e.id)}>
                                保存
                              </button>
                              <button
                                className="echo-cancel"
                                onClick={() => {
                                  setEditFor(null)
                                  setEditDraft('')
                                }}
                              >
                                取消
                              </button>
                            </div>
                          </div>
                        ) : echoFor === e.id ? (
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
                                保存
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
                            <div className="act-left">
                              <button
                                className="echo-btn"
                                onClick={() => {
                                  setEditFor(e.id)
                                  setEditDraft(e.line)
                                }}
                              >
                                ✎ 编辑
                              </button>
                              <button
                                className="echo-btn"
                                onClick={() => {
                                  setEchoFor(e.id)
                                  setEchoDraft('')
                                }}
                              >
                                ＋ 追记
                              </button>
                            </div>
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
                </section>
              ),
            )}
          </div>
        </>
      )}

      {viewPhoto && (
        <div className="lightbox" onClick={() => setViewPhoto(null)}>
          <img src={viewPhoto} alt="" />
        </div>
      )}

      {note && <div className="toast">{note}</div>}
    </div>
  )
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v11" />
      <path d="m7 10 5 5 5-5" />
      <path d="M4 19.5h16" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}
