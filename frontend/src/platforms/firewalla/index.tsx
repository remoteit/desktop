import React from 'react'
import { platforms } from '..'
import logo from './firewalla.png'

const Component = ({ darkMode, ...props }) => {
  return <img src={logo} alt="arm" {...props} />
}

platforms.register({
  id: 'firewalla',
  name: 'Firewalla',
  component: Component,
  types: { 1216: 'Firewalla' },
  installation: {
    command: true,
    qualifier: 'For any Firewalla system',
    link: 'https://link.remote.it/support/streamline-install',
  },
})
