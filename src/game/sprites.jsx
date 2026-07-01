import React from 'react'

/* Общие помощники пиксель-арта: рендер битмапов в SVG.
   Все спрайты в skins/ — собственные оммажи, не копии чужих ассетов. */

export function PixelSprite({ map, size = 4, color = '#9ef01a', className, style }) {
  const rects = []
  map.forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (c === '1') rects.push(<rect key={`${x}-${y}`} x={x * size} y={y * size} width={size} height={size} />)
    })
  })
  return (
    <svg
      className={className}
      style={style}
      width={map[0].length * size}
      height={map.length * size}
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {rects}
    </svg>
  )
}

export function ColorSprite({ map, palette, size = 4, className }) {
  const rects = []
  map.forEach((row, y) => {
    [...row].forEach((c, x) => {
      if (c !== '0') rects.push(<rect key={`${x}-${y}`} x={x * size} y={y * size} width={size} height={size} fill={palette[c]} />)
    })
  })
  return (
    <svg className={className} width={map[0].length * size} height={map.length * size} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {rects}
    </svg>
  )
}
