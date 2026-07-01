import React, { useEffect, useRef, useState } from 'react'
import { ColorSprite } from '../../game/sprites.jsx'
import { createLoop, GRAVITY } from '../../game/engine.js'
import { fx } from '../../game/fx.js'
import { useApp } from '../../store.jsx'
import { getPhrase } from '../../motivation.js'
import './pixel.css'

export const id = 'pixel'
export const labelKey = 'skinPixel'
export const burst = 'coins'

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

const HERO_X = 16
const PIPES = [14, 64]
const QBLOCKS = [44, 92, 144, 192] // мировые X «?»-рядов (лево ряда + ~2vw до блока)

/* История уровня (~5 минут, потом повторяется):
   монетки по земле → дуги монет → «?»-блоки отдают монеты → гриб-буст (скорость+рост)
   → слизень (перепрыгнуть, бонус) → звезда (радужный герой). Всё собирается в HUD. */
export function Scene({ prog, phase }) {
  const heroRef = useRef(null)
  const worldRef = useRef(null)
  const groundRef = useRef(null)
  const flagRef = useRef(null)
  const entElsRef = useRef(new Map())
  const [, setVer] = useState(0) // ре-рендер списка сущностей
  const [bubble, setBubble] = useState(null) // фраза-пузырь у героя
  const { state: appState, addCoins, likePhrase } = useApp()
  const addCoinsRef = useRef(addCoins)
  addCoinsRef.current = addCoins
  const appRef = useRef({ appState, likePhrase })
  appRef.current = { appState, likePhrase }

  // Фраза у героя: по событиям (гриб/звезда) и амбиентно раз в ~100с
  const sayRef = useRef(null)
  sayRef.current = (ctx) => {
    const s = appRef.current.appState
    const goal = s.goals.find((g) => g.id === s.currentGoalId)
    const ph = getPhrase(ctx, { lang: s.settings.lang, name: s.profile.username, goal, liked: s.profile.likedPhrases })
    if (ph) {
      setBubble(ph)
      setTimeout(() => setBubble((b) => (b && b.id === ph.id ? null : b)), 8000)
    }
  }

  const sim = useRef({
    offset: Math.random() * 50, dist: 0, groundX: 0,
    y: 0, vy: 0, sx: 1, sy: 1, t: 0,
    flagJumped: false, prevPhase: 'idle', running: false,
    ents: [], nextId: 1,
    coinT: 3, arcT: 20, shroomT: 60, starT: 130, slimeT: 40, birdT: 10, sayT: 45,
    qCool: {}, boostUntil: 0, starUntil: 0,
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

    const spawn = (type, extra = {}) => {
      s.ents.push({ id: s.nextId++, type, taken: false, wx: s.dist + 112, y: 8, ...extra })
      setVer((v) => v + 1)
    }
    const despawn = (ids) => {
      if (!ids.length) return
      s.ents = s.ents.filter((e) => !ids.includes(e.id))
      ids.forEach((i) => entElsRef.current.delete(i))
      setVer((v) => v + 1)
    }
    const heroPx = () => {
      try { const r = hero.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2] } catch { return [200, 400] }
    }
    const collect = (e, n = 1) => {
      e.taken = true
      const [px, py] = heroPx()
      fx.fire('coins', px, py - 20, { n: 4 })
      addCoinsRef.current(n)
    }

    const loop = createLoop((dt) => {
      s.t += dt
      const { prog: p, phase: ph } = live.current
      const finishing = ph === 'focus' && p >= 0.99
      const atFlagPhase = ph === 'break' || finishing
      const boost = s.t < s.boostUntil
      const star = s.t < s.starUntil

      // --- скорость мира ---
      const speed = atFlagPhase ? 0 : (ph === 'focus' ? 12 : 5) + (boost ? 3 : 0)
      s.offset = (s.offset + speed * dt) % 100
      s.dist += speed * dt
      world.style.transform = `translateX(${(-s.offset).toFixed(3)}vw)`
      const vwPx = window.innerWidth / 100
      s.groundX = (s.groundX + speed * dt * vwPx) % 48
      if (ground) ground.style.backgroundPosition = `0px 0px, ${(-s.groundX).toFixed(1)}px 0px, 0px 0px`

      // --- сюжетные спавны ---
      if (speed > 0) {
        s.coinT -= dt; s.arcT -= dt; s.shroomT -= dt; s.starT -= dt; s.slimeT -= dt; s.birdT -= dt
        if (s.coinT <= 0) { spawn('coin'); s.coinT = 6 + Math.random() * 4 }
        if (s.arcT <= 0) { // дуга из 5 монет
          for (let i = 0; i < 5; i += 1) {
            s.ents.push({ id: s.nextId++, type: 'coin', taken: false, wx: s.dist + 112 + i * 4, y: 26 + Math.sin((i / 4) * Math.PI) * 84 })
          }
          setVer((v) => v + 1)
          s.arcT = 45 + Math.random() * 15
        }
        if (s.shroomT <= 0) { spawn('shroom', { y: 0 }); s.shroomT = 150 }
        if (s.starT <= 0) { spawn('star', { y: 96 }); s.starT = 240 }
        if (s.slimeT <= 0) { spawn('slime', { y: 0 }); s.slimeT = 90 + Math.random() * 30 }
        if (s.birdT <= 0) { spawn('bird', { y: 300 + Math.random() * 120 }); s.birdT = 22 + Math.random() * 10 }
        s.sayT -= dt
        if (s.sayT <= 0) { sayRef.current('ambient'); s.sayT = 95 + Math.random() * 40 }
      }

      // --- «?»-блоки отдают монету при проходе героя ---
      for (const Q of QBLOCKS) {
        const sx = Q - s.offset + 2 // центр «?»-блока
        if (sx > 15.2 && sx < 17.8 && speed > 0) {
          const key = String(Q)
          if (!s.qCool[key] || s.t - s.qCool[key] > 45) {
            s.qCool[key] = s.t
            const blockPxX = (sx + 1) * vwPx
            const blockPxY = window.innerHeight - 92 - 262 - 30
            fx.fire('coins', blockPxX, blockPxY, { n: 4 })
            addCoinsRef.current(1)
          }
        }
      }

      // --- прыжки: трубы, слизни и дуги монет ---
      const jumpWindow = (gap) => gap > 3.5 && gap < 3.5 + Math.max(4, speed) * 0.42
      if (!atFlagPhase && s.y === 0 && speed > 0) {
        let doJump = false
        for (const P of [PIPES[0], PIPES[1], PIPES[0] + 100, PIPES[1] + 100]) {
          if (jumpWindow(P - s.offset - HERO_X)) { doJump = true; break }
        }
        if (!doJump) {
          for (const e of s.ents) {
            if (e.taken) continue
            const sx = e.wx - s.dist
            if ((e.type === 'slime' || (e.type === 'coin' && e.y > 46) || e.type === 'star') && jumpWindow(sx - HERO_X)) { doJump = true; break }
          }
        }
        if (doJump) { s.vy = 780; s.y = 0.001; s.sx = 0.8; s.sy = 1.25 }
      }

      // --- вертикаль героя ---
      if (s.y > 0 || s.vy !== 0) {
        s.vy -= GRAVITY * (s.vy < 0 ? 1.8 : 1) * dt
        s.y += s.vy * dt
        if (s.y <= 0) {
          if (s.vy < -500) {
            s.sx = 1.3; s.sy = 0.65
            const [px] = heroPx()
            fx.fire('dust', px, window.innerHeight - 96)
          }
          s.y = 0; s.vy = 0
        }
      }

      // --- сущности: движение, коллизии, отрисовка ---
      const toRemove = []
      for (const e of s.ents) {
        if (e.type === 'slime') e.wx -= 2.2 * dt // ползёт навстречу
        if (e.type === 'bird') e.wx += speed * 0.4 * dt // летит медленнее мира
        if (e.type === 'star') e.y = 96 + Math.sin(s.t * 3 + e.id) * 14
        const sx = e.wx - s.dist
        if (sx < -14) { toRemove.push(e.id); continue }
        // сбор
        if (!e.taken && e.type !== 'bird' && Math.abs(sx - (HERO_X + 0.8)) < 2) {
          const heroTop = s.y + 60
          const overlap = e.y < heroTop + 12 && e.y + 26 > s.y - 6
          if (overlap) {
            if (e.type === 'coin') collect(e, 1)
            if (e.type === 'shroom') { collect(e, 2); s.boostUntil = s.t + 25; sayRef.current('powerup') }
            if (e.type === 'star') { collect(e, 3); s.starUntil = s.t + 12; sayRef.current('powerup') }
            if (e.type === 'slime') {
              // перепрыгнул? (герой в воздухе над слизнем)
              if (s.y > 30) { e.taken = true; addCoinsRef.current(2); const [px, py] = heroPx(); fx.fire('coins', px, py, { n: 3 }) }
            }
            if (e.taken) toRemove.push(e.id)
          }
        }
        const el = entElsRef.current.get(e.id)
        if (el) {
          el.style.left = `${sx.toFixed(2)}vw`
          el.style.bottom = `${92 + e.y}px`
        }
      }
      despawn(toRemove)

      // --- флаг ---
      if (flag) {
        const flagX = ph === 'focus' ? HERO_X + 2 + (1 - p) * 80 : ph === 'break' ? HERO_X + 2 : 108
        flag.style.left = `${flagX.toFixed(2)}vw`
      }
      if (atFlagPhase && !s.flagJumped && s.y === 0) {
        s.flagJumped = true
        s.vy = 860; s.y = 0.001; s.sx = 0.8; s.sy = 1.25
      }
      if (ph === 'focus' && p < 0.9) s.flagJumped = false

      // --- герой: squash/stretch, буст-рост, бег ---
      s.sx += (1 - s.sx) * 14 * dt
      s.sy += (1 - s.sy) * 14 * dt
      const base = boost ? 1.22 : 1
      const running = speed > 0
      const bob = running && s.y === 0 ? Math.abs(Math.sin(s.t * (speed > 8 ? 13 : 9))) * 3.5 : 0
      hero.style.transform = `translate(${HERO_X}vw, ${(-(s.y + bob)).toFixed(2)}px) scale(${(s.sx * base).toFixed(3)}, ${(s.sy * base).toFixed(3)})`
      hero.classList.toggle('hero-star', star)
      if (running !== s.running) {
        s.running = running
        hero.dataset.moving = running ? '1' : '0'
      }
    })
    loop.start()
    return () => loop.stop()
  }, [])

  // хоп на старте фокуса
  useEffect(() => {
    const s = sim.current
    if (phase === 'focus' && s.prevPhase !== 'focus') {
      s.vy = 520; s.y = Math.max(s.y, 0.001); s.sx = 0.85; s.sy = 1.2
    }
    s.prevPhase = phase
  }, [phase])

  const bushes = [30, 84]
  const blocks = [44, 92]
  const per = (x) => [x, x + 100]
  const ents = sim.current.ents

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
      {/* сюжетные сущности */}
      {ents.map((e) => (
        <span
          key={e.id}
          ref={(el) => { if (el) entElsRef.current.set(e.id, el); else entElsRef.current.delete(e.id) }}
          className={`px-ent px-ent-${e.type}`}
        />
      ))}
      <div className="px-flag" ref={flagRef}>
        <span className="flag-ball" />
        <span className="flag-cloth" />
        <span className="flag-pole" />
      </div>
      <div className="px-hero" ref={heroRef}>
        <ColorSprite map={HERO_A} palette={PALETTE} className="hero-f hero-a" />
        <ColorSprite map={HERO_B} palette={PALETTE} className="hero-f hero-b" />
      </div>
      {bubble && (
        <div
          className="scene-bubble px-bubble"
          style={{ left: `${HERO_X - 2}vw`, bottom: '190px', pointerEvents: 'auto' }}
          onClick={() => { appRef.current.likePhrase(bubble.id); setBubble(null) }}
          title="♥"
        >
          {bubble.text}
          <span className="b-heart">{appRef.current.appState.profile.likedPhrases.includes(bubble.id) ? '♥' : '♡'}</span>
        </div>
      )}
      <div className="px-ground" ref={groundRef} />
    </div>
  )
}
