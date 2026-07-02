import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppProvider } from './store.jsx'
import App from './App.jsx'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
)

// Самопроверка свежести: если сервер отдал более новый билд, чем текущая
// страница (10-минутный HTTP-кэш GitHub Pages), перезагружаемся один раз.
if (import.meta.env.PROD && typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
  fetch(`${window.location.pathname}?vercheck=${Date.now()}`, { cache: 'no-store' })
    .then((r) => r.text())
    .then((html) => {
      const m = html.match(/bag-build:[a-z0-9]+/)
      if (!m) return
      if (m[0] !== __BUILD__ && !sessionStorage.getItem('bag-reloaded')) {
        sessionStorage.setItem('bag-reloaded', '1')
        window.location.reload()
      } else if (m[0] === __BUILD__) {
        sessionStorage.removeItem('bag-reloaded')
      }
    })
    .catch(() => { /* офлайн — ок */ })
}

// PWA: service worker только по http(s) в проде (на file:// не работает)
if (import.meta.env.PROD && typeof navigator !== 'undefined'
  && 'serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then((reg) => reg.update()) // сразу проверить свежесть после деплоя
      .catch(() => { /* офлайн-режим необязателен */ })
  })
}
