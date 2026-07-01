import React from 'react'
import { useApp, fmtTime } from '../store.jsx'

/* Игровой HUD над таймером — узнаваемый язык каждой аркады.
   Метафоры: фокус-минуты → SCORE, сессии → монеты/уровни/жизни.
   Стили HUD живут в css соответствующего скина (src/skins/<имя>/). */

const pad = (n, l) => String(Math.max(0, Math.floor(n))).padStart(l, '0')

export default function SkinHUD() {
  const { state, timer, t } = useApp()
  const { skin, focusMin } = state.settings
  if (!skin || skin === 'classic') return null

  const s = state.stats
  const score = pad((s.focusedMin || 0) * 100, 6)
  const hi = pad(Math.max((s.bestMin || 0) * 100, (s.focusedMin || 0) * 100), 6)
  const running = timer.phase !== 'idle'
  const timeMs = running ? timer.remainMs : focusMin * 60000
  const prog = running && timer.totalMs > 0 ? 1 - timer.remainMs / timer.totalMs : 0

  if (skin === 'pixel') {
    // «до флага»: осталось монет = оставшиеся минуты × 10 (25 мин → 250)
    const toFlag = Math.max(0, Math.ceil((timeMs / 60000) * 10))
    return (
      <div className="skin-hud hud-pixel">
        <span className="hud-item">SCORE<b>{score}</b></span>
        <span className="hud-item hud-coin"><i className="coin-ico" />×{pad(s.coins || 0, 2)}</span>
        <span className="hud-item">WORLD<b>1-{((s.sessions || 0) % 3) + 1}</b></span>
        <span className="hud-item" title={t('toFlagHint')}>🚩<b>×{pad(toFlag, 3)}</b></span>
      </div>
    )
  }

  if (skin === 'maze') {
    return (
      <div className="skin-hud hud-maze">
        <span className="hud-item">1UP<b>{score}</b></span>
        <span className="hud-item">HIGH SCORE<b>{hi}</b></span>
        <span className="hud-item hud-lives">
          {Array.from({ length: Math.min(3, (s.sessions || 0) + 1) }).map((_, i) => (
            <i key={i} className="pac-ico" />
          ))}
        </span>
      </div>
    )
  }

  if (skin === 'blocks') {
    return (
      <div className="skin-hud hud-blocks">
        <span className="hud-item">SCORE<b>{score}</b></span>
        <span className="hud-item">LEVEL<b>{pad(s.sessions || 0, 2)}</b></span>
        <span className="hud-item">LINES<b>{pad(s.lines || 0, 3)}</b></span>
      </div>
    )
  }

  if (skin === 'invaders') {
    return (
      <div className="skin-hud hud-invaders">
        <span className="hud-item">{'SCORE<1>'}<b>{score}</b></span>
        <span className="hud-item">HI-SCORE<b>{hi}</b></span>
        <span className="hud-item hud-ships">
          {Array.from({ length: Math.min(3, (s.sessions || 0) + 1) }).map((_, i) => (
            <i key={i} className="ship-ico" />
          ))}
        </span>
      </div>
    )
  }

  if (skin === 'synth') {
    return (
      <div className="skin-hud hud-synth">
        <span className="hud-item">SPD<b>{88 + Math.round(prog * 111)}<em> MPH</em></b></span>
        <span className="hud-item">DIST<b>{pad(s.focusedMin || 0, 4)}<em> KM</em></b></span>
        <span className="hud-item">STAGE<b>{pad((s.sessions || 0) + 1, 2)}</b></span>
      </div>
    )
  }

  return null
}
