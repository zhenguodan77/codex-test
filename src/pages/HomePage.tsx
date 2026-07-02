import { useRef, useState } from 'react'
import type { Entry, Mood } from '../types'
import { MOODS } from '../types'
import { compressImage, uid } from '../storage'

interface Props {
  onSave: (entry: Entry) => void
}

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
    showToast('已拾起这一缕情绪 ✦')
  }

  const today = new Date()

  return (
    <div className="page home">
      <header className="home-head">
        <div className="date">
          {today.getFullYear()}年{today.getMonth() + 1}月{today.getDate()}日
        </div>
        <h1>此刻的心情</h1>
        <p className="slogan">一生那么冗长，把好的、坏的、领悟到的，都记下来。</p>
      </header>

      <div className="mood-row">
        {MOODS.map((m) => (
          <button
            key={m.key}
            className={`mood-chip ${mood === m.key ? 'active' : ''}`}
            style={mood === m.key ? { background: m.color, borderColor: m.color } : {}}
            onClick={() => setMood(m.key)}
          >
            <span className="mood-emoji">{m.emoji}</span>
            {m.label}
          </button>
        ))}
      </div>

      <input
        className="line-input"
        value={line}
        maxLength={50}
        placeholder="用一行字，说说此刻…"
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
            📷 拍摄当下
          </button>
          <button className="photo-btn" onClick={() => uploadRef.current?.click()}>
            🖼 上传照片
          </button>
        </div>
      )}
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

      {showText ? (
        <textarea
          className="text-input"
          value={text}
          rows={6}
          placeholder="发生了什么？也可以当日记写，想写多少写多少…"
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />
      ) : (
        <button className="ghost-btn" onClick={() => setShowText(true)}>
          ＋ 写点发生的事 / 日记（可选）
        </button>
      )}

      <button className="save-btn" onClick={save}>
        拾起这一刻
      </button>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
