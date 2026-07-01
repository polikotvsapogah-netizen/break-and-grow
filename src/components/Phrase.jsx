import React, { useState } from 'react'
import { useApp } from '../store.jsx'

/* Кликабельная мотивационная фраза: клик = лайк = сигнал предпочтений
   (в будущем — фид для нейронки). */
export default function Phrase({ phrase, className = '' }) {
  const { state, t, likePhrase } = useApp()
  const [justLiked, setJustLiked] = useState(false)
  if (!phrase) return null
  const liked = state.profile.likedPhrases.includes(phrase.id)

  return (
    <button
      type="button"
      className={`phrase ${liked ? 'is-liked' : ''} ${justLiked ? 'pop' : ''} ${className}`}
      title={liked ? t('liked') : t('likeHint')}
      onClick={() => {
        if (!liked) {
          likePhrase(phrase.id)
          setJustLiked(true)
          setTimeout(() => setJustLiked(false), 700)
        }
      }}
    >
      <span className="phrase-text">«{phrase.text}»</span>
      <span className="phrase-heart" aria-hidden="true">{liked ? '♥' : '♡'}</span>
    </button>
  )
}
