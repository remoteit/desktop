import React from 'react'
import { platforms } from '..'
import logo from './ubiquiti.svg'

const Component = ({ darkMode, ...props }) => {
  return <img src={logo} alt="Ubiquiti" {...props} />
}

platforms.register({
  id: 'ubiquiti',
  name: 'Ubiquiti',
  component: Component,
  types: { 1218: 'Ubiquiti Router' },
  installation: {
    command: true,
    qualifier: 'For Ubiquiti routers',
    link: 'https://link.remote.it/support/streamline-install',
  },
})
