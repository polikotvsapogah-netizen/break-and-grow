import React, { useEffect, useState } from 'react'
import { useApp } from '../store.jsx'
import { getMedia } from '../db.js'
import { parseYouTubeId } from '../yt.js'
import SkinScene from './SkinScene.jsx'

// Пресеты анимированных градиентов (классы в styles.css)
export const GRADIENTS = ['aurora', 'sunset', 'ocean', 'forest', 'mono']

export default function BackgroundLayer() {
  const { state } = useApp()
  const { bg, dim, skin } = state.settings
  const gameSkin = skin && skin !== 'classic'
  // Дефолтный фон: сцена скина либо градиент
  const fallback = gameSkin ? <SkinScene skin={skin} /> : <div className="bg-gradient grad-aurora" />
  const [videoUrl, setVideoUrl] = useState(null)

  // Своё видео из IndexedDB
  useEffect(() => {
    let url = null
    let cancelled = false
    if (bg.type === 'video' && bg.hasVideo) {
      getMedia('bg-video').then((blob) => {
        if (blob && !cancelled) {
          url = URL.createObjectURL(blob)
          setVideoUrl(url)
        }
      })
    } else {
      setVideoUrl(null)
    }
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [bg.type, bg.hasVideo])

  const ytId = bg.type === 'youtube' ? parseYouTubeId(bg.ytUrl) : null

  return (
    <div className="bg-layer" aria-hidden="true">
      {bg.type === 'gradient' && (gameSkin ? <SkinScene skin={skin} /> : <div className={`bg-gradient grad-${bg.gradient}`} />)}

      {bg.type === 'video' && videoUrl && (
        <video className="bg-video" src={videoUrl} autoPlay muted loop playsInline />
      )}
      {bg.type === 'video' && !videoUrl && fallback}

      {bg.type === 'youtube' && ytId && (
        <div className="bg-yt-wrap">
          <iframe
            className="bg-yt"
            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&playsinline=1`}
            title="background"
            allow="autoplay; encrypted-media"
            frameBorder="0"
          />
        </div>
      )}
      {bg.type === 'youtube' && !ytId && fallback}

      <div className="bg-dim" style={{ opacity: dim }} />
    </div>
  )
}
