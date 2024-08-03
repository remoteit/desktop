import React from 'react'
import logo from './cachengo.png'
import { platforms } from '..'

const Component = ({ darkMode, ...props }) => {
  return <img src={logo} alt="Cachengo" {...props} />
}

platforms.register({
  id: 'cachengo',
  name: 'Cachengo',
  component: Component,
  types: { 1224: 'Cachengo' },
})
