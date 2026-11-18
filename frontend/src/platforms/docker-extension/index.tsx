import React from 'react'
import { platforms } from '..'
import { Link } from '../../components/Link'
import logo from '../docker/docker.svg'

const Component = ({ darkMode, ...props }) => {
  return <img src={logo} alt="Docker Extension" {...props} />
}

platforms.register({
  id: 'docker-extension',
  component: Component,
  installation: {
    instructions: (
      <>
        For more information please download Docker Desktop and install our extension or
        <Link href="docker-desktop://dashboard/extension-tab?extensionId=remoteit/docker-extension">
          open the extension page
        </Link>
        if it's already installed.
      </>
    ),
  },
})
