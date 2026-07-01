import React from 'react'
import './extra.css'

/* Дополнительные обложки (не аркады): показываются в пикере под «Ещё». */

const make = (skinId, labelKey, burstType, body) => ({
  id: skinId,
  labelKey,
  burst: burstType,
  Scene: function ExtraScene({ prog, phase }) {
    return <div className={`scene scene-${skinId}`} data-focus={phase === 'focus' ? '1' : '0'} style={{ '--p': prog }}>{body}</div>
  },
})

export const cosmos = make('cosmos', 'skinCosmos', 'confetti', (
  <>
    <div className="cs-stars s1" /><div className="cs-stars s2" /><div className="cs-stars s3" />
    <div className="cs-nebula" /><div className="cs-planet" /><div className="cs-comet" />
  </>
))

export const minimal = make('minimal', 'skinMinimal', 'confetti', (
  <>
    <div className="mn-circle c1" /><div className="mn-circle c2" /><div className="mn-dot" />
  </>
))

export const zen = make('zen', 'skinZen', 'dots', (
  <>
    <div className="zn-sky" /><div className="zn-sun" />
    <div className="zn-wave w1" /><div className="zn-wave w2" /><div className="zn-wave w3" />
  </>
))

export const terminal = make('terminal', 'skinTerminal', 'bits', (
  <>
    <div className="tm-scan" />
    <div className="tm-stream t1">{'> focus_session --start\n> loading goals... ok\n> deep_work: enabled\n> distractions: killed\n> flow_state: 87%\n> keep_going...'}</div>
    <div className="tm-stream t2">{'01001101 10110010\n11010101 00101101\n10011010 11100101\n01110100 10010110'}</div>
    <div className="tm-cursor" />
  </>
))

export const aurora2 = make('aurora2', 'skinAurora', 'bars', (
  <>
    <div className="au-sky" /><div className="au-band b1" /><div className="au-band b2" />
    <div className="au-band b3" /><div className="au-stars" /><div className="au-ground" />
  </>
))

export const flow = make('flow', 'skinFlow', 'confetti', (
  <>
    <div className="fl-blob b1" /><div className="fl-blob b2" /><div className="fl-blob b3" /><div className="fl-grain" />
  </>
))

export const EXTRA_MODULES = { cosmos, minimal, zen, terminal, aurora2, flow }
