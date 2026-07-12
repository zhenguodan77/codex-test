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
      showToast('写一句，或添一张照片')
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
      <header className="topbar">
        <span className="topbar-label">记录</span>
        <span className="topbar-meta">
          {today.getMonth() + 1}月{today.getDate()}日 星期{WEEKDAYS[today.getDay()]}
        </span>
      </header>

      <h1 className="page-title">{greeting(today.getHours())}</h1>
      <p className="page-desc">此刻正在发生的，都值得留下。</p>

      {/* 撰写卡：文字 + 照片合为一体 */}
      <div className="compose">
        <textarea
          className="compose-text"
          value={content}
          rows={5}
          maxLength={500}
          placeholder="写下正在发生的、想留住的…"
          onChange={(e) => setContent(e.target.value)}
        />

        {photo ? (
          <div className="compose-photo">
            <img src={photo} alt="此刻" />
            <button className="photo-remove" onClick={() => setPhoto(undefined)}>
              ✕
            </button>
          </div>
        ) : (
          <div className="compose-tools">
            <button className="tool" onClick={() => cameraRef.current?.click()}>
              <CameraIcon /> 拍摄
            </button>
            <button className="tool" onClick={() => uploadRef.current?.click()}>
              <ImageIcon /> 相册
            </button>
          </div>
        )}
      </div>

      {/* 分类 */}
      <div className="cat-row">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`cat-chip ${category === c.key ? 'active' : ''}`}
            style={category === c.key ? { borderColor: c.color, background: `${c.color}14` } : {}}
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
        完成
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

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="9" cy="9" r="1.8" />
      <path d="m21 15-4.5-4.5L7 20" />
    </svg>
  )
}
