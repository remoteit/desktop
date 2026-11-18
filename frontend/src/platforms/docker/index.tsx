import React from 'react'
import { platforms } from '..'
import { Link } from '../../components/Link'
import logo from './docker.svg'

const Component = ({ darkMode, ...props }) => {
  return <img src={logo} alt="Docker" {...props} />
}

platforms.register({
  id: 'docker',
  component: Component,
  installation: {
    instructions: (
      <>
        For production settings please visit our
        <Link href="https://hub.docker.com/r/remoteit/remoteit-agent">Docker Hub page.</Link>
      </>
    ),
  },
})
