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

// PWA: service worker только по http(s) в проде (на file:// не работает)
if (import.meta.env.PROD && typeof navigator !== 'undefined'
  && 'serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* офлайн-режим необязателен */ })
  })
}
