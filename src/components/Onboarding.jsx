import React, { useState } from 'react'
import { useApp } from '../store.jsx'

/* Онбординг в 2 шага: имя → главная цель (можно пропустить).
   Цель сразу включает персональные фразы («ряд закрыт — так же закроется „{цель}“»). */
export default function Onboarding() {
  const { state, t, setUsername, addGoal } = useApp()
  const [name, setName] = useState('')
  const [step, setStep] = useState(1)
  const [gTitle, setGTitle] = useState('')
  const [gWhy, setGWhy] = useState('')
  if (state.profile.username) return null

  const submitName = () => { if (name.trim()) setStep(2) }
  const finish = (withGoal) => {
    if (withGoal && gTitle.trim()) addGoal(gTitle.trim(), gWhy.trim())
    setUsername(name) // закрывает онбординг
  }

  return (
    <div className="overlay onboarding" role="dialog" aria-modal="true">
      <div className="overlay-inner ob-inner">
        <div className="ob-mark">◗</div>
        {step === 1 ? (
          <>
            <h1 className="ov-title">{t('welcomeTitle')}</h1>
            <p className="ob-text">{t('welcomeText')}</p>
            <div className="ob-form">
              <input
                autoFocus
                value={name}
                maxLength={24}
                placeholder={t('namePh')}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitName()}
              />
              <button className="btn-primary" onClick={submitName} disabled={!name.trim()}>
                → {t('next')}
              </button>
            </div>
          </>
        ) : (
          <>
            <h1 className="ov-title">{t('obGoalQ').replace('{name}', name.trim())}</h1>
            <p className="ob-text">{t('obGoalHint')}</p>
            <div className="ob-form">
              <input
                autoFocus
                value={gTitle}
                placeholder={t('goalTitlePh')}
                onChange={(e) => setGTitle(e.target.value)}
              />
              <input
                value={gWhy}
                placeholder={t('goalWhyPh')}
                onChange={(e) => setGWhy(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && gTitle.trim() && finish(true)}
              />
              <button className="btn-primary" onClick={() => finish(true)} disabled={!gTitle.trim()}>
                ▶ {t('letsGo')}
              </button>
              <button className="ob-skip" onClick={() => finish(false)}>{t('obLater')}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
