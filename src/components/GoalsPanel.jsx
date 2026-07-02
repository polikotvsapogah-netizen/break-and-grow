import React, { useEffect, useState } from 'react'
import { useApp } from '../store.jsx'

export default function GoalsPanel() {
  const { state, t, addGoal, delGoal, setCurrentGoal } = useApp()
  const [title, setTitle] = useState('')
  const [why, setWhy] = useState('')
  const [open, setOpen] = useState(false) // минимализм: свёрнута, разворачивается кликом

  // клик по строке цели под таймером раскрывает панель
  useEffect(() => {
    const h = () => setOpen(true)
    window.addEventListener('bag-open-goals', h)
    return () => window.removeEventListener('bag-open-goals', h)
  }, [])

  const submit = () => {
    if (!title.trim()) return
    addGoal(title.trim(), why.trim())
    setTitle('')
    setWhy('')
  }

  return (
    <section className={`panel goals-panel ${open ? '' : 'collapsed'}`}>
      <header className="panel-head" onClick={() => setOpen(!open)}>
        <h2>🎯 {t('goals')}</h2>
        <span className="head-meta">
          {state.goals.length > 0 && <span className="head-badge">{state.goals.length}</span>}
          <span className="panel-toggle">{open ? '−' : '+'}</span>
        </span>
      </header>

      {open && (
        <div className="panel-body">
          {state.goals.length === 0 && <p className="empty-hint">{t('noGoals')}</p>}

          <ul className="goal-list">
            {state.goals.map((g) => (
              <li key={g.id} className={`goal-item ${g.id === state.currentGoalId ? 'current' : ''}`}>
                <button
                  className="goal-pick"
                  title={t('makeCurrent')}
                  onClick={() => setCurrentGoal(g.id)}
                >
                  {g.id === state.currentGoalId ? '★' : '☆'}
                </button>
                <div className="goal-text">
                  <span className="goal-title">{g.title}</span>
                  {g.why && <span className="goal-why">{t('why')}: {g.why}</span>}
                </div>
                <button className="goal-del" title={t('remove')} onClick={() => delGoal(g.id)}>×</button>
              </li>
            ))}
          </ul>

          <div className="goal-form">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('goalTitlePh')}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
            <input
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder={t('goalWhyPh')}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
            <button className="btn-small" onClick={submit}>+ {t('addGoal')}</button>
          </div>
        </div>
      )}
    </section>
  )
}
