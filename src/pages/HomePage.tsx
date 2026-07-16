import { useRef, useState } from 'react'
import type { Entry } from '../types'
import { compressImage, uid } from '../storage'

interface Props {
  count: number
  streak: number
  onSave: (entry: Entry) => boolean
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export default function HomePage({ count, streak, onSave }: Props) {
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
    const ok = onSave({
      id: uid(),
      createdAt: Date.now(),
      line: content.trim() || '此刻，无需多言',
      photo,
    })
    if (!ok) {
      showToast('存储空间已满，删掉些旧照片再试')
      return
    }
    setContent('')
    setPhoto(undefined)
  }

  const today = new Date()

  return (
    <div className="page capture">
      {/* 居中主体 */}
      <div className="capture-hero">
        <div className="halo" aria-hidden />
        <div className="hero-eyebrow">
          拾绪 · {today.getMonth() + 1}月{today.getDate()}日 星期{WEEKDAYS[today.getDay()]}
        </div>
        <h1 className="big-title">记录</h1>
        <p className="big-desc">写下此刻，一句话就好</p>
        <input
          className="hero-input"
          value={content}
          maxLength={60}
          placeholder="此刻正在发生的…"
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') publish()
          }}
        />
        <div className="hero-count">
          {count === 0
            ? '从这里，记下第一件小事'
            : streak >= 2
              ? `已连续记录 ${streak} 天 · 共 ${count} 个瞬间`
              : `至今已留下 ${count} 个瞬间`}
        </div>
      </div>

      {/* 底部：拍摄 / 相册 + 完成 */}
      <div className="capture-foot">
        {photo ? (
          <div className="foot-photo">
            <img src={photo} alt="此刻" />
            <button className="photo-remove" onClick={() => setPhoto(undefined)}>
              ✕
            </button>
          </div>
        ) : (
          <div className="foot-tools">
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

        <button className="save-btn" onClick={publish}>
          完成
        </button>
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
