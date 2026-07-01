import React from 'react'
import './maze.css'

export const id = 'maze'
export const labelKey = 'skinMaze'
export const burst = 'dots'

export function Scene({ prog, phase }) {
  const focus = phase === 'focus'
  const pacStyle = focus
    ? { left: `${(prog * 96).toFixed(2)}vw`, animation: 'chomp 0.32s steps(1) infinite' }
    : undefined
  const eatenStyle = focus
    ? { width: `${(prog * 96 + 2).toFixed(2)}vw`, animation: 'none' }
    : undefined
  return (
    <div className={`scene scene-maze ${focus ? 'progress' : ''}`}>
      <div className="mz-walls" />
      {[12, 88].map((x, i) => (
        <span key={i} className="mz-pellet" style={{ left: `${x}vw`, top: i ? '18%' : '64%' }} />
      ))}
      <div className="mz-corridor">
        <div className="mz-dots" />
        <div className="mz-eaten" style={eatenStyle} />
        <div className="mz-pac" style={pacStyle} />
        {['#ff5d5d', '#ffb8de', '#4dd7ff'].map((c, i) => (
          <div
            key={i}
            className="mz-ghost"
            style={focus
              ? { '--gc': c, left: `${Math.max(-8, prog * 96 - 12 - i * 9).toFixed(2)}vw`, animation: 'ghostBob 0.5s ease-in-out infinite alternate' }
              : { '--gc': c, animationDelay: `${i * 0.9}s` }}
          />
        ))}
      </div>
    </div>
  )
}
