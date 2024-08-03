import React from 'react'
import logo from './embedded-works-logo.png'
import { platforms } from '..'

const Component = ({ darkMode, ...props }) => {
  return <img src={logo} alt="Embedded Works" {...props} />
}

platforms.register({
  id: 'embedded-works',
  name: 'Embedded Works',
  component: Component,
  types: { 1223: 'Embedded Works' },
})
