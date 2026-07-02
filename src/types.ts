// 情绪类别：好的、坏的、领悟到的、平静的
export type Mood = 'good' | 'bad' | 'insight' | 'calm'

export const MOODS: { key: Mood; label: string; emoji: string; color: string }[] = [
  { key: 'good', label: '明媚', emoji: '🌞', color: '#e8a33d' },
  { key: 'bad', label: '阴霾', emoji: '🌧', color: '#7d8ba1' },
  { key: 'insight', label: '顿悟', emoji: '💡', color: '#5f9e6e' },
  { key: 'calm', label: '平静', emoji: '🌊', color: '#6b8cae' },
]

export function moodOf(key: Mood) {
  return MOODS.find((m) => m.key === key) ?? MOODS[0]
}

// 一条记录：一行文字必填，正文和照片可选
export interface Entry {
  id: string
  createdAt: number
  mood: Mood
  line: string // 自定义的一行文字
  text?: string // 发生了什么 / 日记正文
  photo?: string // 压缩后的 base64 图片
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  ts: number
}

export interface ChatSession {
  id: string
  name: string
  createdAt: number
  messages: ChatMessage[]
}
