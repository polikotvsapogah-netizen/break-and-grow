import React from 'react'
import './synth.css'

export const id = 'synth'
export const labelKey = 'skinSynth'
export const burst = 'bars'

export function Scene({ prog, phase }) {
  const focus = phase === 'focus'
  return (
    <div className="scene scene-synth">
      <div className="sy-stars" />
      <div className="sy-sun-wrap" style={{ bottom: `${40 + (focus ? prog * 9 : 0)}%` }}>
        <div className="sy-sun" />
      </div>
      <div className="sy-mountains" />
      <div className="sy-grid" style={focus ? { animationDuration: `${(1.4 - prog * 0.85).toFixed(2)}s` } : undefined} />
      <div className="sy-glow" />
    </div>
  )
}
