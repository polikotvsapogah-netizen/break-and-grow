import React, { useState } from 'react'
import { useApp } from './store.jsx'
import BackgroundLayer from './components/BackgroundLayer.jsx'
import TimerCard from './components/TimerCard.jsx'
import GoalsPanel from './components/GoalsPanel.jsx'
import MusicPanel from './components/MusicPanel.jsx'
import BreakOverlay from './components/BreakOverlay.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import FxCanvas from './game/FxCanvas.jsx'
import Onboarding from './components/Onboarding.jsx'

export default function App() {
  const {
    state, t, setSettings, timer, startFocus, pauseToggle,
  } = useApp()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const lang = state.settings.lang

  // Пробел = старт/пауза (пропускаем, когда фокус в полях ввода)
  React.useEffect(() => {
    const h = (e) => {
      if (e.code !== 'Space') return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      e.preventDefault()
      if (timer.phase === 'idle') startFocus()
      else pauseToggle()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [timer.phase, startFocus, pauseToggle])

  return (
    <div className="app">
      <BackgroundLayer />

      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">◗</span>
          <span className="brand-name">{t('appName')}</span>
          <span className="brand-tag">{t('tagline')}</span>
        </div>
        <div className="topbar-actions">
          {/* быстрый мьют, не залезая в настройки */}
          <button
            className="lang-btn"
            onClick={() => setSettings({ sound: !state.settings.sound })}
            title={t('soundOn')}
          >
            {state.settings.sound ? '🔊' : '🔇'}
          </button>
          {/* кнопка показывает ЦЕЛЕВОЙ язык (что получишь по клику) */}
          <button
            className="lang-btn"
            onClick={() => setSettings({ lang: lang === 'ru' ? 'en' : 'ru' })}
            title={t('language')}
          >
            {lang === 'ru' ? 'EN' : 'RU'}
          </button>
          <button className="gear-btn" onClick={() => setSettingsOpen(true)} title={t('settings')}>
            ⚙️
          </button>
        </div>
      </header>

      <main className="layout">
        <TimerCard />
        <div className="side-panels">
          <GoalsPanel />
          <MusicPanel />
        </div>
      </main>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <BreakOverlay />
      <FxCanvas />
      <Onboarding />
    </div>
  )
}
