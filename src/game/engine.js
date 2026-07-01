// Мини-движок: rAF-цикл с дельта-временем + физические хелперы.
// Все сцены и частицы работают на нём — 60fps, без re-render React.

export function createLoop(fn) {
  let raf = 0
  let last = 0
  let running = false
  const tick = (t) => {
    if (!running) return
    const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016)
    last = t
    fn(dt, t / 1000)
    raf = requestAnimationFrame(tick)
  }
  return {
    start() {
      if (running) return
      running = true
      last = 0
      raf = requestAnimationFrame(tick)
    },
    stop() {
      running = false
      cancelAnimationFrame(raf)
    },
    get running() { return running },
  }
}

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v))

// Экспоненциальное затухание (frame-rate independent)
export const damp = (v, k, dt) => v * Math.exp(-k * dt)

// Пружина: тянет value к target, возвращает [value, velocity]
export function spring(value, velocity, target, stiffness, damping, dt) {
  const accel = (target - value) * stiffness
  let v = velocity + accel * dt
  v = damp(v, damping, dt)
  return [value + v * dt, v]
}

export const GRAVITY = 2200 // px/s² — «аркадная» гравитация, чуть тяжелее земной для сочности
