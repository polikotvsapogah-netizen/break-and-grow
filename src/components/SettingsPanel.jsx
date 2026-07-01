import React, { useState } from 'react'
import { useApp } from '../store.jsx'
import { putMedia } from '../db.js'
import { GRADIENTS } from './BackgroundLayer.jsx'

import { SKIN_IDS, EXTRA_IDS, SKIN_LABEL } from '../skins/index.js'

const ACCENTS = ['violet', 'teal', 'amber', 'rose']

export default function SettingsPanel({ open, onClose }) {
  const {
    state, t, setSettings, setBg, setBreakMin, ensureNotifPermission,
  } = useApp()
  const { settings } = state
  const [bgYtInput, setBgYtInput] = useState(settings.bg.ytUrl)
  const [moreSkins, setMoreSkins] = useState(EXTRA_IDS.includes(settings.skin))
  const [notifState, setNotifState] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  )

  const uploadVideo = async (file) => {
    if (!file) return
    await putMedia('bg-video', file)
    setBg({ type: 'video', hasVideo: true })
  }

  const toggleNotify = async () => {
    if (!settings.notify) {
      const p = await ensureNotifPermission()
      setNotifState(p)
      setSettings({ notify: true })
    } else {
      setSettings({ notify: false })
    }
  }

  return (
    <>
      {open && <div className="drawer-scrim" onClick={onClose} />}
      <aside className={`drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
        <header className="drawer-head">
          <h2>⚙️ {t('settings')}</h2>
          <button className="overlay-close" onClick={onClose}>×</button>
        </header>

        <div className="drawer-body">
          {/* ---- Игровой стиль ---- */}
          <h3 className="sec-title">{t('sectionSkin')}</h3>
          <p className="skin-hint">{t('skinHint')}</p>
          <div className="skin-grid">
            {SKIN_IDS.map((s) => (
              <button
                key={s}
                className={`skin-thumb th-${s} ${settings.skin === s ? 'active' : ''}`}
                onClick={() => setSettings({ skin: s })}
              >
                <span>{t(SKIN_LABEL[s])}</span>
              </button>
            ))}
          </div>
          <button className="btn-small more-skins" onClick={() => setMoreSkins(!moreSkins)}>
            {moreSkins ? `▲ ${t('less')}` : `▼ ${t('more')}`}
          </button>
          {moreSkins && (
            <div className="skin-grid">
              {EXTRA_IDS.map((s) => (
                <button
                  key={s}
                  className={`skin-thumb th-${s} ${settings.skin === s ? 'active' : ''}`}
                  onClick={() => setSettings({ skin: s })}
                >
                  <span>{t(SKIN_LABEL[s])}</span>
                </button>
              ))}
            </div>
          )}

          {/* ---- Оформление ---- */}
          <h3 className="sec-title">{t('sectionLook')}</h3>

          <div className="field">
            <span className="field-label">{t('accent')}</span>
            <div className="swatch-row">
              {ACCENTS.map((a) => (
                <button
                  key={a}
                  className={`swatch sw-${a} ${settings.accent === a ? 'active' : ''}`}
                  onClick={() => setSettings({ accent: a })}
                  aria-label={a}
                />
              ))}
            </div>
          </div>

          <div className="field">
            <span className="field-label">{t('theme')}</span>
            {settings.skin === 'classic' ? (
              <div className="seg-row">
                <button className={`seg ${settings.theme === 'dark' ? 'active' : ''}`} onClick={() => setSettings({ theme: 'dark' })}>🌙 {t('themeDark')}</button>
                <button className={`seg ${settings.theme === 'light' ? 'active' : ''}`} onClick={() => setSettings({ theme: 'light' })}>☀️ {t('themeLight')}</button>
              </div>
            ) : (
              <p className="skin-hint">{t('themeNote')}</p>
            )}
          </div>

          <div className="field">
            <span className="field-label">{t('background')}</span>
            <div className="seg-row">
              <button className={`seg ${settings.bg.type === 'gradient' ? 'active' : ''}`} onClick={() => setBg({ type: 'gradient' })}>{t('bgGradient')}</button>
              <button className={`seg ${settings.bg.type === 'video' ? 'active' : ''}`} onClick={() => setBg({ type: 'video' })}>{t('bgVideo')}</button>
              <button className={`seg ${settings.bg.type === 'youtube' ? 'active' : ''}`} onClick={() => setBg({ type: 'youtube' })}>{t('bgYouTube')}</button>
            </div>

            {settings.bg.type === 'gradient' && settings.skin === 'classic' && (
              <div className="grad-row">
                {GRADIENTS.map((g) => (
                  <button
                    key={g}
                    className={`grad-thumb grad-${g} ${settings.bg.gradient === g ? 'active' : ''}`}
                    onClick={() => setBg({ gradient: g })}
                    aria-label={g}
                  />
                ))}
              </div>
            )}

            {settings.bg.type === 'video' && (
              <label className="btn-small file-btn">
                ⬆ {t('uploadVideo')}
                <input
                  type="file" accept="video/*" hidden
                  onChange={(e) => { uploadVideo(e.target.files[0]); e.target.value = '' }}
                />
              </label>
            )}

            {settings.bg.type === 'youtube' && (
              <div className="row-inline">
                <input
                  value={bgYtInput}
                  onChange={(e) => setBgYtInput(e.target.value)}
                  placeholder={t('bgYtPh')}
                />
                <button className="btn-small" onClick={() => setBg({ ytUrl: bgYtInput })}>{t('ytApply')}</button>
              </div>
            )}
          </div>

          <div className="field">
            <span className="field-label">{t('dim')} · {Math.round(settings.dim * 100)}%</span>
            <input
              type="range" min="0" max="0.85" step="0.05"
              value={settings.dim}
              onChange={(e) => setSettings({ dim: Number(e.target.value) })}
            />
          </div>

          {/* ---- Таймер ---- */}
          <h3 className="sec-title">{t('sectionTimer')}</h3>

          <NumField label={t('focusLen')} value={settings.focusMin} onChange={(v) => setSettings({ focusMin: v })} suffix={t('minutes')} />
          <NumField label={t('breakLenGoals')} value={settings.breakMin.goals} onChange={(v) => setBreakMin('goals', v)} suffix={t('minutes')} />
          <NumField label={t('breakLenExercise')} value={settings.breakMin.exercise} onChange={(v) => setBreakMin('exercise', v)} suffix={t('minutes')} />
          <NumField label={t('breakLenYoga')} value={settings.breakMin.yoga} onChange={(v) => setBreakMin('yoga', v)} suffix={t('minutes')} />

          <Toggle label={t('autoBreak')} checked={settings.autoBreak} onChange={(v) => setSettings({ autoBreak: v })} />
          <Toggle label={t('autoFocus')} checked={settings.autoFocus} onChange={(v) => setSettings({ autoFocus: v })} />

          {/* ---- Звук и уведомления ---- */}
          <h3 className="sec-title">{t('sectionSound')}</h3>

          <Toggle label={t('soundOn')} checked={settings.sound} onChange={(v) => setSettings({ sound: v })} />
          <div className="field">
            <span className="field-label">{t('volume')} · {Math.round(settings.volume * 100)}%</span>
            <input
              type="range" min="0" max="1" step="0.05"
              value={settings.volume}
              onChange={(e) => setSettings({ volume: Number(e.target.value) })}
            />
          </div>
          <Toggle label={t('notifyOn')} checked={settings.notify} onChange={toggleNotify} />
          {settings.notify && notifState === 'denied' && (
            <p className="warn-hint">⚠ {t('notifyDenied')}</p>
          )}

          {/* ---- Язык ---- */}
          <h3 className="sec-title">{t('sectionLang')}</h3>
          <div className="seg-row">
            <button className={`seg ${settings.lang === 'ru' ? 'active' : ''}`} onClick={() => setSettings({ lang: 'ru' })}>🇷🇺 Русский</button>
            <button className={`seg ${settings.lang === 'en' ? 'active' : ''}`} onClick={() => setSettings({ lang: 'en' })}>🇬🇧 English</button>
          </div>
        </div>
      </aside>
    </>
  )
}

function NumField({ label, value, onChange, suffix }) {
  return (
    <div className="field field-num">
      <span className="field-label">{label}</span>
      <span className="num-wrap">
        <button onClick={() => onChange(Math.max(1, value - 5))}>−</button>
        <input
          type="number" min="1" max="240" value={value}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10)
            if (!Number.isNaN(n)) onChange(Math.min(240, Math.max(1, n)))
          }}
        />
        <button onClick={() => onChange(Math.min(240, value + 5))}>+</button>
        <em>{suffix}</em>
      </span>
    </div>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="field field-toggle">
      <span className="field-label">{label}</span>
      <span className={`toggle ${checked ? 'on' : ''}`} onClick={(e) => { e.preventDefault(); onChange(!checked) }}>
        <span className="knob" />
      </span>
    </label>
  )
}
