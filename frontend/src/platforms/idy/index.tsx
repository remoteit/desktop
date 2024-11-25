import React from 'react'
import { platforms } from '..'

const Component = ({ darkMode, ...props }) => {
  return (
    <svg viewBox="0 0 170 100" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
      <title>IDY Icon</title>
      <defs>
        <radialGradient
          cx="24.4846031%"
          cy="73.3522342%"
          fx="24.4846031%"
          fy="73.3522342%"
          r="75.6147541%"
          id="radialGradient-1"
        >
          <stop stopColor="#FFFFFF" offset="0%"></stop>
          <stop stopColor="#BA3634" offset="100%"></stop>
        </radialGradient>
      </defs>
      <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <g id="IDY-Icon" fillRule="nonzero">
          <path
            d="M54.8,39.4 L57.5,34 C33.1,35.6 12.4,40.7 0.1,47.9 C11.8,42.8 31.3,39.4 53.4,39.4 C75.5,39.4 54.3,39.4 54.8,39.4"
            fill="#3459A2"
          ></path>
          <rect
            fill="url(#radialGradient-1)"
            transform="translate(83.200000, 12.200000) rotate(-270.000000) translate(-83.200000, -12.200000) "
            x="71"
            y="0"
            width="24.4"
            height="24.4"
            rx="12.2"
          ></rect>
          <path
            d="M88,34.5 L84,42.4 C103.7,45.8 116.9,52.2 116.9,59.6 C116.9,67 92.3,77.9 60.5,79.2 L86.2,29.2 C85.2,29.4 84.2,29.5 83.2,29.5 C77.1,29.5 71.7,26.3 68.6,21.5 L35.8,85.2 C33.3,89.6 35.5,93.1 40.8,93.1 L70.9,93.1 C71.3,93.1 71.6,93.1 72,93.1 C72.4,93.1 72.8,93.1 73.3,93.1 L74.4,93.1 C120.4,92.7 157.3,79.6 157.3,63.5 C157.3,47.4 127.6,37.1 88.2,34.5 L88,34.5 Z"
            fill="#3459A2"
          ></path>
        </g>
      </g>
    </svg>
  )
}

platforms.register({
  id: 'idy',
  name: 'IDY',
  component: Component,
  types: { 1225: 'IDY' },
  installation: {
    command:
      'config net-remoteit-agent=enable; config net-remoteit-registration_code=[CODE]; /etc/init.d/remoteit- refresh start',
    qualifier: 'For IDY routers and gateways',
    link: 'https://link.remote.it/support/streamline-install',
  },
})
