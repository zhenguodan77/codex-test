// 记录分类：美食、趣事、感悟、心情、日常
export type Category = 'food' | 'fun' | 'insight' | 'mood' | 'daily'

export const CATEGORIES: { key: Category; label: string; emoji: string; color: string }[] = [
  { key: 'food', label: '美食', emoji: '🍜', color: '#FF5C38' },
  { key: 'fun', label: '趣事', emoji: '✨', color: '#FFAA1E' },
  { key: 'insight', label: '感悟', emoji: '💡', color: '#57B26A' },
  { key: 'mood', label: '心情', emoji: '🌤', color: '#FF7BAC' },
  { key: 'daily', label: '日常', emoji: '☕', color: '#9C8B72' },
]

export function categoryOf(key: string | undefined) {
  return CATEGORIES.find((c) => c.key === key) ?? CATEGORIES[4]
}

// 追记：在原记录上做的二次感悟
export interface Echo {
  ts: number
  text: string
}

// 一条记录
export interface Entry {
  id: string
  createdAt: number
  category: Category
  line: string // 经历 / 感悟 / 想法
  text?: string // 旧版本的正文字段（兼容保留）
  photo?: string // 压缩后的 base64 图片
  echoes?: Echo[] // 追记列表
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
