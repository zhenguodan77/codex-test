import { useRef, useState } from 'react'
import type { Category, Entry } from '../types'
import { CATEGORIES } from '../types'
import { compressImage, uid } from '../storage'

interface Props {
  onSave: (entry: Entry) => void
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function greeting(h: number) {
  if (h < 5) return '夜深了'
  if (h < 11) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
}

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
      <div className="glow" aria-hidden />
      <header className="topbar">
        <span className="topbar-label">记录</span>
        <span className="topbar-meta">
          {today.getMonth() + 1}月{today.getDate()}日 星期{WEEKDAYS[today.getDay()]}
        </span>
      </header>

      <h1 className="hero">{greeting(today.getHours())}</h1>
      <p className="hero-sub">此刻正在发生的，都值得留下。</p>

      {photo ? (
        <div className="shot-preview">
          <img src={photo} alt="此刻" />
          <button className="photo-remove" onClick={() => setPhoto(undefined)}>
            ✕
          </button>
        </div>
      ) : (
        <button className="shot-zone" onClick={() => cameraRef.current?.click()}>
          <span className="shot-ring">
            <CameraIcon />
          </span>
          <span className="shot-copy">
            <span className="shot-title">拍下此刻</span>
            <span className="shot-sub">轻触打开相机</span>
          </span>
          <span className="shot-arrow">↗</span>
        </button>
      )}
      {!photo && (
        <button className="album-link" onClick={() => uploadRef.current?.click()}>
          从相册选择
        </button>
      )}

      <div className="write-card">
        <textarea
          className="capture-text"
          value={content}
          rows={4}
          maxLength={500}
          placeholder="配上一段经历、感悟，或随便什么想法…"
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      <div className="cat-row">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`cat-chip ${category === c.key ? 'active' : ''}`}
            style={
              category === c.key ? { borderColor: c.color, color: c.color, background: `${c.color}1a` } : {}
            }
            onClick={() => setCategory(c.key)}
          >
            <span className="cat-dot" style={{ background: c.color }} />
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
        完成 <span className="save-arrow">→</span>
      </button>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7.5 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-3.5Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  )
}
