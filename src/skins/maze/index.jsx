import React from 'react'
import './maze.css'

export const id = 'maze'
export const labelKey = 'skinMaze'
export const burst = 'dots'

// Пак всегда бежит на аркадной скорости (в фокусе — быстрее через --spd),
// прогресс сессии показывает отдельная светящаяся линия над коридором.
export function Scene({ prog, phase }) {
  const focus = phase === 'focus'
  return (
    <div className="scene scene-maze">
      <div className="mz-walls" />
      {[12, 88].map((x, i) => (
        <span key={i} className="mz-pellet" style={{ left: `${x}vw`, top: i ? '18%' : '64%' }} />
      ))}
      <div className="mz-corridor">
        <div className="mz-progline" style={{ width: `${(focus ? prog * 100 : 0).toFixed(2)}%` }} />
        <div className="mz-dots" />
        <div className="mz-eaten" />
        <div className="mz-pac" />
        {['#ff5d5d', '#ffb8de', '#4dd7ff'].map((c, i) => (
          <div key={i} className="mz-ghost" style={{ '--gc': c, animationDelay: `${i * 0.9}s` }} />
        ))}
      </div>
    </div>
  )
}
