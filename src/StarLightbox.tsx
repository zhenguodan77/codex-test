import { useEffect, useRef } from 'react'

interface Props {
  photo: string
  line?: string
  onClose: () => void
}

/**
 * 星光照片：照片化作满屏光点，闪烁着汇聚成整张照片；
 * 落定后真图淡入，光点降为持续的微光（波光粼粼）。
 */
export default function StarLightbox({ photo, line, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgElRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    let raf = 0
    let cancelled = false
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      if (cancelled || !img.width || !img.height) return

      // 展示尺寸：适配视口
      const vw = window.innerWidth
      const vh = window.innerHeight
      const maxW = Math.min(vw * 0.88, 520)
      const maxH = vh * 0.6
      const fit = Math.min(maxW / img.width, maxH / img.height)
      const dw = Math.round(img.width * fit)
      const dh = Math.round(img.height * fit)

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = dw * dpr
      canvas.height = dh * dpr
      canvas.style.width = `${dw}px`
      canvas.style.height = `${dh}px`
      ctx.scale(dpr, dpr)
      const stage = canvas.parentElement as HTMLElement | null
      if (stage) {
        stage.style.width = `${dw}px`
        stage.style.height = `${dh}px`
      }

      // 采样像素 → 光点
      const cols = Math.max(48, Math.min(92, Math.round(dw / 6)))
      const rows = Math.max(1, Math.round((cols * dh) / dw))
      const off = document.createElement('canvas')
      off.width = cols
      off.height = rows
      const octx = off.getContext('2d')
      if (!octx) return
      octx.drawImage(img, 0, 0, cols, rows)
      const data = octx.getImageData(0, 0, cols, rows).data
      const cellW = dw / cols
      const cellH = dh / rows

      interface P {
        tx: number
        ty: number
        sx: number
        sy: number
        r: number
        g: number
        b: number
        delay: number
        tw: number
        twSpeed: number
        size: number
      }
      const parts: P[] = []
      for (let yy = 0; yy < rows; yy++) {
        for (let xx = 0; xx < cols; xx++) {
          const i = (yy * cols + xx) * 4
          if (data[i + 3] < 10) continue
          const tx = xx * cellW + cellW / 2
          const ty = yy * cellH + cellH / 2
          const ang = Math.random() * Math.PI * 2
          const dist = Math.max(dw, dh) * (0.45 + Math.random() * 0.75)
          parts.push({
            tx,
            ty,
            sx: tx + Math.cos(ang) * dist,
            sy: ty + Math.sin(ang) * dist,
            r: data[i],
            g: data[i + 1],
            b: data[i + 2],
            delay: Math.random() * 0.4,
            tw: Math.random() * Math.PI * 2,
            twSpeed: 2 + Math.random() * 4,
            size: cellW * (0.55 + Math.random() * 0.45),
          })
        }
      }

      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const ASSEMBLE = reduced ? 0 : 2.1 // 秒
      const start = performance.now()
      const ease = (t: number) => 1 - Math.pow(1 - t, 3)
      let settled = false

      const frame = (now: number) => {
        if (cancelled) return
        const sec = (now - start) / 1000
        ctx.clearRect(0, 0, dw, dh)
        let allDone = true
        for (const p of parts) {
          const t = ASSEMBLE === 0 ? 1 : Math.min(1, Math.max(0, (sec - p.delay) / ASSEMBLE))
          if (t < 1) allDone = false
          const e = ease(t)
          const x = p.sx + (p.tx - p.sx) * e
          const y = p.sy + (p.ty - p.sy) * e
          const twinkle = 0.5 + 0.5 * Math.sin(p.tw + (now / 1000) * p.twSpeed)
          ctx.globalAlpha = t < 1 ? 0.3 + 0.7 * twinkle : 0.72 + 0.28 * twinkle
          ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`
          const s = p.size * (t < 1 ? 0.85 + 0.55 * twinkle : 1.04)
          ctx.fillRect(x - s / 2, y - s / 2, s, s)
          // 偶发的白色星芒
          if (twinkle > 0.94) {
            ctx.globalAlpha = (twinkle - 0.94) * 8
            ctx.fillStyle = '#fff'
            ctx.fillRect(x - s / 4, y - s / 4, s / 2, s / 2)
          }
        }
        ctx.globalAlpha = 1

        if (allDone && !settled) {
          settled = true
          imgElRef.current?.classList.add('show')
          canvas.classList.add('settled')
        }
        raf = requestAnimationFrame(frame)
      }
      raf = requestAnimationFrame(frame)
    }
    img.onerror = () => {
      // 采样失败就直接显示原图
      imgElRef.current?.classList.add('show')
    }
    img.src = photo

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [photo])

  return (
    <div className="lightbox star" onClick={onClose}>
      <div className="star-stage">
        <img ref={imgElRef} className="star-photo" src={photo} alt="" />
        <canvas ref={canvasRef} className="star-canvas" />
      </div>
      {line && <p className="star-line">{line}</p>}
    </div>
  )
}
