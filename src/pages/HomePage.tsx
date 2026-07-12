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
      showToast('拍一张，或写一句，再挂上去吧')
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
      <div className="sun" aria-hidden />
      <header className="page-head">
        <div className="eyebrow">
          {today.getMonth() + 1}月{today.getDate()}日 星期{WEEKDAYS[today.getDay()]}
        </div>
        <h1>
          {greeting(today.getHours())}，
          <br />
          把这一刻挂上时光藤
        </h1>
      </header>

      {/* 拍照区：先拍照 */}
      {photo ? (
        <div className="shot-preview">
          <img src={photo} alt="此刻" />
          <button className="photo-remove" onClick={() => setPhoto(undefined)}>
            ✕
          </button>
        </div>
      ) : (
        <button className="shot-card" onClick={() => cameraRef.current?.click()}>
          <span className="shot-icon">
            <CameraIcon />
          </span>
          <span className="shot-title">拍下此刻</span>
          <span className="shot-sub">好的、坏的，都值得留下</span>
        </button>
      )}
      {!photo && (
        <button className="album-link" onClick={() => uploadRef.current?.click()}>
          或从相册选择一张
        </button>
      )}

      {/* 配文：经历 / 感悟 / 想法 */}
      <div className="write-card">
        <textarea
          className="capture-text"
          value={content}
          rows={4}
          maxLength={500}
          placeholder="配上一段经历、感悟，或随便什么想法…"
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="cat-row">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              className={`cat-chip ${category === c.key ? 'active' : ''}`}
              style={category === c.key ? { background: c.color, borderColor: c.color } : {}}
              onClick={() => setCategory(c.key)}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
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
      <p className="footnote">发布后会自动挂到「时光藤」上</p>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7.5 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-3.5Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  )
}
