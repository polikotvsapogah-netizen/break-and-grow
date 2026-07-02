import React, { useEffect, useState } from 'react'
import { useApp } from '../store.jsx'

export default function GoalsPanel({ open }) {
  const { state, t, addGoal, delGoal, setCurrentGoal } = useApp()
  const [title, setTitle] = useState('')
  const [why, setWhy] = useState('')
  useEffect(() => {}, []) // (управляется доком в App)
  if (!open) return null

  const submit = () => {
    if (!title.trim()) return
    addGoal(title.trim(), why.trim())
    setTitle('')
    setWhy('')
  }

  return (
    <section className="panel goals-panel dock-panel">
      {(
        <div className="panel-body" style={{ paddingTop: 16 }}>
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
