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
  // installation: {
  //   instructions: 'Install the Desktop or CLI on the Windows system to you want to enable remote access to.',
  //   qualifier: 'Windows installation',
  //   link: 'https://link.remote.it/download',
  // },
})
