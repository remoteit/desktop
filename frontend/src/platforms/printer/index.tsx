import React from 'react'
import { platforms } from '..'

// A machine that runs no daemon: a virtual device's platform, chosen by its owner (./virtual.ts).
const Component = ({ darkMode, ...props }) => {
  const light = darkMode ? '#444' : '#bbb'
  const dark = '#808080'
  return (
    <svg viewBox="0 0 256 256" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="64" y="20" width="128" height="68" rx="6" fill={light} />
      <rect x="16" y="80" width="224" height="104" rx="16" fill={dark} />
      <rect x="64" y="148" width="128" height="88" rx="6" fill={light} />
      <circle cx="204" cy="112" r="10" fill={light} />
    </svg>
  )
}

platforms.register({
  id: 'printer',
  name: 'Printer',
  virtualOnly: true,
  component: Component,
  types: { 1284: 'Printer' },
})
