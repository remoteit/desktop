import React from 'react'
import browser from '../../services/browser'
import { platforms } from '..'
import logo from './windows.svg'

const Component = ({ darkMode, ...props }) => {
  return <img src={logo} alt="Windows" {...props} />
}

platforms.register({
  id: 'windows',
  component: Component,
  installation: {
    altLink: browser.isWindows ? '/devices/setup' : undefined,
  },
})
