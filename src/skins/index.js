// Реестр скинов. Каждый скин — самодостаточный модуль:
// Scene (анимации+физика), свой CSS, burst (тип canvas-салюта), labelKey (i18n).
import * as pixel from './pixel/index.jsx'
import * as maze from './maze/index.jsx'
import * as blocks from './blocks/index.jsx'
import * as invaders from './invaders/index.jsx'
import * as synth from './synth/index.jsx'
import { EXTRA_MODULES } from './extra/index.jsx'
import './shared.css'

export const SKIN_MODULES = { pixel, maze, blocks, invaders, synth, ...EXTRA_MODULES }
export const SKIN_IDS = ['classic', 'pixel', 'maze', 'blocks', 'invaders', 'synth']
export const EXTRA_IDS = Object.values(EXTRA_MODULES).map((m) => m.id)
export const SKIN_LABEL = {
  classic: 'skinClassic',
  ...Object.fromEntries(Object.values(SKIN_MODULES).map((m) => [m.id, m.labelKey])),
}
export const burstFor = (skin) => SKIN_MODULES[skin]?.burst || 'confetti'
