// 情绪类别：好的、坏的、领悟到的、平静的
export type Mood = 'good' | 'bad' | 'insight' | 'calm'

// 每种情绪一组渐变色（g1 → g2），用于渐变色球与环境光
export const MOODS: { key: Mood; label: string; color: string; g1: string; g2: string }[] = [
  { key: 'good', label: '明媚', color: '#D98E32', g1: '#F5CE84', g2: '#E09256' },
  { key: 'bad', label: '阴霾', color: '#6B7A93', g1: '#AEB8C9', g2: '#5C6B84' },
  { key: 'insight', label: '顿悟', color: '#57795F', g1: '#A5C4A1', g2: '#4E7A5A' },
  { key: 'calm', label: '平静', color: '#5D82A8', g1: '#A9C6E2', g2: '#5D82A8' },
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
