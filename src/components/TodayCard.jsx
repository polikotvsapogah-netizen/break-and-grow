import React from 'react'
import { useApp } from '../store.jsx'

/* Мини-дашборд дня: заполняет правую колонку и даёт ощущение прогресса. */
export default function TodayCard() {
  const { state, t } = useApp()
  const today = new Date().toISOString().slice(0, 10)
  const s = state.stats
  const fresh = s.day === today
  const items = [
    ['🔥', fresh ? s.sessions || 0 : 0, t('statSessions')],
    ['⏱', fresh ? s.focusedMin || 0 : 0, t('statMinutes')],
    ['🪙', s.coins || 0, t('statCoins')],
    ['📏', s.lines || 0, t('statLines')],
  ]
  return (
    <section className="panel today-card">
      <header className="panel-head" style={{ cursor: 'default' }}>
        <h2>📊 {t('today')}</h2>
        {(s.bestMin || 0) > 0 && <span className="today-best">{t('statBest')}: {s.bestMin} {t('minutes')}</span>}
      </header>
      <div className="today-grid">
        {items.map(([ico, val, label]) => (
          <div key={label} className="today-item">
            <span className="ti-ico">{ico}</span>
            <b>{val}</b>
            <span className="ti-label">{label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
