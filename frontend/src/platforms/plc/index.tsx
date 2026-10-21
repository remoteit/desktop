import React from 'react'
import { platforms } from '..'

// A machine that runs no daemon: a virtual device's platform, chosen by its owner (./virtual.ts).
const Component = ({ darkMode, ...props }) => {
  const light = darkMode ? '#444' : '#bbb'
  const dark = '#808080'
  return (
    <svg viewBox="0 0 256 256" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="16" y="56" width="224" height="144" rx="14" fill={dark} />
      <rect x="44" y="56" width="20" height="144" fill={light} />
      <rect x="192" y="56" width="20" height="144" fill={light} />
      <circle cx="104" cy="100" r="12" fill={light} />
      <circle cx="152" cy="100" r="12" fill={light} />
      <rect x="92" y="138" width="72" height="16" rx="8" fill={light} />
      <rect x="84" y="30" width="16" height="26" fill={dark} />
      <rect x="156" y="30" width="16" height="26" fill={dark} />
    </svg>
  )
}

platforms.register({
  id: 'plc',
  name: 'PLC',
  virtualOnly: true,
  component: Component,
  types: { 1282: 'PLC' },
})
