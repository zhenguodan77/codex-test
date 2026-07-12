// 记录分类：美食、趣事、感悟、心情、日常
export type Category = 'food' | 'fun' | 'insight' | 'mood' | 'daily'

export const CATEGORIES: { key: Category; label: string; emoji: string; color: string }[] = [
  { key: 'food', label: '美食', emoji: '🍜', color: '#FF9F0A' },
  { key: 'fun', label: '趣事', emoji: '✨', color: '#BF5AF2' },
  { key: 'insight', label: '感悟', emoji: '💡', color: '#34C759' },
  { key: 'mood', label: '心情', emoji: '🌤', color: '#0A84FF' },
  { key: 'daily', label: '日常', emoji: '☕', color: '#A2845E' },
]

export function categoryOf(key: string | undefined) {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[4]
}

// 一条记录：一行文字必填，正文和照片可选
export interface Entry {
  id: string
  createdAt: number
  category: Category
  line: string // 一句话记下这一刻
  text?: string // 展开细说 / 日记正文
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
