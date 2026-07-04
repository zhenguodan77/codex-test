import { useRef, useState } from 'react'
import type { Entry, Mood } from '../types'
import { MOODS, moodOf } from '../types'
import { compressImage, uid } from '../storage'

interface Props {
  onSave: (entry: Entry) => void
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export default function HomePage({ onSave }: Props) {
  const [mood, setMood] = useState<Mood>('good')
  const [line, setLine] = useState('')
  const [text, setText] = useState('')
  const [photo, setPhoto] = useState<string | undefined>()
  const [showText, setShowText] = useState(false)
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

  function save() {
    if (!line.trim() && !text.trim() && !photo) {
      showToast('留下一点什么再拾起吧')
      return
    }
    onSave({
      id: uid(),
      createdAt: Date.now(),
      mood,
      line: line.trim() || '此刻，无需多言',
      text: text.trim() || undefined,
      photo,
    })
    setLine('')
    setText('')
    setPhoto(undefined)
    setShowText(false)
    showToast('已拾起这一缕情绪')
  }

  const today = new Date()
  const active = moodOf(mood)

  return (
    <div className="page home">
      {/* 随所选情绪变化的环境光 */}
      <div
        className="ambient"
        style={{ background: `radial-gradient(120% 70% at 50% -20%, ${active.g1}55 0%, ${active.g2}18 45%, transparent 75%)` }}
      />

      <header className="home-head">
        <div className="eyebrow">
          {today.getMonth() + 1}月{today.getDate()}日 · 星期{WEEKDAYS[today.getDay()]}
        </div>
        <h1 className="display">
          此刻，
          <br />
          心里是什么天气？
        </h1>
      </header>

      <div className="mood-row">
        {MOODS.map((m) => (
          <button
            key={m.key}
            className={`mood ${mood === m.key ? 'active' : ''}`}
            onClick={() => setMood(m.key)}
          >
            <span
              className="orb"
              style={{ background: `radial-gradient(circle at 32% 28%, ${m.g1}, ${m.g2})`, boxShadow: mood === m.key ? `0 6px 18px ${m.g2}66` : 'none' }}
            />
            <span className="mood-name">{m.label}</span>
          </button>
        ))}
      </div>

      <div className="sheet">
        <input
          className="line-input"
          value={line}
          maxLength={50}
          placeholder="用一行字，说说此刻"
          onChange={(e) => setLine(e.target.value)}
        />

        {photo ? (
          <div className="photo-preview">
            <img src={photo} alt="此刻" />
            <button className="photo-remove" onClick={() => setPhoto(undefined)}>
              ✕
            </button>
          </div>
        ) : (
          <div className="photo-row">
            <button className="photo-btn" onClick={() => cameraRef.current?.click()}>
              <CameraIcon /> 拍摄当下
            </button>
            <button className="photo-btn" onClick={() => uploadRef.current?.click()}>
              <ImageIcon /> 上传照片
            </button>
          </div>
        )}

        {showText ? (
          <textarea
            className="text-input"
            value={text}
            rows={5}
            placeholder="发生了什么？也可以当日记写，想写多少写多少"
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
        ) : (
          <button className="ghost-btn" onClick={() => setShowText(true)}>
            ＋ 写点发生的事，或今天的日记
          </button>
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

      <button className="save-btn" onClick={save}>
        拾起这一刻
      </button>
      <p className="footnote">一生那么冗长，值得被记下的远比想象的多。</p>

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
