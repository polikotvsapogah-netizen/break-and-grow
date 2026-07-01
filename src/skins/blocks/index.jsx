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
  const live = useRef({ prog, phase })
  live.current = { prog, phase }

  // Физика падения: v += g·dt до терминальной скорости, поворот шагами 90°.
  // Фигура ПРИЗЕМЛЯЕТСЯ на стек (коллизия), лочится, вспыхивает и растворяется —
  // как лок-даун в оригинале, ничего не проваливается сквозь пол.
  useEffect(() => {
    if (!sims.current) {
      sims.current = Array.from({ length: 12 }, (_, i) => ({
        y: -60 - (i / 12) * (window.innerHeight * 0.9), // равномерно распределены по высоте
        v: 30 + Math.random() * 60,
        g: 260 + (i % 5) * 90,
        vmax: 320 + (i % 4) * 120,
        rt: Math.random() * 4,
        rspd: 0.5 + Math.random() * 0.9,
        locked: false, lockT: 0,
      }))
    }
    const loop = createLoop((dt) => {
      const H = window.innerHeight
      const { prog: p, phase: ph } = live.current
      const stackH = 26 + (ph === 'focus' ? p * 140 : 0)
      sims.current.forEach((s, i) => {
        const el = refs.current[i]
        if (!el) return
        const sc = Number(el.dataset.sc) || 1
        const pieceH = 32 * sc
        const floor = H - stackH - pieceH // поверхность стека

        if (!s.locked) {
          s.v = Math.min(s.vmax, s.v + s.g * dt)
          s.y += s.v * dt
          s.rt += s.rspd * dt
          if (s.y >= floor) { // коллизия со стеком → лок
            s.y = floor
            s.locked = true
            s.lockT = 0
            s.rt = Math.round(s.rt) // выравниваем поворот к 90°
          }
        } else {
          s.lockT += dt
          // вспышка при локе, потом растворение и респаун сверху
          const flash = s.lockT < 0.12 ? 1.9 : 1
          const fade = s.lockT < 0.35 ? 1 : Math.max(0, 1 - (s.lockT - 0.35) / 0.55)
          el.style.opacity = fade.toFixed(2)
          el.style.filter = flash > 1 ? 'brightness(1.9)' : ''
          if (s.lockT > 0.95) {
            s.locked = false
            s.y = -80 - Math.random() * 200
            s.v = 30 + Math.random() * 60
            el.style.opacity = '1'
            el.style.filter = ''
          }
        }
        const rot = (Math.floor(s.rt) % 4) * 90
        el.style.transform = `translateY(${s.y.toFixed(1)}px) rotate(${rot}deg) scale(${sc})`
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
