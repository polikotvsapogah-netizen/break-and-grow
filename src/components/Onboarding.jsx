import React, { useState } from 'react'
import { useApp } from '../store.jsx'

/* Первый вход: спрашиваем имя. Это ключ профиля предпочтений
   (лайкнутые фразы, цели) — базис будущей персонализации нейронкой. */
export default function Onboarding() {
  const { state, t, setUsername } = useApp()
  const [name, setName] = useState('')
  if (state.profile.username) return null

  const submit = () => { if (name.trim()) setUsername(name) }

  return (
    <div className="overlay onboarding" role="dialog" aria-modal="true">
      <div className="overlay-inner ob-inner">
        <div className="ob-mark">◗</div>
        <h1 className="ov-title">{t('welcomeTitle')}</h1>
        <p className="ob-text">{t('welcomeText')}</p>
        <div className="ob-form">
          <input
            autoFocus
            value={name}
            maxLength={24}
            placeholder={t('namePh')}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
          <button className="btn-primary" onClick={submit} disabled={!name.trim()}>
            ▶ {t('letsGo')}
          </button>
        </div>
      </div>
    </div>
  )
}
