import React from 'react'
import { platforms } from '..'

const Component = ({ darkMode, ...props }) => {
  return (
    <svg viewBox="0 0 377 448" version="1.1" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g fill={darkMode ? '#ddd' : '#666'}>
        <path d="M314.7,236.7 C314.5,200 331.1,172.3 364.7,151.9 C345.9,125 317.5,110.2 280,107.3 C244.5,104.5 205.7,128 191.5,128 C176.5,128 142.1,108.3 115.1,108.3 C59.3,109.2 0,152.8 0,241.5 C0,267.7 4.8,294.766667 14.4,322.7 C27.2,359.4 73.4,449.4 121.6,447.9 C146.8,447.3 164.6,430 197.4,430 C229.2,430 245.7,447.9 273.8,447.9 C322.4,447.2 364.2,365.4 376.4,328.6 C311.2,297.9 314.7,238.6 314.7,236.7 Z M258.1,72.5 C285.4,40.1 282.9,10.6 282.1,0 C258,1.4 230.1,16.4 214.2,34.9 C196.7,54.7 186.4,79.2 188.6,106.8 C214.7,108.8 238.5,95.4 258.1,72.5 Z"></path>
      </g>
    </svg>
  )
}

platforms.register({
  id: 'mac',
  name: 'Mac',
  component: Component,
  types: { 256: 'Mac' },
  installation: {
    instructions: 'Install the Desktop or CLI on the Mac to you want to enable remote access to.',
    qualifier: 'Macintosh installation',
    link: 'https://link.remote.it/download',
  },
})
