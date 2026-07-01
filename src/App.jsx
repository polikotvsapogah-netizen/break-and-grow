import React, { useState } from 'react'
import { useApp } from './store.jsx'
import BackgroundLayer from './components/BackgroundLayer.jsx'
import TimerCard from './components/TimerCard.jsx'
import GoalsPanel from './components/GoalsPanel.jsx'
import MusicPanel from './components/MusicPanel.jsx'
import BreakOverlay from './components/BreakOverlay.jsx'
import SettingsPanel from './components/SettingsPanel.jsx'
import FxCanvas from './game/FxCanvas.jsx'

export default function App() {
  const { state, t, setSettings } = useApp()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const lang = state.settings.lang

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
          <button
            className="lang-btn"
            onClick={() => setSettings({ lang: lang === 'ru' ? 'en' : 'ru' })}
            title={t('language')}
          >
            {lang === 'ru' ? 'RU' : 'EN'}
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
    </div>
  )
}
