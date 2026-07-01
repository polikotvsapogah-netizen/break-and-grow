import React, { useEffect, useRef } from 'react'
import { PixelSprite } from '../../game/sprites.jsx'
import { fx } from '../../game/fx.js'
import './invaders.css'

export const id = 'invaders'
export const labelKey = 'skinInvaders'
export const burst = 'bits'

// Свой пришелец (11×8), две фазы «ножек»
const ALIEN_A = [
  '00100000100', '00010001000', '00111111100', '01101110110',
  '11111111111', '10111111101', '10100000101', '00011011000',
]
const ALIEN_B = [
  '00100000100', '10010001001', '10111111101', '11101110111',
  '11111111111', '01111111110', '00100000100', '01000000010',
]
const SHIP = [
  '0000001000000', '0000011100000', '0000011100000', '0111111111110',
  '1111111111111', '1111111111111', '1101101101101',
]

export function Scene({ prog, phase }) {
  const fleet = []
  for (let r = 0; r < 3; r += 1) for (let c = 0; c < 6; c += 1) fleet.push({ r, c })
  const cols = ['#9ef01a', '#4dd7ff', '#ff5d8f']
  const dead = phase === 'focus' ? Math.min(17, Math.floor(prog * 18)) : 0
  const prevDead = useRef(0)

  // Каждый новый «сбитый» — взрыв частиц в его координатах
  useEffect(() => {
    if (dead > prevDead.current) {
      try {
        const els = document.querySelectorAll('.in-alien.dead')
        const el = els[els.length - 1]
        if (el) {
          const r = el.getBoundingClientRect()
          fx.fire('bits', r.left + r.width / 2, r.top + r.height / 2)
        }
      } catch { /* среда без DOM-метрик */ }
    }
    prevDead.current = dead
  }, [dead])

  return (
    <div className="scene scene-invaders">
      <div className="in-stars s1" />
      <div className="in-stars s2" />
      <div className="in-fleet">
        {fleet.map(({ r, c }, i) => (
          <div
            key={i}
            className={`in-alien ${i >= fleet.length - dead ? 'dead' : ''}`}
            style={{ left: c * 64, top: r * 52, '--blink': `${(i % 5) * 0.2}s` }}
          >
            <PixelSprite map={ALIEN_A} size={3} color={cols[r]} className="al-f al-a" />
            <PixelSprite map={ALIEN_B} size={3} color={cols[r]} className="al-f al-b" />
          </div>
        ))}
      </div>
      <div className="in-ship">
        <PixelSprite map={SHIP} size={3} color="#9ef01a" />
        <span className="in-laser" />
      </div>
      <div className="in-scanlines" />
    </div>
  )
}
