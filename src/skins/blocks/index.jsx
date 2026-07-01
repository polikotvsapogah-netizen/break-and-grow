import React, { useEffect, useRef } from 'react'
import { createLoop } from '../../game/engine.js'
import { useApp } from '../../store.jsx'
import './blocks.css'

export const id = 'blocks'
export const labelKey = 'skinBlocks'
export const burst = 'cells'

/* «Призрачный игрок»: симуляция партии в тетрис на canvas.
   — виртуальная сетка внизу экрана, фигуры реально СКЛАДЫВАЮТСЯ
   — бот целится в самый низкий столбец (с шумом) и планирует туда в полёте
   — обычные фигуры падают медленно, каждая 5-я — hard-drop со световым шлейфом
   — полные ряды вспыхивают и сгорают (line clear), стакан оседает */

const SHAPES = [
  { c: '#37d6e8', cells: [[0, 0], [1, 0], [2, 0], [3, 0]] }, // I
  { c: '#ffd23f', cells: [[0, 0], [1, 0], [0, 1], [1, 1]] }, // O
  { c: '#b06cf0', cells: [[0, 0], [1, 0], [2, 0], [1, 1]] }, // T
  { c: '#5ce65c', cells: [[1, 0], [2, 0], [0, 1], [1, 1]] }, // S
  { c: '#ff5d5d', cells: [[0, 0], [1, 0], [1, 1], [2, 1]] }, // Z
  { c: '#4d7cff', cells: [[0, 0], [0, 1], [1, 1], [2, 1]] }, // J
  { c: '#ff9f40', cells: [[2, 0], [0, 1], [1, 1], [2, 1]] }, // L
]

function rotate(cells, times) {
  let cs = cells
  for (let i = 0; i < times; i += 1) {
    const maxY = Math.max(...cs.map((c) => c[1]))
    cs = cs.map(([x, y]) => [maxY - y, x])
  }
  const minX = Math.min(...cs.map((c) => c[0]))
  const minY = Math.min(...cs.map((c) => c[1]))
  return cs.map(([x, y]) => [x - minX, y - minY])
}

export function Scene({ prog, phase }) {
  const canvasRef = useRef(null)
  const { addLines } = useApp()
  const live = useRef({ phase })
  live.current = { phase }
  const addLinesRef = useRef(addLines)
  addLinesRef.current = addLines

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext && canvas.getContext('2d')
    if (!ctx) return undefined

    let W = 0; let H = 0; let cell = 24; let cols = 40; let maxRows = 10
    const st = {
      grid: [],        // grid[row][col] = цвет | null, row 0 — дно
      heights: [],     // высота каждого столбца (в рядах)
      pieces: [],      // падающие фигуры
      clearing: [],    // сгорающие ряды {row, t}
      n: 0, spawnT: 1,
    }

    const resize = () => {
      W = canvas.width = canvas.offsetWidth || window.innerWidth
      H = canvas.height = canvas.offsetHeight || window.innerHeight
      cell = Math.max(18, Math.floor(W / 52))
      cols = Math.floor(W / cell)
      maxRows = Math.max(6, Math.floor((H * 0.52) / cell))
      st.grid = []
      st.heights = new Array(cols).fill(0)
      st.pieces = []
      st.clearing = []
    }
    resize()
    window.addEventListener('resize', resize)

    // куда целится «игрок»: столбцы с минимальной высотой (+шум = живость)
    const pickTarget = (w) => {
      let best = 0; let bestH = Infinity
      for (let c = 0; c <= cols - w; c += 1) {
        let h = 0
        for (let i = 0; i < w; i += 1) h = Math.max(h, st.heights[c + i])
        h += Math.random() * 1.2
        if (h < bestH) { bestH = h; best = c }
      }
      return best
    }

    const spawn = () => {
      st.n += 1
      const fast = st.n % 5 === 0 // каждая 5-я — hard drop
      const shape = SHAPES[(Math.random() * SHAPES.length) | 0]
      const cells = rotate(shape.cells, (Math.random() * 4) | 0)
      const w = Math.max(...cells.map((c) => c[0])) + 1
      const h = Math.max(...cells.map((c) => c[1])) + 1
      const target = pickTarget(w)
      // появляется в случайном месте и в полёте «доруливает» к цели — как рука игрока
      const startCol = Math.max(0, Math.min(cols - w, target + ((Math.random() * 10) | 0) - 5))
      st.pieces.push({
        cells, color: shape.c, w, h,
        x: startCol * cell, targetX: target * cell, col: startCol,
        y: -h * cell - Math.random() * 60,
        v: fast ? 420 : 30,
        vmax: fast ? 1700 : 120 + Math.random() * 55, // в 2 раза медленнее прежнего
        g: fast ? 4200 : 110,
        fast, trail: [],
      })
    }

    // нижний профиль фигуры: для каждого локального x — самая нижняя клетка
    const bottoms = (p) => {
      const b = {}
      p.cells.forEach(([x, y]) => { b[x] = Math.max(b[x] ?? -1, y) })
      return b
    }

    const land = (p) => {
      const b = bottoms(p)
      let rowBase = 0
      Object.entries(b).forEach(([lx, by]) => {
        const need = st.heights[p.col + Number(lx)] - (p.h - 1 - by)
        rowBase = Math.max(rowBase, need)
      })
      p.cells.forEach(([x, y]) => {
        const row = rowBase + (p.h - 1 - y)
        const col = p.col + x
        if (!st.grid[row]) st.grid[row] = new Array(cols).fill(null)
        st.grid[row][col] = p.color
        st.heights[col] = Math.max(st.heights[col], row + 1)
      })
      // полные ряды → сгорание
      st.grid.forEach((rowArr, r) => {
        if (rowArr && rowArr.filter(Boolean).length >= cols && !st.clearing.find((c) => c.row === r)) {
          st.clearing.push({ row: r, t: 0 })
        }
      })
      // защита от переполнения: стакан слишком высок — сжигаем низ
      if (Math.max(...st.heights) >= maxRows && st.clearing.length === 0) {
        st.clearing.push({ row: 0, t: 0 }, { row: 1, t: 0 })
      }
    }

    const restY = (p) => {
      const b = bottoms(p)
      let rowBase = 0
      Object.entries(b).forEach(([lx, by]) => {
        const need = st.heights[p.col + Number(lx)] - (p.h - 1 - by)
        rowBase = Math.max(rowBase, need)
      })
      return H - (rowBase + p.h) * cell
    }

    const drawCell = (x, y, color, alpha = 1) => {
      ctx.globalAlpha = alpha
      ctx.fillStyle = color
      ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2)
      ctx.fillStyle = 'rgba(255,255,255,0.38)'
      ctx.fillRect(x + 1, y + 1, cell - 2, 4)
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      ctx.fillRect(x + 1, y + cell - 5, cell - 2, 4)
      ctx.globalAlpha = 1
    }

    const loop = createLoop((dt) => {
      const focus = live.current.phase === 'focus'
      // темп «игрока»: в фокусе партия идёт бодрее
      st.spawnT += dt
      if (st.pieces.length < 2 && st.spawnT > (focus ? 1.1 : 1.9)) {
        st.spawnT = 0
        spawn()
      }

      ctx.clearRect(0, 0, W, H)

      // --- стакан ---
      st.grid.forEach((rowArr, r) => {
        if (!rowArr) return
        const flash = st.clearing.find((c) => c.row === r)
        rowArr.forEach((color, c) => {
          if (!color) return
          const y = H - (r + 1) * cell
          if (flash) {
            const blink = Math.sin(flash.t * 40) > 0
            drawCell(c * cell, y, blink ? '#ffffff' : color)
          } else {
            drawCell(c * cell, y, color)
          }
        })
      })

      // --- сгорание рядов ---
      if (st.clearing.length) {
        st.clearing.forEach((c) => { c.t += dt })
        const done = st.clearing.filter((c) => c.t > 0.45)
        if (done.length) {
          done.sort((a, b) => b.row - a.row).forEach(({ row }) => st.grid.splice(row, 1))
          st.clearing = []
          st.heights = new Array(cols).fill(0)
          st.grid.forEach((rowArr, r) => rowArr && rowArr.forEach((color, c) => {
            if (color) st.heights[c] = Math.max(st.heights[c], r + 1)
          }))
          try { addLinesRef.current(done.length) } catch { /* ок */ }
        }
      }

      // --- падающие фигуры ---
      for (let i = st.pieces.length - 1; i >= 0; i -= 1) {
        const p = st.pieces[i]
        // планирование к цели по горизонтали (пока высоко)
        const ry = restY(p)
        if (p.y < ry - 3 * cell && Math.abs(p.x - p.targetX) > 0.5) {
          p.x += (p.targetX - p.x) * Math.min(1, 3.2 * dt)
          p.col = Math.max(0, Math.min(cols - p.w, Math.round(p.x / cell)))
        }
        // вертикаль: ускорение до терминальной скорости
        p.v = Math.min(p.vmax, p.v + p.g * dt)
        p.y += p.v * dt

        // шлейф hard-drop
        if (p.fast) {
          p.trail.push(p.y)
          if (p.trail.length > 9) p.trail.shift()
          p.trail.forEach((ty, k) => {
            const a = ((k + 1) / p.trail.length) * 0.22
            p.cells.forEach(([x, y]) => {
              ctx.globalAlpha = a
              ctx.fillStyle = p.color
              ctx.fillRect(p.col * cell + x * cell + 3, ty + y * cell + 3, cell - 6, cell - 6)
            })
          })
          ctx.globalAlpha = 1
        }

        if (p.y >= ry) { // посадка
          p.col = Math.max(0, Math.min(cols - p.w, Math.round(p.x / cell)))
          land(p)
          st.pieces.splice(i, 1)
          continue
        }
        p.cells.forEach(([x, y]) => drawCell(p.col * cell + x * cell, p.y + y * cell, p.color))
      }
    })
    loop.start()
    return () => {
      loop.stop()
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
