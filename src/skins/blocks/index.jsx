import React, { useEffect, useRef } from 'react'
import { createLoop } from '../../game/engine.js'
import { useApp } from '../../store.jsx'
import { getPhrase } from '../../motivation.js'
import { fx } from '../../game/fx.js'
import './blocks.css'

export const id = 'blocks'
export const labelKey = 'skinBlocks'
export const burst = 'cells'

/* ТЕТРИС-ИГРОК v3 (по ТЗ):
   — падает ОДНА фигура; каждая 2-я/3-я (рандом) — ускоренная со шлейфом,
     НО только если найден ИДЕАЛЬНЫЙ слот (ложится вплотную, без дыр) —
     именно ускоренные и собирают линии;
   — темп подобран так, чтобы стакан заполнился до уровня таймера за ~25 минут
     и редко поднимался выше (контроллер темпа по целевой кривой);
   — сгорание линии: всё замирает на ~6 сек, ряд мигает, по нему слева направо
     проезжает мотивационная фраза; клик по ряду = лайк (личное предпочтение). */

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
  for (let i = 0; i < times; i += 1) {
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

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext && canvas.getContext('2d')
    if (!ctx) return undefined

    let W = 0; let H = 0; let cell = 26; let cols = 40; let maxRows = 8
    const st = {
      grid: [], heights: [],
      piece: null, n: 0, fastDue: 2 + ((Math.random() * 2) | 0),
      spawnT: 2, focusT: 0,
      freeze: null, // {rows, t, phrase, textW}
    }

    const resize = () => {
      W = canvas.width = canvas.offsetWidth || window.innerWidth
      H = canvas.height = canvas.offsetHeight || window.innerHeight
      cell = Math.max(20, Math.floor(W / 44))
      cols = Math.floor(W / cell)
      // потолок стакана — нижняя кромка карточки таймера (визуал учитывает меню)
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

    const filledCells = () => st.heights.reduce((a, b) => a + b, 0)

    // оценка слота: rowBase и дыры (зазоры под фигурой)
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
      const shape = SHAPES[(Math.random() * SHAPES.length) | 0]
      // перебираем повороты и позиции: ищем идеальные слоты и лучший обычный
      let perfect = null; let best = null
      for (let r = 0; r < 4; r += 1) {
        const cells = rotate(shape.cells, r)
        const [w] = dims(cells)
        for (let c = 0; c <= cols - w; c += 1) {
          const ev = evalSlot(cells, c)
          if (!ev) continue
          const score = ev.holes * 3 + ev.rowBase + Math.random() * 0.9
          if (!best || score < best.score) best = { cells, col: c, score, ...ev }
          if (ev.holes === 0 && ev.rowBase + ev.h <= maxRows) {
            if (!perfect || ev.rowBase < perfect.rowBase) perfect = { cells, col: c, ...ev }
          }
        }
      }
      const wantFast = st.n >= st.fastDue
      const fast = wantFast && !!perfect // ускоренная ТОЛЬКО в идеальный слот
      if (fast) st.fastDue = st.n + 2 + ((Math.random() * 2) | 0) // каждая 2-я/3-я
      const slot = fast ? perfect : best
      if (!slot) return
      const startCol = Math.max(0, Math.min(cols - slot.w, slot.col + ((Math.random() * 6) | 0) - 3))
      st.piece = {
        cells: slot.cells, color: shape.c, w: slot.w, h: slot.h,
        col: startCol, targetCol: slot.col,
        x: startCol * cell, y: -slot.h * cell - 10,
        v: fast ? 500 : 26, vmax: fast ? 1900 : 95 + Math.random() * 40,
        g: fast ? 5200 : 78, fast, trail: [],
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
      // полные ряды → freeze с фразой
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
      }
    }

    // клик по мигающему ряду с фразой = лайк
    const onClick = (e) => {
      const f = st.freeze
      if (!f || !f.phrase || f.liked) return
      const rect = canvas.getBoundingClientRect()
      const y = e.clientY - rect.top
      const inBand = f.rows.some((r) => {
        const ry = H - (r + 1) * cell
        return y > ry - 8 && y < ry + cell + 8
      })
      if (inBand) {
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

    const FREEZE_LEN = 6.2
    const loop = createLoop((dt) => {
      const focus = live.current.phase === 'focus'
      if (focus && !st.freeze) st.focusT += dt

      ctx.clearRect(0, 0, W, H)

      // --- стакан ---
      st.grid.forEach((rowArr, r) => {
        if (!rowArr) return
        const fz = st.freeze && st.freeze.rows.includes(r)
        rowArr.forEach((color, c) => {
          if (!color) return
          const y = H - (r + 1) * cell
          if (fz) {
            const blink = Math.sin(st.freeze.t * 14) > -0.2
            drawCell(c * cell, y, blink ? '#ffffff' : '#4dd7ff')
          } else drawCell(c * cell, y, color)
        })
      })

      // --- freeze: фраза едет по мигающему ряду ---
      if (st.freeze) {
        const f = st.freeze
        f.t += dt
        if (f.phrase) {
          const rowY = H - (Math.max(...f.rows) + 1) * cell
          const travel = W + f.textW + 40
          const tx = -f.textW + (f.t / (FREEZE_LEN - 0.6)) * travel
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
          try { actions.current.addLines(f.rows.length) } catch { /* ок */ }
          st.freeze = null
        }
        return // всё замерло, кроме фразы
      }

      // --- контроллер темпа: заполнение до таймера за ~25 минут фокуса ---
      if (!st.piece) {
        st.spawnT += dt
        const fillNow = filledCells() / (cols * maxRows)
        const fillTarget = Math.min(0.9, (st.focusT / 1500) + 0.06)
        const interval = fillNow < fillTarget - 0.04 ? 2.6 : fillNow > fillTarget + 0.04 ? 15 : 7.5
        if (st.spawnT > interval) { st.spawnT = 0; spawn() }
      }

      // --- активная фигура ---
      const p = st.piece
      if (p) {
        const ev = evalSlot(p.cells, p.col)
        const ry = H - (ev.rowBase + p.h) * cell
        if (p.y < ry - 3 * cell && p.col !== p.targetCol) {
          p.x += (p.targetCol * cell - p.x) * Math.min(1, 3.4 * dt)
          p.col = Math.max(0, Math.min(cols - p.w, Math.round(p.x / cell)))
        } else if (p.col !== p.targetCol && p.y < ry - cell) {
          p.col = p.targetCol; p.x = p.targetCol * cell
        }
        p.v = Math.min(p.vmax, p.v + p.g * dt)
        p.y += p.v * dt
        if (p.fast) {
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
  }, [])

  return (
    <div className="scene scene-blocks">
      <div className="bl-grid" />
      <canvas ref={canvasRef} className="bl-canvas" aria-hidden="true" />
    </div>
  )
}
