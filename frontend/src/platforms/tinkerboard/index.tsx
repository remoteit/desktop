import React from 'react'
import dark from './tinkerboard-dark.png'
import light from './tinkerboard-light.png'
import { platforms } from '..'

const Component = ({ darkMode, ...props }) => {
  return <img src={darkMode ? dark : light} alt="ASUS Tinker Board" {...props} />
}

platforms.register({
  id: 'tinkerboard',
  name: 'ASUS Tinker Board',
  component: Component,
  types: { 1215: 'ASUS Tinker Board' },
  installation: {
    command: true,
    qualifier: 'For the ASUS Tinker Board:',
    link: 'https://link.remote.it/support/streamline-install',
  },
})
