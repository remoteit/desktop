import React from 'react'
import dark from './tinkerboard-dark.png'
import light from './tinkerboard-light.png'
import { platforms } from '..'

const Component = ({ darkMode, ...props }) => {
  return <img src={darkMode ? dark : light} alt="ASUS Tinker Board" {...props} />
}

platforms.register({
  id: 'tinkerboard',
  component: Component,
})
