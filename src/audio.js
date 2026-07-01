// Звуковые сигналы через WebAudio — без аудио-файлов, работает офлайн.
// Стили: 'soft' (колокольчик), '8bit' (чиптюн, квадратная волна), 'synth' (пила, неон)
let ctx
function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone(freq, t0, dur, vol, type = 'sine') {
  const c = ac()
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, c.currentTime + t0)
  gain.gain.exponentialRampToValueAtTime(vol, c.currentTime + t0 + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + t0 + dur)
  osc.connect(gain).connect(c.destination)
  osc.start(c.currentTime + t0)
  osc.stop(c.currentTime + t0 + dur + 0.05)
}

// Сигнал окончания фазы
export function chimeEnd(volume = 0.5, style = 'soft') {
  try {
    if (style === '8bit') {
      // Чиптюн-фанфара: C-E-G-C↑
      const seq = [523.25, 659.25, 783.99, 1046.5]
      seq.forEach((f, i) => tone(f, i * 0.11, 0.14, volume * 0.28, 'square'))
      tone(1318.5, 0.44, 0.4, volume * 0.22, 'square')
    } else if (style === 'synth') {
      tone(392, 0, 0.9, volume * 0.3, 'sawtooth')
      tone(523.25, 0.12, 0.9, volume * 0.22, 'sawtooth')
      tone(659.25, 0.24, 1.1, volume * 0.2, 'sawtooth')
    } else {
      tone(880, 0, 1.2, volume * 0.5)
      tone(1318.5, 0.15, 1.4, volume * 0.35)
      tone(659.25, 0.3, 1.6, volume * 0.3)
    }
  } catch { /* без звука */ }
}

// Короткий сигнал старта
export function blipStart(volume = 0.5, style = 'soft') {
  try {
    if (style === '8bit') {
      tone(659.25, 0, 0.09, volume * 0.3, 'square')
      tone(1046.5, 0.1, 0.14, volume * 0.3, 'square')
    } else if (style === 'synth') {
      tone(523.25, 0, 0.22, volume * 0.3, 'sawtooth')
      tone(783.99, 0.1, 0.3, volume * 0.25, 'sawtooth')
    } else {
      tone(523.25, 0, 0.18, volume * 0.4, 'triangle')
      tone(783.99, 0.12, 0.22, volume * 0.4, 'triangle')
    }
  } catch { /* без звука */ }
}

export function chimeStyleFor(skin) {
  if (skin === 'pixel' || skin === 'maze' || skin === 'blocks' || skin === 'invaders') return '8bit'
  if (skin === 'synth') return 'synth'
  return 'soft'
}

// Разблокировать аудио-контекст по первому клику (политика браузеров)
export function unlockAudio() {
  try { ac() } catch { /* ок */ }
}
