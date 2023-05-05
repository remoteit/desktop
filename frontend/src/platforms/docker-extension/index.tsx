import React from 'react'
import { platforms } from '..'
import { Link } from '../../components/Link'
import logo from '../docker/docker.svg'

const Component = ({ darkMode, ...props }) => {
  return <img src={logo} alt="Docker" {...props} />
}

platforms.register({
  id: 'docker-extension',
  name: 'Docker Jumpbox Extension',
  component: Component,
  types: { 1220: 'Docker Extension' },
  services: [],
  installation: {
    label: 'Registration Code',
    command: '[CODE]',
    instructions: (
      <>
        For more information please download Docker Desktop and install our extension or
        <Link href="docker-desktop://dashboard/extension-tab?extensionId=remoteit/docker-extension">
          open the extension page
        </Link>
        if it's already installed.
      </>
    ),
    qualifier: 'For docker desktop',
  },
})
