/* Звуки событий сцен — синхрон музыки с действиями на экране.
   Короткие 8-бит сигналы, громкость от настроек. */
let ctx
let lastJump = 0
const ac = () => {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}
function blip(freqs, dur, vol, type = 'square') {
  try {
    const c = ac()
    freqs.forEach((f, i) => {
      const o = c.createOscillator()
      const g = c.createGain()
      o.type = type
      o.frequency.value = f
      const t = c.currentTime + i * dur * 0.9
      g.gain.setValueAtTime(0.0001, t)
      g.gain.linearRampToValueAtTime(vol, t + 0.008)
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      o.connect(g).connect(c.destination)
      o.start(t)
      o.stop(t + dur + 0.02)
    })
  } catch { /* без звука */ }
}
export const sfx = {
  coin(v = 0.5) { blip([988, 1319], 0.09, v * 0.12) },
  jump(v = 0.5) {
    const now = Date.now()
    if (now - lastJump < 220) return
    lastJump = now
    blip([392, 587], 0.07, v * 0.08)
  },
  clear(v = 0.5) { blip([659, 784, 988, 1319], 0.11, v * 0.12) },
  flag(v = 0.5) { blip([523, 659, 784, 1047, 1319], 0.12, v * 0.13) },
}
