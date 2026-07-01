/* Собственная 8-бит мелодия (не копия чужих тем — они под копирайтом).
   Бодрый мажорный луп: квадратный лид + треугольный бас, 132 BPM. */
let ctx = null
let master = null
let interval = null
let step = 0
let nextTime = 0
let vol = 0.5

const BPM = 132
const STEP = 60 / BPM / 2 // восьмые
// собственная мелодия, 32 шага (0 = пауза)
const LEAD = [
  523, 0, 659, 0, 784, 659, 523, 0, 587, 0, 698, 587, 523, 0, 440, 0,
  523, 523, 659, 0, 784, 0, 880, 784, 698, 659, 587, 0, 523, 0, 0, 0,
]
const BASS = [
  131, 0, 131, 0, 175, 0, 175, 0, 147, 0, 147, 0, 131, 0, 110, 0,
  131, 0, 131, 0, 175, 0, 175, 0, 147, 0, 147, 0, 131, 131, 131, 0,
]

function note(freq, t, dur, type, gain) {
  if (!freq) return
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(gain, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(master)
  o.start(t)
  o.stop(t + dur + 0.02)
}

export const chiptune = {
  playing: false,
  start(volume = 0.5) {
    try {
      vol = volume
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
      if (ctx.state === 'suspended') ctx.resume()
      if (this.playing) return
      master = ctx.createGain()
      master.gain.value = 1
      master.connect(ctx.destination)
      step = 0
      nextTime = ctx.currentTime + 0.06
      interval = setInterval(() => {
        while (nextTime < ctx.currentTime + 0.12) {
          const i = step % LEAD.length
          note(LEAD[i], nextTime, STEP * 0.9, 'square', vol * 0.09)
          note(BASS[i], nextTime, STEP * 0.95, 'triangle', vol * 0.16)
          nextTime += STEP
          step += 1
        }
      }, 30)
      this.playing = true
    } catch { /* без звука */ }
  },
  stop() {
    if (interval) clearInterval(interval)
    interval = null
    if (master && ctx) {
      try {
        master.gain.setValueAtTime(master.gain.value, ctx.currentTime)
        master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2)
      } catch { /* ок */ }
    }
    this.playing = false
  },
  setVolume(v) { vol = v },
  // приглушить мелодию на sec секунд (синхрон с событием на экране)
  duck(sec) {
    if (!this.playing || !master || !ctx) return
    try {
      const t = ctx.currentTime
      master.gain.cancelScheduledValues(t)
      master.gain.setValueAtTime(master.gain.value, t)
      master.gain.linearRampToValueAtTime(0.12, t + 0.2)
      master.gain.setValueAtTime(0.12, t + Math.max(0.5, sec - 0.5))
      master.gain.linearRampToValueAtTime(1, t + sec)
    } catch { /* ок */ }
  },
}
