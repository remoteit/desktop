import React from 'react'
import { platforms } from '..'
import logo from './ubiquiti.svg'

const Component = ({ darkMode, ...props }) => {
  return <img src={logo} alt="Ubiquiti" {...props} />
}

platforms.register({
  id: 'ubiquiti',
  component: Component,
})
