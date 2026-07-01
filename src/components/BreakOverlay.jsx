import React, { useEffect, useMemo, useState } from 'react'
import { useApp, fmtTime } from '../store.jsx'
import { exercises, yoga, affirmations, pickRandom } from '../content.js'
import { fx } from '../game/fx.js'
import { burstFor } from '../skins/index.js'

export default function BreakOverlay() {
  const {
    state, t, timer, startBreak, skipBreak, closeOverlay, startFocus,
  } = useApp()
  const { settings } = state
  const [seed, setSeed] = useState(0) // «Ещё вариант»

  const lang = settings.lang
  const goal = state.goals.find((g) => g.id === state.currentGoalId)

  const routine = useMemo(() => {
    if (settings.mode === 'exercise') return pickRandom(exercises[lang] || exercises.ru, 4)
    if (settings.mode === 'yoga') return pickRandom(yoga[lang] || yoga.ru, 3)
    return []
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.mode, lang, seed, timer.overlayKind])

  const phrase = useMemo(() => {
    const list = affirmations[lang] || affirmations.ru
    return list[Math.floor(Math.random() * list.length)]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, timer.overlayKind, seed])

  // Canvas-салют с баллистикой при появлении оверлея завершённой сессии
  const celebrate = timer.overlay && timer.overlayKind !== 'done'
  useEffect(() => {
    if (!celebrate || typeof window === 'undefined') return
    let accent = ''
    try { accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() } catch { /* ок */ }
    fx.fire(
      settings.skin && settings.skin !== 'classic' ? burstFor(settings.skin) : 'confetti',
      window.innerWidth / 2,
      window.innerHeight * 0.38,
      { color: accent },
    )
  }, [celebrate, settings.skin])

  if (!timer.overlay) return null

  const isBreakRunning = timer.phase === 'break'
  const isDone = timer.overlayKind === 'done'
  const isOffer = timer.overlayKind === 'break-offer'

  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="overlay-inner">
        {!isDone && ['pixel', 'invaders', 'maze', 'blocks'].includes(settings.skin) && (
          <span className="fx-plus" aria-hidden="true">+1</span>
        )}
        <button className="overlay-close" onClick={closeOverlay} title={t('close')}>×</button>

        {/* Перерыв окончен */}
        {isDone && (
          <>
            <h1 className="ov-title">✅ {t('breakDone')}</h1>
            <p className="ov-phrase">{phrase}</p>
            <div className="ov-actions">
              <button className="btn-primary" onClick={() => startFocus()}>▶ {t('backToFocus')}</button>
            </div>
          </>
        )}

        {/* Фокус завершён → контент по режиму */}
        {!isDone && (
          <>
            <p className="ov-kicker">{t('sessionDone')} · {t('timeToRecharge')}</p>

            {isBreakRunning && (
              <div className="ov-countdown">{fmtTime(timer.remainMs)}</div>
            )}

            {settings.mode === 'goals' && (
              <div className="ov-goals">
                <h1 className="ov-title">🎯 {t('rememberWhy')}</h1>
                {goal ? (
                  <div className="ov-goal-main">
                    <div className="ov-goal-title">{goal.title}</div>
                    {goal.why && <div className="ov-goal-why">«{goal.why}»</div>}
                  </div>
                ) : (
                  <p className="ov-phrase">{t('noGoals')}</p>
                )}
                {state.goals.length > 1 && (
                  <div className="ov-goal-list">
                    <span className="ov-sub">{t('yourGoals')}</span>
                    {state.goals.filter((g) => g.id !== state.currentGoalId).slice(0, 4).map((g) => (
                      <span key={g.id} className="ov-goal-chip">{g.title}</span>
                    ))}
                  </div>
                )}
                <p className="ov-phrase">{phrase}</p>
              </div>
            )}

            {(settings.mode === 'exercise' || settings.mode === 'yoga') && (
              <div className="ov-routine">
                <h1 className="ov-title">
                  {settings.mode === 'exercise' ? `⚡ ${t('exerciseTitle')}` : `🧘 ${t('yogaTitle')}`}
                </h1>
                <ol className="routine-list">
                  {routine.map((r, i) => (
                    <li key={i} style={{ animationDelay: `${i * 0.12}s` }}>
                      <span className="r-name">{r.name}</span>
                      <span className="r-detail">{r.detail}</span>
                    </li>
                  ))}
                </ol>
                {settings.mode === 'yoga' && <p className="ov-breathe">{t('breathe')}</p>}
                <button className="btn-ghost btn-shuffle" onClick={() => setSeed((s) => s + 1)}>
                  ↻ {t('nextExercise')}
                </button>
              </div>
            )}

            <div className="ov-actions">
              {isOffer && (
                <button className="btn-primary" onClick={startBreak}>
                  ☕ {t('startBreak')} · {settings.breakMin[settings.mode]} {t('minutes')}
                </button>
              )}
              <button className="btn-ghost" onClick={skipBreak}>⏩ {t('skipBreak')}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
