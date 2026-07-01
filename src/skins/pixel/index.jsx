import React, { useEffect, useRef } from 'react'
import { ColorSprite } from '../../game/sprites.jsx'
import { createLoop, damp, clamp, GRAVITY } from '../../game/engine.js'
import { fx } from '../../game/fx.js'
import './pixel.css'

export const id = 'pixel'
export const labelKey = 'skinPixel'
export const burst = 'coins' // тип салюта при завершении сессии

/* Герой (12×14): кепка, лицо, комбез — собственный персонаж */
const HERO_A = [
  '000111111000', '001111111100', '000222222000', '002232232200', '002222222200',
  '000333333000', '003333333300', '033311113330', '033311113330', '003333333300',
  '000440044000', '000440044000', '000550055000', '005500005500',
]
const HERO_B = [
  '000111111000', '001111111100', '000222222000', '002232232200', '002222222200',
  '000333333000', '003333333300', '033311113330', '033311113330', '003333333300',
  '000444400000', '000044440000', '000005555000', '000055000550',
]
const PALETTE = { 1: '#ff8f00', 2: '#ffd9a0', 3: '#2f6fdd', 4: '#1d3f7d', 5: '#3b2412' }

export function Scene({ prog, phase }) {
  const heroRef = useRef(null)
  const sim = useRef({
    x: 16, vx: 0, y: 0, vy: 0, sx: 1, sy: 1, t: 0,
    flagJumped: false, prevPhase: 'idle', moving: false,
  })
  // живые значения для rAF-цикла без пересоздания
  const live = useRef({ prog, phase })
  live.current = { prog, phase }

  // Физический цикл героя: инерция по X, гравитация по Y, squash&stretch
  useEffect(() => {
    const el = heroRef.current
    if (!el) return undefined
    const s = sim.current
    const loop = createLoop((dt) => {
      s.t += dt
      const { prog: p, phase: ph } = live.current
      const target = ph === 'focus' ? 6 + p * 68 : ph === 'break' ? 74 : 16

      // --- X: тяга к цели + сопротивление + предел скорости (инерция, не телепорт) ---
      const dx = target - s.x
      s.vx += dx * 4.2 * dt
      s.vx = damp(s.vx, 2.6, dt)
      s.vx = clamp(s.vx, -20, 20) // vw/сек
      s.x += s.vx * dt
      const moving = Math.abs(s.vx) > 0.4 && Math.abs(dx) > 0.12

      // --- Y: баллистика прыжка ---
      if (s.y > 0 || s.vy !== 0) {
        s.vy -= GRAVITY * dt
        s.y += s.vy * dt
        if (s.y <= 0) {
          if (s.vy < -430) {
            // жёсткое приземление: сплющивание + пыль
            s.sx = 1.35; s.sy = 0.6
            try {
              const r = el.getBoundingClientRect()
              fx.fire('dust', r.left + r.width / 2, r.bottom - 4)
            } catch { /* среда без DOM-метрик */ }
          }
          s.y = 0; s.vy = 0
        }
      }

      // прыжок на флагшток в конце уровня (stretch на взлёте)
      if (ph === 'focus' && p >= 0.985 && !s.flagJumped && s.y === 0) {
        s.flagJumped = true
        s.sx = 0.78; s.sy = 1.28
        s.vy = 820; s.y = 0.001
      }
      if (p < 0.9) s.flagJumped = false

      // squash/stretch упруго возвращается к 1
      s.sx += (1 - s.sx) * 12 * dt
      s.sy += (1 - s.sy) * 12 * dt

      // бег: вертикальный «шаг» синусом, только на земле
      const bob = moving && s.y === 0 ? Math.abs(Math.sin(s.t * 11)) * 3.5 : 0

      el.style.transform = `translate(${s.x.toFixed(3)}vw, ${(-(s.y + bob)).toFixed(2)}px) scale(${s.sx.toFixed(3)}, ${s.sy.toFixed(3)})`
      if (moving !== s.moving) {
        s.moving = moving
        el.dataset.moving = moving ? '1' : '0'
      }
    })
    loop.start()
    return () => loop.stop()
  }, [])

  // радостный хоп на старте фокуса (после GO!)
  useEffect(() => {
    const s = sim.current
    if (phase === 'focus' && s.prevPhase !== 'focus') {
      s.vy = 460; s.y = Math.max(s.y, 0.001)
      s.sx = 0.85; s.sy = 1.2
    }
    s.prevPhase = phase
  }, [phase])

  const pipes = [14, 64]
  const bushes = [30, 84]
  const blocks = [44, 92]
  const per = (x) => [x, x + 100]

  return (
    <div className="scene scene-pixel">
      <div className="px-clouds">
        {[8, 34, 58, 82, 108, 134, 158, 182].map((x, i) => (
          <div key={i} className="px-cloud" style={{ left: `${x}vw`, top: `${8 + (i % 3) * 9}%` }} />
        ))}
      </div>
      <div className="px-world">
        {pipes.flatMap(per).map((x, i) => <div key={`p${i}`} className="px-pipe" style={{ left: `${x}vw` }} />)}
        {bushes.flatMap(per).map((x, i) => <div key={`b${i}`} className="px-bush" style={{ left: `${x}vw` }} />)}
        {blocks.flatMap(per).map((x, i) => (
          <div key={`q${i}`} className="px-blockrow" style={{ left: `${x}vw` }}>
            <span className="px-brick" />
            <span className="px-qblock">?</span>
            <span className="px-brick" />
            <span className="px-coin" style={{ animationDelay: `${(i % 4) * 0.4}s` }} />
          </div>
        ))}
      </div>
      <div className="px-flag">
        <span className="flag-ball" />
        <span className="flag-cloth" />
        <span className="flag-pole" />
      </div>
      <div className="px-hero" ref={heroRef}>
        <ColorSprite map={HERO_A} palette={PALETTE} className="hero-f hero-a" />
        <ColorSprite map={HERO_B} palette={PALETTE} className="hero-f hero-b" />
      </div>
      <div className="px-ground" />
    </div>
  )
}
