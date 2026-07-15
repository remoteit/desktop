import React from 'react'
import { platforms } from '..'

const Component = ({ darkMode, ...props }) => {
  const base = darkMode ? '#fff' : '#707372'
  return (
    <svg viewBox="0 0 256 256" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
      <title>TOA</title>
      <polygon fill={base} points="96 256 0 256 96 160 96 256" />
      <polygon fill={base} points="0 240 0 176 64 112 128 112 0 240" />
      <polygon fill="#ff8200" points="0 160 0 64 96 64 0 160" />
      <rect fill={base} x="0" width="256" height="16" />
      <polygon fill={base} points="256 256 160 256 160 112 192 112 256 48 256 256" />
    </svg>
  )
}

platforms.register({
  id: 'toa',
  name: 'TOA',
  component: Component,
  types: { 1228: 'TOA' },
})
