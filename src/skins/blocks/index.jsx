import React, { useEffect, useRef } from 'react'
import { createLoop } from '../../game/engine.js'
import './blocks.css'

export const id = 'blocks'
export const labelKey = 'skinBlocks'
export const burst = 'cells'

const TETRO = [
  { cells: [[0, 0], [1, 0], [2, 0], [3, 0]], c: '#37d6e8' }, // I
  { cells: [[0, 0], [1, 0], [0, 1], [1, 1]], c: '#ffd23f' }, // O
  { cells: [[0, 0], [1, 0], [2, 0], [1, 1]], c: '#b06cf0' }, // T
  { cells: [[1, 0], [2, 0], [0, 1], [1, 1]], c: '#5ce65c' }, // S
  { cells: [[0, 0], [1, 0], [1, 1], [2, 1]], c: '#ff5d5d' }, // Z
  { cells: [[0, 0], [0, 1], [1, 1], [2, 1]], c: '#4d7cff' }, // J
  { cells: [[2, 0], [0, 1], [1, 1], [2, 1]], c: '#ff9f40' }, // L
]

export function Scene({ prog, phase }) {
  const refs = useRef([])
  const sims = useRef(null)

  // Физика падения: v += g·dt (ускорение, терминальная скорость),
  // поворот дискретными шагами 90° — как в оригинале
  useEffect(() => {
    if (!sims.current) {
      sims.current = Array.from({ length: 12 }, (_, i) => ({
        y: -120 - Math.random() * window.innerHeight,
        v: 30 + Math.random() * 60,
        g: 260 + (i % 5) * 90,          // разное «весовое» ускорение
        vmax: 340 + (i % 4) * 130,       // терминальная скорость
        rt: Math.random() * 4,
        rspd: 0.5 + Math.random() * 0.9, // шагов поворота в секунду
      }))
    }
    const loop = createLoop((dt) => {
      const H = window.innerHeight
      sims.current.forEach((s, i) => {
        const el = refs.current[i]
        if (!el) return
        s.v = Math.min(s.vmax, s.v + s.g * dt)
        s.y += s.v * dt
        s.rt += s.rspd * dt
        if (s.y > H + 140) { // новая фигура сверху, обнуляем скорость
          s.y = -160
          s.v = 30 + Math.random() * 60
        }
        const rot = Math.floor(s.rt % 4) * 90
        el.style.transform = `translateY(${s.y.toFixed(1)}px) rotate(${rot}deg) scale(${el.dataset.sc})`
      })
    })
    loop.start()
    return () => loop.stop()
  }, [])

  const pieces = Array.from({ length: 12 }, (_, i) => ({
    t: TETRO[i % TETRO.length],
    x: (i * 8.3 + 3) % 92,
    scale: 0.7 + (i % 3) * 0.25,
  }))
  const stackH = 26 + (phase === 'focus' ? prog * 140 : 0)

  return (
    <div className="scene scene-blocks">
      <div className="bl-grid" />
      {pieces.map((p, i) => (
        <div
          key={i}
          ref={(el) => { refs.current[i] = el }}
          className="bl-piece"
          data-sc={p.scale}
          style={{ left: `${p.x}vw` }}
        >
          {p.t.cells.map(([cx, cy], j) => (
            <span key={j} className="bl-cell" style={{ left: cx * 16, top: cy * 16, background: p.t.c }} />
          ))}
        </div>
      ))}
      <div className="bl-stack" style={{ height: stackH }} />
    </div>
  )
}
