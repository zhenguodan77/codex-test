import { useRef, useState } from 'react'
import type { Category, Entry } from '../types'
import { CATEGORIES } from '../types'
import { compressImage, uid } from '../storage'

interface Props {
  onSave: (entry: Entry) => void
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export default function HomePage({ onSave }: Props) {
  const [category, setCategory] = useState<Category>('daily')
  const [content, setContent] = useState('')
  const [photo, setPhoto] = useState<string | undefined>()
  const [toast, setToast] = useState('')
  const uploadRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  async function pickPhoto(file: File | undefined) {
    if (!file) return
    try {
      setPhoto(await compressImage(file))
    } catch {
      showToast('照片处理失败，换一张试试')
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }

  function publish() {
    if (!content.trim() && !photo) {
      showToast('拍一张，或写一句，再完成吧')
      return
    }
    onSave({
      id: uid(),
      createdAt: Date.now(),
      category,
      line: content.trim() || '此刻，无需多言',
      photo,
    })
    setContent('')
    setPhoto(undefined)
  }

  const today = new Date()

  return (
    <div className="page capture">
      {/* 刊头 */}
      <header className="masthead">
        <span className="masthead-mark">拾绪</span>
        <span className="masthead-date">
          {today.getMonth() + 1}月{today.getDate()}日 · 星期{WEEKDAYS[today.getDay()]}
        </span>
      </header>

      <h1 className="prompt">此刻。</h1>

      <textarea
        className="capture-text"
        value={content}
        rows={6}
        maxLength={500}
        placeholder="写下正在发生的、想留住的——一顿好饭、一件趣事、一点感悟…"
        onChange={(e) => setContent(e.target.value)}
      />

      {photo ? (
        <div className="shot-preview">
          <img src={photo} alt="此刻" />
          <button className="photo-remove" onClick={() => setPhoto(undefined)}>
            ✕
          </button>
        </div>
      ) : (
        <div className="photo-row">
          <button className="photo-btn" onClick={() => cameraRef.current?.click()}>
            ◉ 拍摄当下
          </button>
          <button className="photo-btn" onClick={() => uploadRef.current?.click()}>
            ▤ 从相册选
          </button>
        </div>
      )}

      <div className="cat-row">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`cat-chip ${category === c.key ? 'active' : ''}`}
            onClick={() => setCategory(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          pickPhoto(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      <input
        ref={uploadRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          pickPhoto(e.target.files?.[0])
          e.target.value = ''
        }}
      />

      <button className="save-btn" onClick={publish}>
        完 成
      </button>
      <p className="footnote">发布后收录进「时光」的今日刊</p>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
