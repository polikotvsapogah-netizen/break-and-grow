import React, {
  createContext, useContext, useEffect, useMemo, useRef, useState, useCallback,
} from 'react'
import { makeT } from './i18n'
import { chimeEnd, blipStart, unlockAudio, chimeStyleFor } from './audio'
import { putMedia, delMedia } from './db'

const LS_KEY = 'bag-state-v1'
const LS_TIMER = 'bag-timer-v1'

export const defaultState = {
  settings: {
    lang: 'ru',
    theme: 'dark',
    accent: 'violet', // violet | teal | amber | rose
    skin: 'pixel', // дефолт для новых пользователей — Марио-режим
    focusMin: 45,
    mode: 'goals', // goals | exercise | yoga
    breakMin: { goals: 5, exercise: 7, yoga: 12 },
    autoBreak: true,
    autoFocus: false,
    autoPlayMusic: true,
    sound: true,
    notify: true,
    volume: 0.6,
    bg: { type: 'gradient', gradient: 'aurora', ytUrl: '', hasVideo: false },
    dim: 0.45,
  },
  goals: [],
  currentGoalId: null,
  music: {
    source: 'none', // none | local | youtube
    tracks: [], // {id, name, start, end} — файл в IndexedDB под ключом track-{id}
    activeId: null,
    ytUrl: '', ytStart: 0, ytEnd: 0,
    volume: 0.8,
  },
  stats: { day: '', sessions: 0, focusedMin: 0, bestMin: 0, coins: 0, lines: 0 },
  profile: { username: '', likedPhrases: [] }, // база для персонализации (позже — нейронка по API)
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return defaultState
    const saved = JSON.parse(raw)
    return {
      ...defaultState,
      ...saved,
      settings: { ...defaultState.settings, ...saved.settings,
        breakMin: { ...defaultState.settings.breakMin, ...(saved.settings?.breakMin || {}) },
        bg: { ...defaultState.settings.bg, ...(saved.settings?.bg || {}) },
      },
      music: { ...defaultState.music, ...saved.music },
      stats: { ...defaultState.stats, ...saved.stats },
      profile: { ...defaultState.profile, ...saved.profile },
    }
  } catch { return defaultState }
}

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

export function fmtTime(ms) {
  const total = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function secToMmss(sec) {
  if (!sec && sec !== 0) return ''
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export function mmssToSec(str) {
  if (str == null || str === '') return 0
  const parts = String(str).trim().split(':').map(Number)
  if (parts.some(Number.isNaN)) return 0
  if (parts.length === 1) return parts[0]
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  return parts[0] * 3600 + parts[1] * 60 + parts[2]
}

export function AppProvider({ children }) {
  const [state, setState] = useState(loadPersisted)
  const [timer, setTimer] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_TIMER) || 'null')
      if (saved && saved.endsAt && saved.endsAt > Date.now() && !saved.paused) {
        return { ...saved, remainMs: saved.endsAt - Date.now(), overlay: false }
      }
      if (saved && saved.paused && saved.remainMs > 0) return { ...saved, overlay: false }
    } catch { /* ignore */ }
    return { phase: 'idle', endsAt: null, paused: false, remainMs: 0, totalMs: 0, overlay: false, overlayKind: null }
  })
  const startedAtRef = useRef(null)
  const wakeLockRef = useRef(null)

  const { settings } = state
  const t = useMemo(() => makeT(settings.lang), [settings.lang])

  // ---------- Персистентность ----------
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)) } catch { /* quota */ }
  }, [state])
  useEffect(() => {
    const { phase, endsAt, paused, remainMs, totalMs } = timer
    try { localStorage.setItem(LS_TIMER, JSON.stringify({ phase, endsAt, paused, remainMs, totalMs })) } catch { /* quota */ }
  }, [timer])

  // ---------- Тема / акцент / язык ----------
  useEffect(() => {
    const el = document.documentElement
    el.dataset.theme = settings.theme
    el.dataset.accent = settings.accent
    el.dataset.skin = settings.skin || 'classic'
    el.lang = settings.lang
  }, [settings.theme, settings.accent, settings.skin, settings.lang])

  // Фаза таймера на <html> — сцены скинов ускоряются во время фокуса
  useEffect(() => {
    document.documentElement.dataset.phase = timer.phase
  }, [timer.phase])

  // ---------- Уведомления ----------
  const ensureNotifPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'unsupported'
    if (Notification.permission === 'default') {
      try { return await Notification.requestPermission() } catch { return 'denied' }
    }
    return Notification.permission
  }, [])

  const notify = useCallback((title, body) => {
    if (!settings.notify || !('Notification' in window)) return
    if (Notification.permission === 'granted') {
      try { new Notification(title, { body, silent: false }) } catch { /* ok */ }
    }
  }, [settings.notify])

  // ---------- Действия таймера ----------
  const startFocus = useCallback((min) => {
    unlockAudio()
    const minutes = min ?? state.settings.focusMin
    startedAtRef.current = Date.now()
    if (state.settings.sound) blipStart(state.settings.volume, chimeStyleFor(state.settings.skin))
    if (state.settings.notify) ensureNotifPermission()
    setTimer({
      phase: 'focus', endsAt: Date.now() + minutes * 60000,
      paused: false, remainMs: minutes * 60000, totalMs: minutes * 60000,
      overlay: false, overlayKind: null,
    })
  }, [state.settings, ensureNotifPermission])

  const startBreak = useCallback(() => {
    const minutes = state.settings.breakMin[state.settings.mode] || 5
    setTimer((tm) => ({
      ...tm, phase: 'break', endsAt: Date.now() + minutes * 60000,
      paused: false, remainMs: minutes * 60000, totalMs: minutes * 60000,
      overlay: true, overlayKind: 'break',
    }))
  }, [state.settings])

  const pauseToggle = useCallback(() => {
    setTimer((tm) => {
      if (tm.phase === 'idle') return tm
      if (!tm.paused) return { ...tm, paused: true, remainMs: Math.max(0, tm.endsAt - Date.now()), endsAt: null }
      return { ...tm, paused: false, endsAt: Date.now() + tm.remainMs }
    })
  }, [])

  const resetTimer = useCallback(() => {
    setTimer({ phase: 'idle', endsAt: null, paused: false, remainMs: 0, totalMs: 0, overlay: false, overlayKind: null })
  }, [])

  // «На лету»: сдвинуть время текущей сессии
  const adjustMinutes = useCallback((delta) => {
    setTimer((tm) => {
      if (tm.phase === 'idle') return tm
      if (tm.paused) {
        const remainMs = Math.max(10000, tm.remainMs + delta * 60000)
        return { ...tm, remainMs, totalMs: Math.max(remainMs, (tm.totalMs || 0) + delta * 60000) }
      }
      const newEnd = Math.max(Date.now() + 10000, tm.endsAt + delta * 60000)
      const remainMs = newEnd - Date.now()
      return { ...tm, endsAt: newEnd, remainMs, totalMs: Math.max(remainMs, (tm.totalMs || 0) + delta * 60000) }
    })
  }, [])

  const closeOverlay = useCallback(() => {
    setTimer((tm) => ({ ...tm, overlay: false, overlayKind: null, ...(tm.phase === 'break' ? {} : {}) }))
  }, [])

  const skipBreak = useCallback(() => { startFocus() }, [startFocus])

  // ---------- Завершение фаз ----------
  const onPhaseEnd = useCallback((tm) => {
    const s = stateRef.current.settings
    const goal = stateRef.current.goals.find((g) => g.id === stateRef.current.currentGoalId)
    const tt = makeT(s.lang)
    if (tm.phase === 'focus') {
      if (s.sound) chimeEnd(s.volume, chimeStyleFor(s.skin))
      const titles = { goals: tt('notifFocusEndGoals'), exercise: tt('notifFocusEndExercise'), yoga: tt('notifFocusEndYoga') }
      notify(titles[s.mode], goal ? `${goal.title}${goal.why ? ' — ' + goal.why : ''}` : tt('timeToRecharge'))
      // статистика
      const mins = startedAtRef.current ? Math.round((Date.now() - startedAtRef.current) / 60000) : s.focusMin
      setState((st) => {
        const today = new Date().toISOString().slice(0, 10)
        const sameDay = st.stats.day === today
        const focusedMin = (sameDay ? st.stats.focusedMin : 0) + mins
        return {
          ...st,
          stats: {
            day: today,
            sessions: (sameDay ? st.stats.sessions : 0) + 1,
            focusedMin,
            bestMin: Math.max(st.stats.bestMin || 0, focusedMin),
          },
        }
      })
      if (s.autoBreak) {
        const minutes = s.breakMin[s.mode] || 5
        return { phase: 'break', endsAt: Date.now() + minutes * 60000, paused: false, remainMs: minutes * 60000, totalMs: minutes * 60000, overlay: true, overlayKind: 'break' }
      }
      return { phase: 'idle', endsAt: null, paused: false, remainMs: 0, totalMs: 0, overlay: true, overlayKind: 'break-offer' }
    }
    // break закончился
    if (s.sound) chimeEnd(s.volume, chimeStyleFor(s.skin))
    notify(tt('notifBreakEnd'), goal ? goal.title : '')
    if (s.autoFocus) {
      startedAtRef.current = Date.now()
      return { phase: 'focus', endsAt: Date.now() + s.focusMin * 60000, paused: false, remainMs: s.focusMin * 60000, totalMs: s.focusMin * 60000, overlay: false, overlayKind: null }
    }
    return { phase: 'idle', endsAt: null, paused: false, remainMs: 0, totalMs: 0, overlay: true, overlayKind: 'done' }
  }, [notify])

  // ref на state для onPhaseEnd без лишних перезапусков интервала
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  // ---------- Тик ----------
  useEffect(() => {
    const id = setInterval(() => {
      setTimer((tm) => {
        if (tm.phase === 'idle' || tm.paused || !tm.endsAt) return tm
        const remain = tm.endsAt - Date.now()
        if (remain <= 0) return onPhaseEnd(tm)
        return { ...tm, remainMs: remain }
      })
    }, 300)
    return () => clearInterval(id)
  }, [onPhaseEnd])

  // ---------- Заголовок вкладки ----------
  useEffect(() => {
    if (timer.phase === 'idle') { document.title = 'Break & Grow'; return }
    const icon = timer.phase === 'focus' ? '▸' : '☕'
    document.title = `${icon} ${fmtTime(timer.remainMs)} · Break & Grow`
  }, [timer.remainMs, timer.phase])

  // ---------- Wake Lock: экран не гаснет во время фокуса ----------
  useEffect(() => {
    async function lock() {
      try {
        if (timer.phase === 'focus' && 'wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen')
        }
      } catch { /* не критично */ }
    }
    if (timer.phase === 'focus') lock()
    else { wakeLockRef.current?.release?.(); wakeLockRef.current = null }
    return () => { wakeLockRef.current?.release?.(); wakeLockRef.current = null }
  }, [timer.phase])

  // ---------- Действия: настройки / цели / музыка ----------
  const setSettings = useCallback((patch) => {
    setState((st) => ({ ...st, settings: { ...st.settings, ...patch } }))
  }, [])
  const setBg = useCallback((patch) => {
    setState((st) => ({ ...st, settings: { ...st.settings, bg: { ...st.settings.bg, ...patch } } }))
  }, [])
  const setBreakMin = useCallback((mode, val) => {
    setState((st) => ({ ...st, settings: { ...st.settings, breakMin: { ...st.settings.breakMin, [mode]: val } } }))
  }, [])

  const addGoal = useCallback((title, why) => {
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
    setState((st) => ({
      ...st,
      goals: [...st.goals, { id, title, why }],
      currentGoalId: st.currentGoalId || id,
    }))
  }, [])
  const delGoal = useCallback((id) => {
    setState((st) => ({
      ...st,
      goals: st.goals.filter((g) => g.id !== id),
      currentGoalId: st.currentGoalId === id ? (st.goals.find((g) => g.id !== id)?.id || null) : st.currentGoalId,
    }))
  }, [])
  const setCurrentGoal = useCallback((id) => setState((st) => ({ ...st, currentGoalId: id })), [])

  const setUsername = useCallback((username) => {
    setState((st) => ({ ...st, profile: { ...st.profile, username: username.trim() } }))
  }, [])
  const likePhrase = useCallback((id) => {
    setState((st) => st.profile.likedPhrases.includes(id) ? st : ({
      ...st, profile: { ...st.profile, likedPhrases: [...st.profile.likedPhrases, id] },
    }))
  }, [])

  // Игровые счётчики сцен (монеты Марио, линии тетриса)
  const addCoins = useCallback((n = 1) => {
    setState((st) => ({ ...st, stats: { ...st.stats, coins: (st.stats.coins || 0) + n } }))
  }, [])
  const addLines = useCallback((n = 1) => {
    setState((st) => ({ ...st, stats: { ...st.stats, lines: (st.stats.lines || 0) + n } }))
  }, [])

  const setMusic = useCallback((patch) => {
    setState((st) => ({ ...st, music: { ...st.music, ...patch } }))
  }, [])
  const addTracks = useCallback(async (files) => {
    const added = []
    for (const f of files) {
      const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())
      await putMedia(`track-${id}`, f)
      added.push({ id, name: f.name.replace(/\.[^.]+$/, ''), start: 0, end: 0 })
    }
    setState((st) => ({
      ...st,
      music: {
        ...st.music,
        source: 'local',
        tracks: [...st.music.tracks, ...added],
        activeId: st.music.activeId || added[0]?.id || null,
      },
    }))
  }, [])
  const updateTrack = useCallback((id, patch) => {
    setState((st) => ({
      ...st,
      music: { ...st.music, tracks: st.music.tracks.map((tr) => (tr.id === id ? { ...tr, ...patch } : tr)) },
    }))
  }, [])
  const delTrack = useCallback(async (id) => {
    await delMedia(`track-${id}`).catch(() => {})
    setState((st) => ({
      ...st,
      music: {
        ...st.music,
        tracks: st.music.tracks.filter((tr) => tr.id !== id),
        activeId: st.music.activeId === id ? (st.music.tracks.find((tr) => tr.id !== id)?.id || null) : st.music.activeId,
      },
    }))
  }, [])

  const value = useMemo(() => ({
    state, t, timer,
    startFocus, startBreak, pauseToggle, resetTimer, adjustMinutes, closeOverlay, skipBreak,
    setSettings, setBg, setBreakMin,
    addGoal, delGoal, setCurrentGoal, addCoins, addLines, setUsername, likePhrase,
    setMusic, addTracks, updateTrack, delTrack,
    ensureNotifPermission,
  }), [state, t, timer, startFocus, startBreak, pauseToggle, resetTimer, adjustMinutes,
    closeOverlay, skipBreak, setSettings, setBg, setBreakMin, addGoal, delGoal,
    setCurrentGoal, addCoins, addLines, setUsername, likePhrase, setMusic, addTracks, updateTrack, delTrack, ensureNotifPermission])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
