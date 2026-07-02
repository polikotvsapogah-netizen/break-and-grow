import React, { useEffect, useRef, useState } from 'react'
import { useApp, secToMmss, mmssToSec } from '../store.jsx'
import { getMedia } from '../db.js'
import { parseYouTubeId, loadYouTubeApi } from '../yt.js'
import { chiptune } from '../game/chiptune.js'

const SOURCES = ['none', 'game', 'local', 'youtube', 'spotify']

export default function MusicPanel({ open }) {
  const {
    state, t, timer, setMusic, addTracks, updateTrack, delTrack,
  } = useApp()
  const { music, settings } = state
  // всегда смонтирована (аудио-движки живут здесь), UI показывается доком
  const [playing, setPlaying] = useState(false)
  const [ytInput, setYtInput] = useState(music.ytUrl)

  const audioRef = useRef(null)
  const urlCache = useRef({}) // id -> objectURL
  const ytPlayerRef = useRef(null)
  const ytHostRef = useRef(null)
  const activeTrack = music.tracks.find((tr) => tr.id === music.activeId)

  // ---------- ЛОКАЛЬНЫЕ ТРЕКИ ----------
  async function urlFor(id) {
    if (urlCache.current[id]) return urlCache.current[id]
    const blob = await getMedia(`track-${id}`)
    if (!blob) return null
    const url = URL.createObjectURL(blob)
    urlCache.current[id] = url
    return url
  }

  async function playLocal() {
    if (!activeTrack) return
    const url = await urlFor(activeTrack.id)
    if (!url) return
    const a = audioRef.current
    if (a.dataset.trackId !== activeTrack.id) {
      a.src = url
      a.dataset.trackId = activeTrack.id
    }
    a.currentTime = activeTrack.start || 0
    a.volume = music.volume
    await a.play().catch(() => {})
    setPlaying(true)
  }

  function stopLocal() {
    const a = audioRef.current
    if (a) a.pause()
    setPlaying(false)
  }

  // Луп отрезка A–B
  useEffect(() => {
    const a = audioRef.current
    if (!a) return undefined
    const onTime = () => {
      const tr = state.music.tracks.find((x) => x.id === state.music.activeId)
      if (!tr) return
      const end = tr.end > 0 ? tr.end : a.duration
      if (end && a.currentTime >= end - 0.05) {
        a.currentTime = tr.start || 0
        a.play().catch(() => {})
      }
    }
    const onEnded = () => {
      const tr = state.music.tracks.find((x) => x.id === state.music.activeId)
      a.currentTime = tr?.start || 0
      a.play().catch(() => {})
    }
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('ended', onEnded)
    return () => {
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('ended', onEnded)
    }
  }, [state.music.tracks, state.music.activeId])

  // Громкость на лету + глобальный мьют (🔇 в топбаре глушит и музыку)
  useEffect(() => {
    const vol = settings.sound ? music.volume : 0
    if (audioRef.current) audioRef.current.volume = vol
    ytPlayerRef.current?.setVolume?.(Math.round(vol * 100))
    chiptune.setVolume(vol)
  }, [music.volume, settings.sound])

  // смена источника → глушим чиптюн
  useEffect(() => {
    if (music.source !== 'game') { chiptune.stop(); setPlaying(false) }
    return () => chiptune.stop()
  }, [music.source])

  // ---------- YOUTUBE ----------
  // ref на актуальный state для поллинга (границы отрезка меняются на лету)
  const liveState = useRef(state)
  useEffect(() => { liveState.current = state }, [state])

  const ytId = parseYouTubeId(music.ytUrl)
  useEffect(() => {
    if (music.source !== 'youtube' || !ytId || !ytHostRef.current) return undefined
    let disposed = false
    let poll = null
    loadYouTubeApi().then((YT) => {
      if (disposed) return
      ytPlayerRef.current?.destroy?.()
      ytPlayerRef.current = new YT.Player(ytHostRef.current, {
        width: 0,
        height: 0,
        videoId: ytId,
        playerVars: { start: music.ytStart || 0, playsinline: 1 },
        events: {
          onReady: (e) => {
            e.target.setVolume(Math.round(music.volume * 100))
          },
          onStateChange: (e) => {
            setPlaying(e.data === 1)
            if (e.data === 0) { // ENDED → луп
              e.target.seekTo(music.ytStart || 0, true)
              e.target.playVideo()
            }
          },
        },
      })
      // Полл для конца отрезка (end-параметр работает только при первом запуске)
      poll = setInterval(() => {
        const p = ytPlayerRef.current
        if (!p?.getCurrentTime) return
        const { ytEnd, ytStart } = liveState.current.music
        if (ytEnd > 0 && p.getCurrentTime() >= ytEnd - 0.25) {
          p.seekTo(ytStart || 0, true)
        }
      }, 500)
    })
    return () => {
      disposed = true
      if (poll) clearInterval(poll)
      ytPlayerRef.current?.destroy?.()
      ytPlayerRef.current = null
      setPlaying(false)
    }
    // пересоздаём плеер при смене видео/источника
  }, [music.source, ytId]) // eslint-disable-line react-hooks/exhaustive-deps

  function playYt() {
    const p = ytPlayerRef.current
    if (!p?.playVideo) return
    p.seekTo(music.ytStart || 0, true)
    p.playVideo()
  }
  function stopYt() { ytPlayerRef.current?.pauseVideo?.() ; setPlaying(false) }

  // ---------- Автоплей в фокусе / пауза в перерыве ----------
  const prevPhase = useRef(timer.phase)
  useEffect(() => {
    if (prevPhase.current === timer.phase) return
    prevPhase.current = timer.phase
    if (!settings.autoPlayMusic) return
    if (timer.phase === 'focus') {
      if (music.source === 'game') { chiptune.start(music.volume); setPlaying(true) }
      if (music.source === 'local' && activeTrack) playLocal()
      if (music.source === 'youtube' && ytId) playYt()
    } else {
      chiptune.stop()
      stopLocal()
      stopYt()
    }
  }, [timer.phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const play = () => {
    if (music.source === 'game') { chiptune.start(music.volume); setPlaying(true); return }
    return music.source === 'local' ? playLocal() : playYt()
  }
  const stop = () => {
    if (music.source === 'game') { chiptune.stop(); setPlaying(false); return }
    return music.source === 'local' ? stopLocal() : stopYt()
  }

  return (
    <section className="panel music-panel dock-panel" style={{ display: open ? undefined : 'none' }}>
      {(
        <div className="panel-body" style={{ paddingTop: 16 }}>
          {/* Источник */}
          <div className="seg-row">
            {SOURCES.map((s) => (
              <button
                key={s}
                className={`seg ${music.source === s ? 'active' : ''}`}
                onClick={() => setMusic({ source: s })}
              >
                {t(s === 'none' ? 'musicNone' : s === 'game' ? 'musicGame' : s === 'local' ? 'musicLocal' : s === 'youtube' ? 'musicYouTube' : 'musicSpotify')}
              </button>
            ))}
          </div>

          {/* Мои треки */}
          {music.source === 'local' && (
            <>
              {music.tracks.length === 0 && <p className="empty-hint">{t('noTracks')}</p>}
              <ul className="track-list">
                {music.tracks.map((tr) => (
                  <li key={tr.id} className={`track ${tr.id === music.activeId ? 'active' : ''}`}>
                    <button className="track-pick" onClick={() => setMusic({ activeId: tr.id })}>
                      {tr.id === music.activeId ? '●' : '○'}
                    </button>
                    <span className="track-name" title={tr.name}>{tr.name}</span>
                    <span className="ab-edit">
                      <label>{t('segStart')}</label>
                      <input
                        defaultValue={secToMmss(tr.start)}
                        placeholder="0:00"
                        onBlur={(e) => updateTrack(tr.id, { start: mmssToSec(e.target.value) })}
                      />
                      <label>{t('segEnd')}</label>
                      <input
                        defaultValue={tr.end ? secToMmss(tr.end) : ''}
                        placeholder="—"
                        onBlur={(e) => updateTrack(tr.id, { end: mmssToSec(e.target.value) })}
                      />
                    </span>
                    <button className="goal-del" onClick={() => delTrack(tr.id)}>×</button>
                  </li>
                ))}
              </ul>
              <label className="btn-small file-btn">
                + {t('addTracks')}
                <input
                  type="file"
                  accept="audio/*"
                  multiple
                  hidden
                  onChange={(e) => { addTracks([...e.target.files]); e.target.value = '' }}
                />
              </label>
            </>
          )}

          {/* YouTube */}
          {music.source === 'youtube' && (
            <div className="yt-block">
              <div className="row-inline">
                <input
                  value={ytInput}
                  onChange={(e) => setYtInput(e.target.value)}
                  placeholder={t('ytUrlPh')}
                />
                <button className="btn-small" onClick={() => setMusic({ ytUrl: ytInput })}>{t('ytApply')}</button>
              </div>
              <div className="row-inline ab-edit">
                <label>{t('segStart')}</label>
                <input
                  defaultValue={secToMmss(music.ytStart)}
                  placeholder="0:00"
                  onBlur={(e) => setMusic({ ytStart: mmssToSec(e.target.value) })}
                />
                <label>{t('segEnd')}</label>
                <input
                  defaultValue={music.ytEnd ? secToMmss(music.ytEnd) : ''}
                  placeholder="—"
                  onBlur={(e) => setMusic({ ytEnd: mmssToSec(e.target.value) })}
                />
              </div>
              <div ref={ytHostRef} className="yt-hidden" />
            </div>
          )}

          {/* Spotify — этап 2 */}
          {music.source === 'spotify' && <p className="empty-hint">🎧 {t('spotifySoon')}</p>}

          {/* Транспорт */}
          {music.source !== 'none' && music.source !== 'spotify' && (
            <div className="row-inline transport">
              {!playing
                ? <button className="btn-small" onClick={play}>▶ {t('playSegment')}</button>
                : <button className="btn-small" onClick={stop}>⏸ {t('stopMusic')}</button>}
              <label className="vol">
                {t('volume')}
                <input
                  type="range" min="0" max="1" step="0.05"
                  value={music.volume}
                  onChange={(e) => setMusic({ volume: Number(e.target.value) })}
                />
              </label>
            </div>
          )}

          <audio ref={audioRef} hidden />
        </div>
      )}
    </section>
  )
}
