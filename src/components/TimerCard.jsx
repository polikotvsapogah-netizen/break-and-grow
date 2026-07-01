import React, { useRef, useState } from 'react'
import { useApp, fmtTime } from '../store.jsx'
import SkinHUD from './SkinHUD.jsx'

const PRESETS = [15, 25, 45, 60, 90]
const MODES = ['goals', 'exercise', 'yoga']
const MODE_ICONS = { goals: '🎯', exercise: '⚡', yoga: '🧘' }
const RING_R = 150
const RING_C = 2 * Math.PI * RING_R

export default function TimerCard() {
  const {
    state, t, timer, startFocus, pauseToggle, resetTimer, adjustMinutes, setSettings,
  } = useApp()
  const { settings } = state
  const [custom, setCustom] = useState('')
  const [flash, setFlash] = useState(null) // 'ready' | 'go'
  const flashTimers = useRef([])

  const running = timer.phase !== 'idle'
  const displayMs = running ? timer.remainMs : settings.focusMin * 60000
  const goal = state.goals.find((g) => g.id === state.currentGoalId)
  const prog = running && timer.totalMs > 0
    ? Math.min(1, Math.max(0, 1 - timer.remainMs / timer.totalMs))
    : 0

  const launch = () => {
    // READY? → GO! → старт
    flashTimers.current.forEach(clearTimeout)
    setFlash('ready')
    flashTimers.current = [
      setTimeout(() => setFlash('go'), 750),
      setTimeout(() => setFlash(null), 1450),
      setTimeout(() => startFocus(), 780),
    ]
  }

  const applyCustom = () => {
    const n = parseInt(custom, 10)
    if (!Number.isNaN(n) && n >= 1 && n <= 240) {
      if (running) {
        adjustMinutes(n - Math.ceil(timer.remainMs / 60000))
      } else {
        setSettings({ focusMin: n })
      }
      setCustom('')
    }
  }

  return (
    <section className={`timer-card ${running ? `phase-${timer.phase}` : ''}`}>
      <SkinHUD />

      {/* Режимы */}
      <div className="mode-row" role="tablist" aria-label="mode">
        {MODES.map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={settings.mode === m}
            className={`mode-pill ${settings.mode === m ? 'active' : ''}`}
            onClick={() => setSettings({ mode: m })}
          >
            <span className="mode-ico">{MODE_ICONS[m]}</span>
            {t(m === 'goals' ? 'modeGoals' : m === 'exercise' ? 'modeExercise' : 'modeYoga')}
          </button>
        ))}
      </div>
      <p className="mode-hint">
        {t(settings.mode === 'goals' ? 'modeHintGoals' : settings.mode === 'exercise' ? 'modeHintExercise' : 'modeHintYoga')}
      </p>

      {/* Циферблат с кольцом прогресса */}
      <div className="clock-wrap">
        <svg className="prog-ring" viewBox="0 0 320 320" aria-hidden="true">
          <circle className="ring-bg" cx="160" cy="160" r={RING_R} />
          <circle
            className="ring-fg"
            cx="160" cy="160" r={RING_R}
            style={{ strokeDasharray: RING_C, strokeDashoffset: RING_C * (1 - prog) }}
          />
        </svg>
        <div className={`clock ${timer.paused ? 'paused' : ''}`}>
          <span className="clock-digits">{fmtTime(displayMs)}</span>
          {running && (
            <span className="clock-phase">
              {timer.phase === 'focus' ? `${t('focusRunning')} · ${t('untilBreak')}` : `${t('breakRunning')} · ${t('untilFocus')}`}
            </span>
          )}
        </div>
      </div>

      {/* Пиксельный прогресс-бар (для скинов без кольца) */}
      <div className="prog-bar" aria-hidden="true">
        <span className="prog-fill" style={{ width: `${prog * 100}%` }} />
      </div>

      {/* Минуты на лету */}
      <div className="chips-row">
        {!running && PRESETS.map((p) => (
          <button
            key={p}
            className={`chip ${settings.focusMin === p ? 'active' : ''}`}
            onClick={() => setSettings({ focusMin: p })}
          >
            {p} {t('minutes')}
          </button>
        ))}
        {running && (
          <>
            <button className="chip" onClick={() => adjustMinutes(-5)}>−5 {t('minutes')}</button>
            <button className="chip" onClick={() => adjustMinutes(5)}>+5 {t('minutes')}</button>
          </>
        )}
        <span className="chip chip-input">
          <input
            type="number"
            min="1"
            max="240"
            placeholder={t('customMin')}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyCustom()}
          />
          {custom && <button className="chip-ok" onClick={applyCustom}>✓</button>}
        </span>
      </div>

      {/* Управление */}
      <div className="controls-row">
        {!running && !flash && (
          <button className="btn-primary" onClick={launch}>
            ▶ {t('start')}
          </button>
        )}
        {running && (
          <>
            <button className="btn-primary" onClick={pauseToggle}>
              {timer.paused ? `▶ ${t('resume')}` : `⏸ ${t('pause')}`}
            </button>
            <button className="btn-ghost" onClick={resetTimer}>{t('reset')}</button>
          </>
        )}
      </div>

      {/* Текущая цель под таймером */}
      {goal && (
        <div className="current-goal">
          <span className="cg-label">{t('currentGoal')}:</span> {goal.title}
          {goal.why && <span className="cg-why"> — {goal.why}</span>}
        </div>
      )}

      {/* Мини-статистика дня (классика; в скинах её заменяет HUD) */}
      {state.stats.day === new Date().toISOString().slice(0, 10) && state.stats.sessions > 0 && (
        <div className="day-stats">
          🔥 {state.stats.sessions} {t('sessions')} · {state.stats.focusedMin} {t('minutes')} {t('todayFocus')}
        </div>
      )}

      {/* READY? → GO! */}
      {flash && (
        <div className={`ready-go rg-${flash}`} aria-hidden="true">
          {flash === 'ready' ? 'READY?' : 'GO!'}
        </div>
      )}
    </section>
  )
}
