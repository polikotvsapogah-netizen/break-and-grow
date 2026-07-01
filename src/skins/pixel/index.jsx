import React, { useEffect, useRef } from 'react'
import { ColorSprite } from '../../game/sprites.jsx'
import { createLoop, GRAVITY } from '../../game/engine.js'
import { fx } from '../../game/fx.js'
import './pixel.css'

export const id = 'pixel'
export const labelKey = 'skinPixel'
export const burst = 'coins'

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

const HERO_X = 16 // vw — герой бежит «на месте», мир едет под ним (как в аркадах)
const PIPES = [14, 64] // мировые позиции труб (период 100vw, дубли на +100)

export function Scene({ prog, phase }) {
  const heroRef = useRef(null)
  const worldRef = useRef(null)
  const groundRef = useRef(null)
  const flagRef = useRef(null)
  const sim = useRef({
    offset: Math.random() * 50, groundX: 0,
    y: 0, vy: 0, sx: 1, sy: 1, t: 0,
    flagJumped: false, prevPhase: 'idle', running: false,
  })
  const live = useRef({ prog, phase })
  live.current = { prog, phase }

  useEffect(() => {
    const hero = heroRef.current
    const world = worldRef.current
    const ground = groundRef.current
    const flag = flagRef.current
    if (!hero || !world) return undefined
    const s = sim.current

    const loop = createLoop((dt) => {
      s.t += dt
      const { prog: p, phase: ph } = live.current
      const finishing = ph === 'focus' && p >= 0.99
      const atFlagPhase = ph === 'break' || finishing

      // --- скорость мира: аркадный постоянный бег; у флага мир останавливается ---
      const targetSpeed = atFlagPhase ? 0 : ph === 'focus' ? 12 : 5 // vw/сек
      const speed = targetSpeed // мгновенная (аркады не размазывают старт)
      s.offset = (s.offset + speed * dt) % 100
      world.style.transform = `translateX(${(-s.offset).toFixed(3)}vw)`

      // земля скроллится синхронно (кирпичи, период 48px)
      const vwPx = window.innerWidth / 100
      s.groundX = (s.groundX + speed * dt * vwPx) % 48
      if (ground) ground.style.backgroundPosition = `0px 0px, ${(-s.groundX).toFixed(1)}px 0px, 0px 0px`

      // --- прыжки через приближающиеся трубы (настоящая баллистика) ---
      if (!atFlagPhase && s.y === 0 && speed > 0) {
        for (const P of [PIPES[0], PIPES[1], PIPES[0] + 100, PIPES[1] + 100]) {
          const screen = P - s.offset
          const gap = screen - HERO_X
          if (gap > 3.5 && gap < 3.5 + speed * 0.42) { // труба будет у героя через ~0.42с
            s.vy = 780
            s.y = 0.001
            s.sx = 0.8; s.sy = 1.25 // stretch на взлёте
            break
          }
        }
      }

      // --- вертикаль: гравитация; падение тяжелее взлёта (аркадная дуга) ---
      if (s.y > 0 || s.vy !== 0) {
        s.vy -= GRAVITY * (s.vy < 0 ? 1.8 : 1) * dt
        s.y += s.vy * dt
        if (s.y <= 0) {
          if (s.vy < -500) {
            s.sx = 1.3; s.sy = 0.65 // squash при приземлении
            try {
              const r = hero.getBoundingClientRect()
              fx.fire('dust', r.left + r.width / 2, r.bottom - 4)
            } catch { /* среда без DOM-метрик */ }
          }
          s.y = 0; s.vy = 0
        }
      }

      // --- флаг приближается по прогрессу; в конце — прыжок на флагшток ---
      if (flag) {
        const flagX = ph === 'focus'
          ? HERO_X + 2 + (1 - p) * 80
          : ph === 'break' ? HERO_X + 2 : 108
        flag.style.left = `${flagX.toFixed(2)}vw`
      }
      if (atFlagPhase && !s.flagJumped && s.y === 0) {
        s.flagJumped = true
        s.vy = 860; s.y = 0.001
        s.sx = 0.8; s.sy = 1.25
      }
      if (ph === 'focus' && p < 0.9) s.flagJumped = false

      // squash/stretch упруго возвращается
      s.sx += (1 - s.sx) * 14 * dt
      s.sy += (1 - s.sy) * 14 * dt

      // бег: шаг-подпрыгивание только на земле и в движении
      const running = speed > 0
      const bob = running && s.y === 0 ? Math.abs(Math.sin(s.t * (speed > 8 ? 13 : 9))) * 3.5 : 0
      hero.style.transform = `translate(${HERO_X}vw, ${(-(s.y + bob)).toFixed(2)}px) scale(${s.sx.toFixed(3)}, ${s.sy.toFixed(3)})`
      if (running !== s.running) {
        s.running = running
        hero.dataset.moving = running ? '1' : '0'
      }
    })
    loop.start()
    return () => loop.stop()
  }, [])

  // радостный хоп на старте фокуса (после GO!)
  useEffect(() => {
    const s = sim.current
    if (phase === 'focus' && s.prevPhase !== 'focus') {
      s.vy = 520; s.y = Math.max(s.y, 0.001)
      s.sx = 0.85; s.sy = 1.2
    }
    s.prevPhase = phase
  }, [phase])

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
      <div className="px-world" ref={worldRef}>
        {PIPES.flatMap(per).map((x, i) => <div key={`p${i}`} className="px-pipe" style={{ left: `${x}vw` }} />)}
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
      {/* Флаг-цель: приближается к герою по мере прогресса (в фиксированном слое) */}
      <div className="px-flag" ref={flagRef}>
        <span className="flag-ball" />
        <span className="flag-cloth" />
        <span className="flag-pole" />
      </div>
      <div className="px-hero" ref={heroRef}>
        <ColorSprite map={HERO_A} palette={PALETTE} className="hero-f hero-a" />
        <ColorSprite map={HERO_B} palette={PALETTE} className="hero-f hero-b" />
      </div>
      <div className="px-ground" ref={groundRef} />
    </div>
  )
}
