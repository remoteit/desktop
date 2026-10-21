import React from 'react'
import { platforms } from '..'

// A machine that runs no daemon: a virtual device's platform, chosen by its owner (./virtual.ts).
const Component = ({ darkMode, ...props }) => {
  const light = darkMode ? '#444' : '#bbb'
  const dark = '#808080'
  return (
    <svg viewBox="0 0 256 256" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="12" y="32" width="232" height="164" rx="14" fill={dark} />
      <rect x="32" y="52" width="150" height="124" rx="6" fill={light} />
      <circle cx="214" cy="80" r="12" fill={light} />
      <circle cx="214" cy="120" r="12" fill={light} />
      <rect x="202" y="148" width="24" height="16" rx="4" fill={light} />
      <rect x="96" y="196" width="64" height="32" fill={dark} />
    </svg>
  )
}

platforms.register({
  id: 'hmi',
  name: 'HMI / Industrial PC',
  virtualOnly: true,
  component: Component,
  types: { 1285: 'HMI / Industrial PC' },
})
