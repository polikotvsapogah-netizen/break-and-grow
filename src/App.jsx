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
import TodayCard from './components/TodayCard.jsx'
import ScenePhrase from './components/ScenePhrase.jsx'

export default function App() {
  const {
    state, t, setSettings, timer, startFocus, pauseToggle,
  } = useApp()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [openPanel, setOpenPanel] = useState(null) // 'goals' | 'music' | 'today' | null
  const lang = state.settings.lang

  // строка цели под таймером открывает панель целей
  React.useEffect(() => {
    const h = () => setOpenPanel('goals')
    window.addEventListener('bag-open-goals', h)
    return () => window.removeEventListener('bag-open-goals', h)
  }, [])

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
          {/* панели — иконками в топбаре, по канону глобальных тумблеров */}
          <button
            className={`lang-btn dock-top ${openPanel === 'goals' ? 'active' : ''}`}
            title={t('goals')}
            onClick={() => setOpenPanel(openPanel === 'goals' ? null : 'goals')}
          >
            🎯
            {state.goals.length > 0 && <b className="dock-count">{state.goals.length}</b>}
          </button>
          <button
            className={`lang-btn dock-top ${openPanel === 'music' ? 'active' : ''}`}
            title={t('music')}
            onClick={() => setOpenPanel(openPanel === 'music' ? null : 'music')}
          >
            🎵
          </button>
          <button
            className={`lang-btn dock-top ${openPanel === 'today' ? 'active' : ''}`}
            title={t('today')}
            onClick={() => setOpenPanel(openPanel === 'today' ? null : 'today')}
          >
            📊
          </button>
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
          <button className="lang-btn" onClick={() => setGuideOpen(true)} title={t('guideTitle')}>
            ?
          </button>
          <button className="gear-btn" onClick={() => setSettingsOpen(true)} title={t('settings')}>
            ⚙️
          </button>
        </div>
      </header>

      <main className="layout">
        <TimerCard />
      </main>

      {/* панели — поповером под топбаром; MusicPanel всегда смонтирована (движки) */}
      <div className="dock-pop">
        <GoalsPanel open={openPanel === 'goals'} />
        <MusicPanel open={openPanel === 'music'} />
        <TodayCard open={openPanel === 'today'} />
      </div>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <BreakOverlay />
      <FxCanvas />
      <ScenePhrase />
      <Onboarding />
      {guideOpen && (
        <div className="overlay" role="dialog" aria-modal="true" onClick={() => setGuideOpen(false)}>
          <div className="overlay-inner guide-inner" onClick={(e) => e.stopPropagation()}>
            <button className="overlay-close" onClick={() => setGuideOpen(false)}>×</button>
            <h1 className="ov-title">💡 {t('guideTitle')}</h1>
            <ul className="guide-list">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <li key={i}>{t(`g${i}`)}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
