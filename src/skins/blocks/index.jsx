import React, { useEffect, useRef } from 'react'
import { createLoop } from '../../game/engine.js'
import { useApp } from '../../store.jsx'
import { getPhrase } from '../../motivation.js'
import { fx } from '../../game/fx.js'
import { sfx } from '../../game/sfx.js'
import './blocks.css'

export const id = 'blocks'
export const labelKey = 'skinBlocks'
export const burst = 'cells'

/* ТЕТРИС v4:
   — фигуры идут НЕПРЕРЫВНО, одна за другой (пауза ~0.8с);
   — фигура сначала «пролетает» немного, потом ускоряется; средняя скорость ×2;
   — ускоренная (каждая 2-я/3-я): стартует строго у ЛЕВОГО или ПРАВОГО края
     (зона видимости), в полёте ДОВОРАЧИВАЕТСЯ до нужной ориентации, затем
     плавно съезжает по горизонтали в идеальный слот — как будто её ведёт
     игрок — и только после этого делает hard drop со шлейфом;
   — скорость растёт от собранных линий и времени: к ~45 минутам — максимум;
   — настройки: вкл/выкл, начальная скорость, максимальная скорость;
   — line clear: замирание, мигание, фраза слева направо, клик = ♥. */

const SHAPES = [
  { c: '#37d6e8', cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },
  { c: '#ffd23f', cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
  { c: '#b06cf0', cells: [[0, 0], [1, 0], [2, 0], [1, 1]] },
  { c: '#5ce65c', cells: [[1, 0], [2, 0], [0, 1], [1, 1]] },
  { c: '#ff5d5d', cells: [[0, 0], [1, 0], [1, 1], [2, 1]] },
  { c: '#4d7cff', cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },
  { c: '#ff9f40', cells: [[2, 0], [0, 1], [1, 1], [2, 1]] },
]

function rotate(cells, times) {
  let cs = cells
  for (let i = 0; i < (times % 4 + 4) % 4; i += 1) {
    const maxY = Math.max(...cs.map((c) => c[1]))
    cs = cs.map(([x, y]) => [maxY - y, x])
  }
  const mx = Math.min(...cs.map((c) => c[0]))
  const my = Math.min(...cs.map((c) => c[1]))
  return cs.map(([x, y]) => [x - mx, y - my])
}
const dims = (cells) => [Math.max(...cells.map((c) => c[0])) + 1, Math.max(...cells.map((c) => c[1])) + 1]
const bottoms = (cells) => {
  const b = {}
  cells.forEach(([x, y]) => { b[x] = Math.max(b[x] ?? -1, y) })
  return b
}

export function Scene({ prog, phase }) {
  const canvasRef = useRef(null)
  const { state, addLines, likePhrase } = useApp()
  const live = useRef({ phase, state })
  live.current = { phase, state }
  const actions = useRef({ addLines, likePhrase })
  actions.current = { addLines, likePhrase }

  const enabled = state.settings.tetris?.on !== false

  useEffect(() => {
    if (!enabled) return undefined
    const canvas = canvasRef.current
    const ctx = canvas.getContext && canvas.getContext('2d')
    if (!ctx) return undefined

    let W = 0; let H = 0; let cell = 26; let cols = 40; let maxRows = 8
    const st = {
      grid: [], heights: [], piece: null,
      n: 0, fastDue: 2 + ((Math.random() * 2) | 0),
      spawnT: 1, focusT: 0, lines: 0, freeze: null,
    }

    const resize = () => {
      W = canvas.width = canvas.offsetWidth || window.innerWidth
      H = canvas.height = canvas.offsetHeight || window.innerHeight
      cell = Math.max(13, Math.floor(W / 86)) // мелкие клетки, как в первой «идеальной» версии
      cols = Math.floor(W / cell)
      let top = H * 0.6
      try {
        const card = document.querySelector('.timer-card')
        if (card) top = card.getBoundingClientRect().bottom + 14
      } catch { /* ок */ }
      maxRows = Math.max(4, Math.floor((H - top) / cell))
      st.grid = []; st.heights = new Array(cols).fill(0); st.piece = null; st.freeze = null
    }
    resize()
    window.addEventListener('resize', resize)

    // множитель скорости: настройки + рост от линий и времени (макс к ~45 мин)
    const speedMul = () => {
      const t = live.current.state.settings.tetris || { s0: 1, sMax: 3 }
      const ramp = Math.min(1, st.focusT / 2700 + st.lines * 0.03)
      return t.s0 + (t.sMax - t.s0) * ramp
    }

    const evalSlot = (cells, col) => {
      const [w, h] = dims(cells)
      if (col < 0 || col > cols - w) return null
      const b = bottoms(cells)
      let rowBase = 0
      Object.entries(b).forEach(([lx, by]) => {
        const need = st.heights[col + Number(lx)] - (h - 1 - by)
        rowBase = Math.max(rowBase, need)
      })
      let holes = 0
      Object.entries(b).forEach(([lx, by]) => {
        holes += (rowBase + (h - 1 - by)) - st.heights[col + Number(lx)]
      })
      return { rowBase, holes, w, h }
    }

    const spawn = () => {
      st.n += 1
      const si = (Math.random() * SHAPES.length) | 0
      const shape = SHAPES[si]
      let perfect = null; let best = null
      for (let r = 0; r < 4; r += 1) {
        const cells = rotate(shape.cells, r)
        const [w] = dims(cells)
        for (let c = 0; c <= cols - w; c += 1) {
          const ev = evalSlot(cells, c)
          if (!ev) continue
          const score = ev.holes * 3 + ev.rowBase + Math.random() * 0.9
          if (!best || score < best.score) best = { r, cells, col: c, score, ...ev }
          if (ev.holes === 0 && ev.rowBase + ev.h <= maxRows) {
            if (!perfect || ev.rowBase < perfect.rowBase) perfect = { r, cells, col: c, ...ev }
          }
        }
      }
      const wantFast = st.n >= st.fastDue
      const fast = wantFast && !!perfect
      if (fast) st.fastDue = st.n + 2 + ((Math.random() * 2) | 0)
      const slot = fast ? perfect : best
      if (!slot) return
      const mul = speedMul()
      // ускоренная стартует у края с меньшей высотой (там виднее и «ближе» игроку)
      const leftH = st.heights.slice(0, cols >> 1).reduce((a, b) => a + b, 0)
      const rightH = st.heights.slice(cols >> 1).reduce((a, b) => a + b, 0)
      const rot0 = fast ? (Math.random() * 4) | 0 : slot.r
      const cells0 = rotate(shape.cells, rot0)
      const [w0, h0] = dims(cells0)
      const startCol = fast
        ? (leftH <= rightH ? 0 : cols - w0)
        : Math.max(0, Math.min(cols - slot.w, slot.col + ((Math.random() * 6) | 0) - 3))
      st.piece = {
        base: shape.cells, color: shape.c,
        rot: rot0, cells: cells0, w: w0, h: h0,
        targetRot: slot.r, targetCol: slot.col,
        col: startCol, x: startCol * cell,
        y: -h0 * cell - 8,
        v: 60 * mul, vmax: fast ? 110 * mul : 190 * mul, // средняя ×2 против v3
        g: fast ? 40 : 150 * mul,
        fast, drop: false, rotT: 0, trail: [],
      }
    }

    const landPiece = (p) => {
      const ev = evalSlot(p.cells, p.col)
      p.cells.forEach(([x, y]) => {
        const row = ev.rowBase + (p.h - 1 - y)
        const col = p.col + x
        if (!st.grid[row]) st.grid[row] = new Array(cols).fill(null)
        st.grid[row][col] = p.color
        st.heights[col] = Math.max(st.heights[col], row + 1)
      })
      st.piece = null
      st.spawnT = 0
      const full = []
      st.grid.forEach((rowArr, r) => {
        if (rowArr && rowArr.filter(Boolean).length >= cols) full.push(r)
      })
      const over = Math.max(...st.heights) > maxRows
      if (full.length || over) {
        const rows = full.length ? full : [0]
        const { state: s } = live.current
        const goal = s.goals.find((g) => g.id === s.currentGoalId)
        const phrase = getPhrase('lineClear', {
          lang: s.settings.lang, name: s.profile.username, goal, liked: s.profile.likedPhrases,
        })
        ctx.font = '13px "Press Start 2P", monospace'
        st.freeze = { rows, t: 0, phrase, textW: phrase ? ctx.measureText(phrase.text).width : 0, liked: false }
        const snd = live.current.state.settings
        if (snd.sound) sfx.clear(snd.volume) // фанфара синхронно со сгоранием
      }
    }

    const onClick = (e) => {
      const f = st.freeze
      if (!f || !f.phrase || f.liked) return
      const rect = canvas.getBoundingClientRect()
      const y = e.clientY - rect.top
      if (f.rows.some((r) => { const ry = H - (r + 1) * cell; return y > ry - 8 && y < ry + cell + 8 })) {
        f.liked = true
        actions.current.likePhrase(f.phrase.id)
        fx.fire('dots', e.clientX, e.clientY, { n: 6 })
      }
    }
    canvas.style.pointerEvents = 'auto'
    canvas.addEventListener('click', onClick)

    const drawCell = (x, y, color) => {
      ctx.fillStyle = color
      ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2)
      ctx.fillStyle = 'rgba(255,255,255,0.38)'
      ctx.fillRect(x + 1, y + 1, cell - 2, 4)
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      ctx.fillRect(x + 1, y + cell - 5, cell - 2, 4)
    }

    const FREEZE_LEN = 6
    const loop = createLoop((dt) => {
      const focus = live.current.phase === 'focus'
      if (focus && !st.freeze) st.focusT += dt

      ctx.clearRect(0, 0, W, H)

      st.grid.forEach((rowArr, r) => {
        if (!rowArr) return
        const fz = st.freeze && st.freeze.rows.includes(r)
        rowArr.forEach((color, c) => {
          if (!color) return
          const y = H - (r + 1) * cell
          if (fz) drawCell(c * cell, y, Math.sin(st.freeze.t * 14) > -0.2 ? '#ffffff' : '#4dd7ff')
          else drawCell(c * cell, y, color)
        })
      })

      if (st.freeze) {
        const f = st.freeze
        f.t += dt
        if (f.phrase) {
          const rowY = H - (Math.max(...f.rows) + 1) * cell
          const travel = W + f.textW + 40
          const tx = -f.textW + (f.t / (FREEZE_LEN - 0.5)) * travel
          ctx.font = '13px "Press Start 2P", monospace'
          ctx.fillStyle = '#0a0e1e'
          ctx.fillRect(Math.max(0, tx - 12), rowY + 1, f.textW + 46, cell - 2)
          ctx.fillStyle = f.liked ? '#ffd23f' : '#0affd0'
          ctx.fillText(f.phrase.text, tx, rowY + cell / 2 + 5)
          ctx.fillText(f.liked ? '♥' : '♡', tx + f.textW + 14, rowY + cell / 2 + 5)
        }
        if (f.t >= FREEZE_LEN) {
          f.rows.sort((a, b) => b - a).forEach((row) => st.grid.splice(row, 1))
          st.heights = new Array(cols).fill(0)
          st.grid.forEach((rowArr, r) => rowArr && rowArr.forEach((color, c) => {
            if (color) st.heights[c] = Math.max(st.heights[c], r + 1)
          }))
          st.lines += f.rows.length
          try { actions.current.addLines(f.rows.length) } catch { /* ок */ }
          st.freeze = null
          st.spawnT = 0.5 // сразу продолжаем партию
        }
        return
      }

      // непрерывный поток: следующая фигура почти сразу после посадки
      if (!st.piece) {
        st.spawnT += dt
        if (st.spawnT > 0.8) spawn()
      }

      const p = st.piece
      if (p) {
        const mul = speedMul()
        const ev = evalSlot(p.cells, p.col)
        const ry = H - (ev.rowBase + p.h) * cell
        const flying = p.y > H * 0.14 // «немного пролетела»

        if (p.fast && !p.drop && flying) {
          // фаза руления: доворот до нужной ориентации…
          p.rotT += dt
          if (p.rot % 4 !== p.targetRot % 4 && p.rotT > 0.16) {
            p.rotT = 0
            p.rot = (p.rot + 1) % 4
            p.cells = rotate(p.base, p.rot)
            const [w, h] = dims(p.cells)
            p.w = w; p.h = h
            p.col = Math.max(0, Math.min(cols - w, p.col))
            p.x = Math.min(p.x, (cols - w) * cell)
          }
          // …и плавный сдвиг к слоту, как рукой игрока
          const tx = p.targetCol * cell
          if (Math.abs(p.x - tx) > 1.5) {
            p.x += Math.sign(tx - p.x) * Math.min(Math.abs(tx - p.x), 620 * dt)
            p.col = Math.max(0, Math.min(cols - p.w, Math.round(p.x / cell)))
          } else if (p.rot % 4 === p.targetRot % 4) {
            p.col = p.targetCol; p.x = tx
            p.drop = true // выровнялась → hard drop
            p.g = 6500; p.vmax = 2100
          }
        }
        if (!p.fast) {
          // обычная: лёгкий дрейф к слоту в верхней трети
          if (p.y < ry - 3 * cell && p.col !== p.targetCol) {
            p.x += (p.targetCol * cell - p.x) * Math.min(1, 3.4 * dt)
            p.col = Math.max(0, Math.min(cols - p.w, Math.round(p.x / cell)))
          }
          if (flying) p.g = 300 * mul // пролетела — ускоряется
        }

        p.v = Math.min(p.vmax, p.v + p.g * dt)
        p.y += p.v * dt

        if (p.drop) {
          p.trail.push(p.y)
          if (p.trail.length > 9) p.trail.shift()
          p.trail.forEach((ty, k) => {
            ctx.globalAlpha = ((k + 1) / p.trail.length) * 0.25
            p.cells.forEach(([x, y]) => {
              ctx.fillStyle = p.color
              ctx.fillRect(p.col * cell + x * cell + 3, ty + y * cell + 3, cell - 6, cell - 6)
            })
          })
          ctx.globalAlpha = 1
        }

        const ry2 = H - (evalSlot(p.cells, p.col).rowBase + p.h) * cell
        if (p.y >= ry2) landPiece(p)
        else p.cells.forEach(([x, y]) => drawCell(p.col * cell + x * cell, p.y + y * cell, p.color))
      }
    })
    loop.start()
    return () => {
      loop.stop()
      canvas.removeEventListener('click', onClick)
      window.removeEventListener('resize', resize)
    }
  }, [enabled])

  return (
    <div className="scene scene-blocks">
      <div className="bl-grid" />
      {enabled && <canvas ref={canvasRef} className="bl-canvas" aria-hidden="true" />}
    </div>
  )
}
