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

/** 写入成功返回 true；空间不足等失败返回 false（不抛出，避免中断渲染） */
export function saveEntries(entries: Entry[]): boolean {
  try {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries))
    return true
  } catch {
    return false
  }
}

export function loadChats(): ChatSession[] {
  return load<ChatSession[]>(CHATS_KEY, [])
}

export function saveChats(chats: ChatSession[]): boolean {
  try {
    localStorage.setItem(CHATS_KEY, JSON.stringify(chats))
    return true
  } catch {
    return false
  }
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

// ————— 偏好设置（主题 / 每日提醒） —————
export type ThemePref = 'system' | 'light' | 'dark'

export interface Prefs {
  theme: ThemePref
  reminderEnabled: boolean
  reminderTime: string // "HH:MM"
}

const PREFS_KEY = 'shixu.prefs'
const NOTIFIED_KEY = 'shixu.lastNotified'

export function loadPrefs(): Prefs {
  return { theme: 'system', reminderEnabled: false, reminderTime: '21:00', ...load<Partial<Prefs>>(PREFS_KEY, {}) }
}

export function savePrefs(p: Prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p))
  } catch {
    /* 空间不足时忽略 */
  }
}

/** 记录「今天已提醒过」，避免重复打扰 */
export function loadLastNotified(): string {
  return localStorage.getItem(NOTIFIED_KEY) ?? ''
}

export function saveLastNotified(day: string) {
  try {
    localStorage.setItem(NOTIFIED_KEY, day)
  } catch {
    /* ignore */
  }
}

// ————— 备份：导出 / 导入 —————
export interface Backup {
  app: 'shixu'
  version: number
  exportedAt: number
  entries: Entry[]
  chats: ChatSession[]
}

export function buildBackup(entries: Entry[], chats: ChatSession[]): Backup {
  return { app: 'shixu', version: 1, exportedAt: Date.now(), entries, chats }
}

/** 解析并校验导入文件；结构不对返回 null */
export function parseBackup(text: string): Backup | null {
  try {
    const data = JSON.parse(text)
    if (data?.app !== 'shixu' || !Array.isArray(data.entries)) return null
    const entries: Entry[] = data.entries.filter(
      (e: unknown): e is Entry =>
        !!e && typeof (e as Entry).id === 'string' && typeof (e as Entry).createdAt === 'number',
    )
    const chats: ChatSession[] = Array.isArray(data.chats)
      ? data.chats.filter(
          (c: unknown): c is ChatSession =>
            !!c && typeof (c as ChatSession).id === 'string' && Array.isArray((c as ChatSession).messages),
        )
      : []
    return { app: 'shixu', version: 1, exportedAt: data.exportedAt ?? Date.now(), entries, chats }
  } catch {
    return null
  }
}

/** 触发浏览器下载一个 Blob */
export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** 触发浏览器下载一段文本 */
export function downloadText(filename: string, text: string) {
  downloadBlob(filename, new Blob([text], { type: 'application/json' }))
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
