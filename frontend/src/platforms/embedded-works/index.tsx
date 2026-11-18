import React from 'react'
import logo from './embeddedworks.png'
import { platforms } from '..'

const Component = ({ darkMode, ...props }) => {
  return <img src={logo} alt="Embedded Works" {...props} />
}

platforms.register({
  id: 'embedded-works',
  component: Component,
})
