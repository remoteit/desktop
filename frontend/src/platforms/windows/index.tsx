import React from 'react'
import platforms from '..'

const Icon = props => {
  return (
    <svg viewBox="0 -10 88 100" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fill="#0078D6" fillRule="nonzero">
        <polyline points="0 12.5 35.7 7.6 35.7 42.1 0 42.1"></polyline>
        <polyline points="40 6.9 87.3 0 87.3 41.8 40 41.8"></polyline>
        <polyline points="0 45.74 35.7 45.74 35.7 80.34 0 75.34"></polyline>
        <polyline points="40 46.2 87.3 46.2 87.3 87.6 40 80.9"></polyline>
      </g>
    </svg>
  )
}

platforms.register({
  id: 'windows',
  name: 'Windows',
  component: Icon,
  types: { 0: 'Windows', 5: 'Windows Desktop', 10: 'Windows Server' },
})
