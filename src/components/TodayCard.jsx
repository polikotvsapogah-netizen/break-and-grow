import React from 'react'
import { useApp } from '../store.jsx'

/* Мини-дашборд дня: сессии/минуты — за сегодня (сбрасываются в полночь),
   монеты/линии — накопительные. Чистая типографика, шрифт и акцент — от темы. */
export default function TodayCard() {
  const { state, t } = useApp()
  const today = new Date().toISOString().slice(0, 10)
  const s = state.stats
  const fresh = s.day === today
  const items = [
    [fresh ? s.sessions || 0 : 0, t('statSessions')],
    [fresh ? s.focusedMin || 0 : 0, t('statMinutes')],
    [s.coins || 0, t('statCoins')],
    [s.lines || 0, t('statLines')],
  ]
  return (
    <section className="panel today-card">
      <header className="panel-head" style={{ cursor: 'default' }}>
        <h2>{t('today')}</h2>
        {(s.bestMin || 0) > 0 && <span className="today-best">{t('statBest')} · {s.bestMin} {t('minutes')}</span>}
      </header>
      <div className="today-grid">
        {items.map(([val, label]) => (
          <div key={label} className="today-item">
            <b>{val}</b>
            <span className="ti-label">{label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
