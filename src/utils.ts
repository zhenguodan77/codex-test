import type { Entry } from './types'

export function dayKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

/**
 * 连续记录天数。
 * 今天有记录则从今天起算；今天还没写不打断——从昨天往前数。
 */
export function computeStreak(entries: Entry[]): number {
  if (!entries.length) return 0
  const days = new Set(entries.map((e) => dayKey(e.createdAt)))
  const DAY = 86_400_000
  let t = Date.now()
  if (!days.has(dayKey(t))) t -= DAY
  let n = 0
  while (days.has(dayKey(t))) {
    n++
    t -= DAY
  }
  return n
}

/** 值得庆祝的里程碑天数 */
export const MILESTONES = [3, 7, 14, 21, 30, 60, 100, 365]
