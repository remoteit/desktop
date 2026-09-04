import React from 'react'
import { platforms } from '..'
import logo from './firewalla.png'

const Component = ({ darkMode, ...props }) => {
  return <img src={logo} alt="arm" {...props} />
}

platforms.register({
  id: 'firewalla',
  component: Component,
})
