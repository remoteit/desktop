import React from 'react'
import { platforms } from '..'
import logo from './docker.svg'

const Component = ({ darkMode, ...props }) => {
  return <img src={logo} alt="Docker" {...props} />
}

platforms.register({
  id: 'docker',
  name: 'Docker',
  component: Component,
  types: { 1219: 'Docker Container' },
  // installation: {
  //   instructions: 'Install the Desktop or CLI on the Windows system to you want to enable remote access to.',
  //   qualifier: 'Windows installation',
  //   link: 'https://link.remote.it/download',
  // },
})
