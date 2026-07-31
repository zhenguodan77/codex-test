import type { Entry } from './types'

/**
 * 把时光记录渲染成一张可分享的长图（PNG）。
 * 纯 canvas 绘制，无第三方依赖；始终使用浅色暖砂配色，便于分享。
 */

const W = 720 // 逻辑宽度（css px）
const PAD = 44 // 页边距
const CPAD = 20 // 卡片内边距
const MAX_ENTRIES = 40 // 画布高度保护
const MAX_PHOTO_H = 340

const C = {
  bg: '#f4f1ea',
  card: '#fdfbf7',
  ink: '#37322c',
  ink2: '#7b746a',
  ink3: '#aca498',
  clay: '#c57c72',
  line: '#e8e2d6',
}

const SANS = '-apple-system, "PingFang SC", "HarmonyOS Sans SC", "Noto Sans SC", "Segoe UI", sans-serif'
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function fmtDay(ts: number) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}月${d.getDate()}日 星期${WEEKDAYS[d.getDay()]}`
}

function fmtTime(ts: number) {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** 逐字换行（中英文通用） */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = []
  for (const para of text.split('\n')) {
    let cur = ''
    for (const ch of para) {
      if (cur && ctx.measureText(cur + ch).width > maxW) {
        out.push(cur)
        cur = ch
      } else {
        cur += ch
      }
    }
    out.push(cur)
  }
  return out
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image load failed'))
    img.src = src
  })
}

export async function exportTimelineImage(entries: Entry[]): Promise<{ blob: Blob; truncated: boolean }> {
  const sorted = [...entries].sort((a, b) => b.createdAt - a.createdAt)
  const truncated = sorted.length > MAX_ENTRIES
  const list = sorted.slice(0, MAX_ENTRIES)

  // 预载照片
  const photos = new Map<string, HTMLImageElement>()
  await Promise.all(
    list
      .filter((e) => e.photo)
      .map(async (e) => {
        try {
          photos.set(e.id, await loadImage(e.photo!))
        } catch {
          /* 坏图跳过 */
        }
      }),
  )

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas unavailable')

  const contentW = W - PAD * 2
  const innerW = contentW - CPAD * 2

  /** 单遍布局器：draw=false 只量高度，draw=true 实际绘制 */
  function pass(g: CanvasRenderingContext2D, draw: boolean): number {
    let y = PAD

    // 页眉
    if (draw) {
      g.fillStyle = C.ink
      g.font = `700 26px ${SANS}`
      g.fillText('拾绪 · 时光', PAD, y + 24)
    }
    y += 40
    const range =
      list.length > 1
        ? `${fmtDay(list[list.length - 1].createdAt)} — ${fmtDay(list[0].createdAt)} · ${list.length} 则`
        : `${fmtDay(list[0].createdAt)} · 1 则`
    if (draw) {
      g.fillStyle = C.ink2
      g.font = `400 13px ${SANS}`
      g.fillText(range, PAD, y + 12)
    }
    y += 34

    let prevDay = ''
    for (const e of list) {
      const day = fmtDay(e.createdAt)
      if (day !== prevDay) {
        prevDay = day
        y += 8
        if (draw) {
          g.fillStyle = C.ink
          g.font = `700 15px ${SANS}`
          g.fillText(day, PAD, y + 14)
        }
        y += 32
      }

      // —— 计算卡片内容 ——
      g.font = `500 17px ${SANS}`
      const lineRows = wrap(g, e.line, innerW)
      g.font = `400 14px ${SANS}`
      const textRows = e.text ? wrap(g, e.text, innerW) : []

      const img = photos.get(e.id)
      let photoH = 0
      if (img && img.width > 0) {
        photoH = Math.min(MAX_PHOTO_H, Math.round((innerW * img.height) / img.width))
      }

      // 追记
      const echoes = e.echoes ?? []
      const echoBlocks: { meta: string; rows: string[] }[] = []
      g.font = `400 14px ${SANS}`
      for (const ec of echoes) {
        const d = new Date(ec.ts)
        echoBlocks.push({
          meta: `追记 · ${d.getMonth() + 1}月${d.getDate()}日 ${fmtTime(ec.ts)}`,
          rows: wrap(g, ec.text, innerW - 16),
        })
      }

      let cardH = CPAD + 20 // 时间行
      if (photoH) cardH += photoH + 12
      cardH += lineRows.length * 27
      if (textRows.length) cardH += 6 + textRows.length * 24
      for (const b of echoBlocks) cardH += 12 + 16 + b.rows.length * 23
      cardH += CPAD

      // —— 绘制卡片 ——
      if (draw) {
        g.fillStyle = C.card
        g.strokeStyle = C.line
        g.lineWidth = 1
        rr(g, PAD, y, contentW, cardH, 18)
        g.fill()
        g.stroke()

        let cy = y + CPAD

        // 时间
        g.fillStyle = C.clay
        g.beginPath()
        g.arc(PAD + CPAD + 4, cy + 7, 3.5, 0, Math.PI * 2)
        g.fill()
        g.fillStyle = C.ink3
        g.font = `400 12.5px ${SANS}`
        g.fillText(fmtTime(e.createdAt), PAD + CPAD + 15, cy + 11)
        cy += 20

        // 照片（cover 裁切 + 圆角）
        if (img && photoH) {
          const targetRatio = innerW / photoH
          const srcRatio = img.width / img.height
          let sx = 0
          let sy = 0
          let sw = img.width
          let sh = img.height
          if (srcRatio > targetRatio) {
            sw = img.height * targetRatio
            sx = (img.width - sw) / 2
          } else {
            sh = img.width / targetRatio
            sy = (img.height - sh) / 2
          }
          g.save()
          rr(g, PAD + CPAD, cy, innerW, photoH, 12)
          g.clip()
          g.drawImage(img, sx, sy, sw, sh, PAD + CPAD, cy, innerW, photoH)
          g.restore()
          cy += photoH + 12
        }

        // 正文
        g.fillStyle = C.ink
        g.font = `500 17px ${SANS}`
        for (const row of lineRows) {
          g.fillText(row, PAD + CPAD, cy + 19)
          cy += 27
        }
        if (textRows.length) {
          cy += 6
          g.fillStyle = C.ink2
          g.font = `400 14px ${SANS}`
          for (const row of textRows) {
            g.fillText(row, PAD + CPAD, cy + 16)
            cy += 24
          }
        }

        // 追记
        for (const b of echoBlocks) {
          cy += 12
          g.fillStyle = C.clay
          g.beginPath()
          g.arc(PAD + CPAD + 3, cy + 10, 3, 0, Math.PI * 2)
          g.fill()
          g.fillStyle = C.ink3
          g.font = `600 11px ${SANS}`
          g.fillText(b.meta, PAD + CPAD + 14, cy + 12)
          cy += 16
          g.fillStyle = C.ink2
          g.font = `400 14px ${SANS}`
          for (const row of b.rows) {
            g.fillText(row, PAD + CPAD + 14, cy + 16)
            cy += 23
          }
        }
      }

      y += cardH + 12
    }

    // 页脚
    y += 10
    if (draw) {
      g.fillStyle = C.ink3
      g.font = `400 12px ${SANS}`
      g.textAlign = 'center'
      g.fillText('拾绪 · 一生那么冗长，值得被记下的远比想象的多。', W / 2, y + 12)
      if (truncated) {
        g.fillText(`（仅包含最近 ${MAX_ENTRIES} 条）`, W / 2, y + 32)
      }
      g.textAlign = 'left'
    }
    y += truncated ? 52 : 32
    return y + PAD
  }

  // 第一遍：量高度
  const H = pass(ctx, false)

  // 自适应清晰度，控制画布总像素规模
  let scale = Math.min(2, Math.sqrt(14_000_000 / (W * H)))
  if (!isFinite(scale) || scale <= 0) scale = 1

  canvas.width = Math.round(W * scale)
  canvas.height = Math.round(H * scale)
  const g = canvas.getContext('2d')!
  g.scale(scale, scale)
  g.fillStyle = C.bg
  g.fillRect(0, 0, W, H)
  pass(g, true)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
  })
  return { blob, truncated }
}
