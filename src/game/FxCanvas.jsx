import React, { useEffect, useRef } from 'react'
import { createLoop, damp } from './engine.js'
import { fx } from './fx.js'

/* Canvas-система частиц с настоящей баллистикой:
   гравитация, сопротивление воздуха, вращение, отскок от «пола» для монет. */

const rnd = (a, b) => a + Math.random() * (b - a)

const PRESETS = {
  // золотые монеты: высокая дуга, отскок от пола, блик-вращение
  coins: () => ({ n: 18, vy: [-720, -420], vx: 300, g: 1650, drag: 0.4, life: [1.4, 2], size: [10, 15], bounce: 0.45, kind: 'coin' }),
  // точки лабиринта: лёгкие, светятся
  dots: () => ({ n: 14, vy: [-420, -180], vx: 240, g: 900, drag: 0.8, life: [0.9, 1.4], size: [4, 7], kind: 'glow', color: '#ffe9a8' }),
  // тетромино-клетки: тяжёлые, крутятся
  cells: () => ({ n: 16, vy: [-620, -320], vx: 320, g: 1900, drag: 0.3, life: [1.2, 1.8], size: [9, 14], kind: 'cell' }),
  // пиксельные ошмётки взрыва
  bits: () => ({ n: 12, vy: [-360, -60], vx: 380, g: 1400, drag: 0.5, life: [0.5, 0.9], size: [3, 6], kind: 'square', color: '#9ef01a' }),
  // неоновые штрихи: почти невесомые
  bars: () => ({ n: 14, vy: [-260, -80], vx: 300, g: 260, drag: 1.4, life: [1, 1.6], size: [12, 20], kind: 'bar' }),
  // конфетти классики
  confetti: (accent) => ({ n: 20, vy: [-560, -260], vx: 340, g: 1100, drag: 0.9, life: [1.2, 2], size: [6, 11], kind: 'confetti', color: accent }),
  // пыль от приземления
  dust: () => ({ n: 7, vy: [-160, -60], vx: 120, g: 620, drag: 1.8, life: [0.35, 0.6], size: [3, 6], kind: 'glow', color: 'rgba(255,255,255,0.85)' }),
}

const CELL_COLORS = ['#37d6e8', '#ffd23f', '#b06cf0', '#5ce65c', '#ff5d5d', '#4d7cff', '#ff9f40']
const CONFETTI_EXTRA = ['#8b5cf6', '#2dd4bf', '#f59e0b', '#fb7185', '#60a5fa']

export default function FxCanvas() {
  const canvasRef = useRef(null)
  const particles = useRef([])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext && canvas.getContext('2d')
    if (!ctx) return undefined

    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const floorY = () => window.innerHeight - 60

    const loop = createLoop((dt) => {
      const ps = particles.current
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = ps.length - 1; i >= 0; i -= 1) {
        const p = ps[i]
        p.age += dt
        if (p.age >= p.life) { ps.splice(i, 1); continue }
        // физика: гравитация + сопротивление
        p.vy += p.g * dt
        p.vx = damp(p.vx, p.drag, dt)
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.rot += p.vr * dt
        // отскок монет от пола
        if (p.bounce && p.y > floorY() && p.vy > 0) {
          p.y = floorY()
          p.vy = -p.vy * p.bounce
          p.vx *= 0.7
        }
        // отрисовка
        const fade = 1 - p.age / p.life
        ctx.globalAlpha = fade
        ctx.save()
        ctx.translate(p.x, p.y)
        if (p.kind === 'coin') {
          // «вращение» монеты — сжатие по X
          const w = Math.abs(Math.cos(p.rot * 2.4)) * p.size
          const grad = ctx.createRadialGradient(-w * 0.2, -p.size * 0.2, 1, 0, 0, p.size)
          grad.addColorStop(0, '#ffe9a8')
          grad.addColorStop(0.6, '#ffc93c')
          grad.addColorStop(1, '#d99a12')
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.ellipse(0, 0, Math.max(1.5, w), p.size, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = '#9a6a00'
          ctx.lineWidth = 2
          ctx.stroke()
        } else if (p.kind === 'glow') {
          ctx.fillStyle = p.color
          ctx.shadowColor = p.color
          ctx.shadowBlur = 8
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
          ctx.fill()
        } else if (p.kind === 'cell') {
          ctx.rotate(p.rot)
          ctx.fillStyle = p.color
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
          ctx.fillStyle = 'rgba(255,255,255,0.4)'
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.28)
        } else if (p.kind === 'square') {
          ctx.fillStyle = p.color
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
        } else if (p.kind === 'bar') {
          ctx.rotate(p.rot)
          ctx.fillStyle = p.color
          ctx.shadowColor = p.color
          ctx.shadowBlur = 10
          ctx.fillRect(-p.size / 2, -2, p.size, 4)
        } else { // confetti
          ctx.rotate(p.rot)
          ctx.fillStyle = p.color
          if (p.round) ctx.beginPath(), ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2), ctx.fill()
          else ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66)
        }
        ctx.restore()
      }
      ctx.globalAlpha = 1
      if (!ps.length) loop.stop()
    })

    const off = fx.on((type, x, y, opts) => {
      const preset = PRESETS[type]?.(opts.color)
      if (!preset) return
      for (let i = 0; i < preset.n; i += 1) {
        particles.current.push({
          x: x + rnd(-8, 8),
          y: y + rnd(-8, 8),
          vx: rnd(-preset.vx, preset.vx),
          vy: rnd(preset.vy[0], preset.vy[1]),
          g: preset.g,
          drag: preset.drag,
          life: rnd(preset.life[0], preset.life[1]),
          age: 0,
          size: rnd(preset.size[0], preset.size[1]),
          rot: rnd(0, Math.PI * 2),
          vr: rnd(-6, 6),
          bounce: preset.bounce || 0,
          round: Math.random() > 0.5,
          kind: preset.kind,
          color: preset.kind === 'cell'
            ? CELL_COLORS[i % CELL_COLORS.length]
            : preset.kind === 'bar'
              ? (i % 2 ? '#4dd7ff' : '#ff5d8f')
              : preset.kind === 'confetti'
                ? (opts.color && i % 3 === 0 ? opts.color : CONFETTI_EXTRA[i % CONFETTI_EXTRA.length])
                : preset.color,
        })
      }
      loop.start()
    })

    return () => {
      off()
      loop.stop()
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="fx-canvas" aria-hidden="true" />
}
