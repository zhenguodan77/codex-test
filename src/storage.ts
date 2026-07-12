import type { Entry, ChatSession } from './types'

const ENTRIES_KEY = 'shixu.entries'
const CHATS_KEY = 'shixu.chats'
const API_KEY_KEY = 'shixu.apiKey'

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function loadEntries(): Entry[] {
  const raw = load<(Entry & { mood?: string })[]>(ENTRIES_KEY, [])
  // 旧版本用 mood 字段（情绪），迁移到 category（生活分类）
  const moodMap: Record<string, Entry['category']> = {
    good: 'mood',
    bad: 'mood',
    insight: 'insight',
    calm: 'daily',
  }
  return raw.map((e) => {
    if (!e.category && e.mood) {
      const { mood, ...rest } = e
      return { ...rest, category: moodMap[mood] ?? 'daily' }
    }
    return e
  })
}

export function saveEntries(entries: Entry[]) {
  localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries))
}

export function loadChats(): ChatSession[] {
  return load<ChatSession[]>(CHATS_KEY, [])
}

export function saveChats(chats: ChatSession[]) {
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats))
}

export function loadApiKey(): string {
  return localStorage.getItem(API_KEY_KEY) ?? ''
}

export function saveApiKey(key: string) {
  if (key) localStorage.setItem(API_KEY_KEY, key)
  else localStorage.removeItem(API_KEY_KEY)
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/** 把图片压缩成最长边 1280px 的 JPEG base64，控制 localStorage 占用 */
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      const MAX = 1280
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('canvas unavailable'))
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片读取失败'))
    }
    img.src = url
  })
}
