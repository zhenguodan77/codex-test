import { useRef, useState } from 'react'
import type { Category, Entry } from '../types'
import { CATEGORIES } from '../types'
import { compressImage, uid } from '../storage'

interface Props {
  onSave: (entry: Entry) => void
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

const PLACEHOLDERS: Record<Category, string> = {
  food: '今天吃了个波龙 🦞',
  fun: '路上看到两只猫在打架',
  insight: '原来慢下来也是一种前进',
  mood: '今天心里是晴天',
  daily: '平平无奇但也值得记下的一天',
}

export default function HomePage({ onSave }: Props) {
  const [category, setCategory] = useState<Category>('food')
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
      showToast('留下一点什么再保存吧')
      return
    }
    onSave({
      id: uid(),
      createdAt: Date.now(),
      category,
      line: line.trim() || '此刻，无需多言',
      text: text.trim() || undefined,
      photo,
    })
    setLine('')
    setText('')
    setPhoto(undefined)
    setShowText(false)
    showToast('已记下这一刻 ✓')
  }

  const today = new Date()

  return (
    <div className="page home">
      <header className="page-head">
        <div className="eyebrow">
          {today.getMonth() + 1}月{today.getDate()}日 星期{WEEKDAYS[today.getDay()]}
        </div>
        <h1>今天，想记点什么？</h1>
      </header>

      <div className="cat-row">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`cat-chip ${category === c.key ? 'active' : ''}`}
            style={
              category === c.key
                ? { background: c.color, borderColor: 'transparent', boxShadow: `0 6px 20px ${c.color}59` }
                : {}
            }
            onClick={() => setCategory(c.key)}
          >
            <span className="cat-emoji">{c.emoji}</span>
            {c.label}
          </button>
        ))}
      </div>

      <div className="glass sheet">
        <input
          className="line-input"
          value={line}
          maxLength={60}
          placeholder={PLACEHOLDERS[category]}
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
              <ImageIcon /> 相册选取
            </button>
          </div>
        )}

        {showText ? (
          <textarea
            className="text-input"
            value={text}
            rows={5}
            placeholder="展开说说？发生了什么、和谁一起、什么感觉，都可以写"
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
        ) : (
          <button className="ghost-btn" onClick={() => setShowText(true)}>
            ＋ 展开细说，或写今天的日记
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
        记下这一刻
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
