import React, { useEffect, useRef, useState } from 'react'
import { useApp } from '../store.jsx'
import { getPhrase } from '../motivation.js'
import Phrase from './Phrase.jsx'

/* Амбиент-фразы во ВСЕХ темах (кроме pixel/blocks — у них свои носители:
   пузырь героя и линия тетриса). Стиль баннера — от скина,
   в «Терминале» фраза ПЕЧАТАЕТСЯ с курсором. */
const OWN_CARRIER = ['pixel', 'blocks']

export default function ScenePhrase() {
  const { state, timer } = useApp()
  const skin = state.settings.skin || 'classic'
  const [ph, setPh] = useState(null)
  const [shown, setShown] = useState('')
  const live = useRef(state)
  live.current = state

  useEffect(() => {
    if (OWN_CARRIER.includes(skin)) { setPh(null); return undefined }
    if (timer.phase !== 'focus') { setPh(null); return undefined }
    let dead = false
    let hideT = null
    let nextT = null
    const show = () => {
      if (dead) return
      const s = live.current
      const goal = s.goals.find((g) => g.id === s.currentGoalId)
      const p = getPhrase('ambient', {
        lang: s.settings.lang, name: s.profile.username, goal, liked: s.profile.likedPhrases,
      })
      setPh(p)
      hideT = setTimeout(() => setPh(null), 13000)
      nextT = setTimeout(show, 150000 + Math.random() * 40000) // ~каждые 2.5–3 мин
    }
    nextT = setTimeout(show, 25000) // первая — через 25с фокуса
    return () => { dead = true; clearTimeout(hideT); clearTimeout(nextT); setPh(null) }
  }, [skin, timer.phase])

  // печатная машинка для терминала
  useEffect(() => {
    if (!ph) { setShown(''); return undefined }
    if (skin !== 'terminal') { setShown(ph.text); return undefined }
    let i = 0
    const id = setInterval(() => {
      i += 1
      setShown(ph.text.slice(0, i))
      if (i >= ph.text.length) clearInterval(id)
    }, 26)
    return () => clearInterval(id)
  }, [ph, skin])

  if (!ph || OWN_CARRIER.includes(skin)) return null
  return (
    <div className={`scene-phrase sp-${skin}`}>
      <Phrase phrase={{ ...ph, text: shown || '…' }} />
    </div>
  )
}
