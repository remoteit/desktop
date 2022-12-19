import React from 'react'
import { platforms } from '..'

const Component = ({ darkMode, ...props }) => {
  return (
    <svg viewBox="0 -12 71 72" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fillRule="nonzero">
        <polygon fill="#FFCC33" points="13.5 34.1 35.4 0 70.8 55.2 46.7 55.2 33.2 34.1"></polygon>
        <polygon fill="#000000" points="33.2 34.1 29.6 34.1 43.2 55.2 46.7 55.2"></polygon>
        <polygon fill="#FF0033" points="29.6 34.1 43.2 55.2 1.42108547e-14 55.2 13.5 34.1"></polygon>
      </g>
    </svg>
  )
}

platforms.register({
  id: 'axis',
  name: 'AXIS',
  component: Component,
  types: { 1209: 'AXIS' },
  installation: {
    command: true,
    qualifier: 'For AXIS camera systems',
    link: 'https://link.remote.it/support/streamline-install',
  },
})
