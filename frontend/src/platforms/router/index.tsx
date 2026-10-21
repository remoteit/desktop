import React from 'react'
import { platforms } from '..'

// A machine that runs no daemon: a virtual device's platform, chosen by its owner (./virtual.ts).
const Component = ({ darkMode, ...props }) => {
  const light = darkMode ? '#444' : '#bbb'
  const dark = '#808080'
  return (
    <svg viewBox="0 0 256 256" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="12" y="120" width="232" height="84" rx="14" fill={dark} />
      <rect x="44" y="40" width="12" height="80" rx="6" fill={light} />
      <rect x="200" y="40" width="12" height="80" rx="6" fill={light} />
      <circle cx="52" cy="162" r="10" fill={light} />
      <circle cx="84" cy="162" r="10" fill={light} />
      <rect x="128" y="152" width="20" height="20" rx="3" fill={light} />
      <rect x="156" y="152" width="20" height="20" rx="3" fill={light} />
      <rect x="184" y="152" width="20" height="20" rx="3" fill={light} />
    </svg>
  )
}

platforms.register({
  id: 'router',
  name: 'Router / Switch',
  virtualOnly: true,
  component: Component,
  types: { 1286: 'Router / Switch' },
})
