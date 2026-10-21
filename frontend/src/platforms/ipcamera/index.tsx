import React from 'react'
import { platforms } from '..'

// A machine that runs no daemon: a virtual device's platform, chosen by its owner (./virtual.ts).
const Component = ({ darkMode, ...props }) => {
  const light = darkMode ? '#444' : '#bbb'
  const dark = '#808080'
  return (
    <svg viewBox="0 0 256 256" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="16" y="72" width="158" height="112" rx="18" fill={dark} />
      <path d="M174 112 L240 76 V180 L174 144 Z" fill={light} />
      <circle cx="78" cy="128" r="30" fill={light} />
      <circle cx="78" cy="128" r="14" fill={dark} />
    </svg>
  )
}

platforms.register({
  id: 'ipcamera',
  name: 'IP camera',
  virtualOnly: true,
  component: Component,
  types: { 1283: 'IP camera' },
})
