import React from 'react'
import { platforms } from '..'
import { Link } from '../../components/Link'
import logo from '../docker/docker.svg'

const Component = ({ darkMode, ...props }) => {
  return <img src={logo} alt="Docker Jumpbox" {...props} />
}

platforms.register({
  id: 'docker-jumpbox',
  component: Component,
  installation: {
    instructions: (
      <>
        For production settings please visit our
        <Link href="https://hub.docker.com/r/remoteit/docker-extension">Docker Hub page.</Link>
      </>
    ),
  },
})
