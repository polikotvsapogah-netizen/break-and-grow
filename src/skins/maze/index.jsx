import React, { useEffect, useRef } from 'react'
import { createLoop } from '../../game/engine.js'
import './maze.css'

export const id = 'maze'
export const labelKey = 'skinMaze'
export const burst = 'dots'

/* Лабиринт v2: визуал учитывает меню — пак и призраки бегут по ПЕРИМЕТРУ экрана,
   вокруг интерфейса, по дорожке из точек. Ничего не прячется за карточками. */
const INSET = 26 // px от края — дорожка

export function Scene({ prog, phase }) {
  const pacRef = useRef(null)
  const ghostRefs = useRef([])
  const live = useRef({ phase })
  live.current = { phase }
  const sim = useRef({ s: 0 })

  useEffect(() => {
    const pac = pacRef.current
    if (!pac) return undefined
    const st = sim.current

    // позиция и угол на периметре по дистанции d
    const pos = (d) => {
      const W = window.innerWidth - INSET * 2
      const H = window.innerHeight - INSET * 2
      const P = 2 * (W + H)
      let x = ((d % P) + P) % P
      if (x < W) return [INSET + x, INSET, 0]            // верх →
      x -= W
      if (x < H) return [INSET + W, INSET + x, 90]       // право ↓
      x -= H
      if (x < W) return [INSET + W - x, INSET + H, 180]  // низ ←
      x -= W
      return [INSET, INSET + H - x, 270]                 // лево ↑
    }

    const loop = createLoop((dt) => {
      if (live.current.phase === 'break') return // перерыв = пауза
      const focus = live.current.phase === 'focus'
      const v = focus ? 260 : 130 // px/сек — аркадная постоянная скорость
      st.s += v * dt
      const [px, py, rot] = pos(st.s)
      pac.style.transform = `translate(${px - 19}px, ${py - 19}px) rotate(${rot}deg)`
      ghostRefs.current.forEach((g, i) => {
        if (!g) return
        const [gx, gy] = pos(st.s - 90 - i * 70)
        g.style.transform = `translate(${gx - 16}px, ${gy - 18}px)`
      })
    })
    loop.start()
    return () => loop.stop()
  }, [])

  const focus = phase === 'focus'
  return (
    <div className="scene scene-maze">
      <div className="mz-walls" />
      {/* дорожка точек по периметру */}
      <div className="mz-track tr-top" />
      <div className="mz-track tr-bottom" />
      <div className="mz-track tr-left" />
      <div className="mz-track tr-right" />
      {/* мигающие пеллеты по углам */}
      {['tl', 'tr', 'bl', 'br'].map((c, i) => (
        <span key={c} className={`mz-pellet pel-${c}`} style={{ animationDelay: `${i * 0.25}s` }} />
      ))}
      {/* линия прогресса сессии */}
      <div className="mz-progline" style={{ width: `${(focus ? prog * 100 : 0).toFixed(2)}%` }} />
      <div className="mz-pac" ref={pacRef} />
      {['#ff5d5d', '#ffb8de', '#4dd7ff'].map((c, i) => (
        <div
          key={i}
          className="mz-ghost"
          ref={(el) => { ghostRefs.current[i] = el }}
          style={{ '--gc': c }}
        />
      ))}
    </div>
  )
}
