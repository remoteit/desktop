import React from 'react'
import { platforms } from '..'

const Component = ({ darkMode, ...props }) => {
  const base = darkMode ? '#fff' : '#001A77'
  return (
    <svg viewBox="120 120 272 272" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
      <title>Teltonika</title>
      <path
        fill={base}
        d="m333.421 331.002-72.438-75.113 72.438-75.002 26.039 27.072 32.04-33.174-32.04-33.285-32.04 33.285-32.147-33.285-32.04 33.285-32.147-33.285L120.5 256l110.586 114.5 32.147-33.174 32.04 33.174 32.147-33.174 32.04 33.174 32.04-33.174-32.04-33.174zm-128.267 0-72.438-75.113 72.438-74.891 26.039 26.961L184.687 256l46.506 48.152zm64.08 0-72.438-75.113 72.438-75.002 26.039 26.961-46.399 48.041 46.399 48.152z"
      />
    </svg>
  )
}

platforms.register({
  id: 'teltonika',
  name: 'Teltonika',
  component: Component,
  types: { 1281: 'Teltonika' },
})
