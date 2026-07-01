import React from 'react'
import { useApp } from '../store.jsx'
import { SKIN_MODULES } from '../skins/index.js'

// Тонкий диспетчер: выбирает модуль скина и передаёт прогресс/фазу таймера.
export default function SkinScene({ skin }) {
  const { timer } = useApp()
  const mod = SKIN_MODULES[skin]
  if (!mod) return null
  const prog = timer.phase !== 'idle' && timer.totalMs > 0
    ? Math.min(1, Math.max(0, 1 - timer.remainMs / timer.totalMs))
    : 0
  const S = mod.Scene
  return <S prog={prog} phase={timer.phase} />
}
