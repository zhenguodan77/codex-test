import { useRef, useState } from 'react'
import type { Entry } from '../types'
import { compressImage, uid } from '../storage'

interface Props {
  onSave: (entry: Entry) => void
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export default function HomePage({ onSave }: Props) {
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
        <span className="topbar-label">拾绪</span>
        <span className="topbar-meta">
          {today.getMonth() + 1}月{today.getDate()}日 星期{WEEKDAYS[today.getDay()]}
        </span>
      </header>

      <h1 className="page-title">记录</h1>
      <p className="page-desc">此刻正在发生的，都值得留下。</p>

      <div className="compose">
        <input
          className="compose-line"
          value={content}
          maxLength={60}
          placeholder="写下此刻，一句话就好…"
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') publish()
          }}
        />

        {photo ? (
          <div className="compose-photo">
            <img src={photo} alt="此刻" />
            <button className="photo-remove" onClick={() => setPhoto(undefined)}>
              ✕
            </button>
          </div>
        ) : (
          <div className="compose-actions">
            <button className="big-tool primary" onClick={() => cameraRef.current?.click()}>
              <span className="tool-badge">
                <CameraIcon />
              </span>
              <span className="tool-label">拍摄</span>
              <span className="tool-sub">打开相机</span>
            </button>
            <button className="big-tool" onClick={() => uploadRef.current?.click()}>
              <span className="tool-badge">
                <ImageIcon />
              </span>
              <span className="tool-label">相册</span>
              <span className="tool-sub">选一张</span>
            </button>
          </div>
        )}
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7.5 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-3.5Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="9" cy="9" r="1.8" />
      <path d="m21 15-4.5-4.5L7 20" />
    </svg>
  )
}
