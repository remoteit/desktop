import React from 'react'
import browser from '../../services/browser'
import { platforms } from '..'
import logo from './windows.svg'

const Component = ({ darkMode, ...props }) => {
  return <img src={logo} alt="Windows" {...props} />
}

platforms.register({
  id: 'windows',
  name: 'Windows',
  component: Component,
  types: { 0: 'Windows', 5: 'Windows Desktop', 10: 'Windows Server' },
  installation: {
    qualifier: 'Windows installation',
    instructions: 'Install the Desktop or CLI on the Windows system to you want to enable remote access to.',
    link: 'https://link.remote.it/download/desktop',
    altLink: browser.isWindows ? '/devices/setup' : undefined,
  },
})
