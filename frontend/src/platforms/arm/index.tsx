import React from 'react'
import { platforms } from '..'
import logo from './arm.svg'

const Component = ({ darkMode, ...props }) => {
  return <img src={logo} alt="arm" {...props} />
}

platforms.register({
  id: 'arm',
  name: 'Arm Virtual Hardware',
  component: Component,
  types: { 1217: 'AVH' },
  installation: {
    command: true,
    qualifier: 'For the Arm Virtual Hardware platform.',
    link: 'https://link.remote.it/support/streamline-install',
  },
})
