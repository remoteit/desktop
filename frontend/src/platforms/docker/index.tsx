import React from 'react'
import { platforms } from '..'
import { Link } from '../../components/Link'
import logo from './docker.svg'

const Component = ({ darkMode, ...props }) => {
  return <img src={logo} alt="Docker" {...props} />
}

platforms.register({
  id: 'docker',
  name: 'Docker',
  component: Component,
  types: { 1219: 'Docker Container' },
  installation: {
    command: 'docker run -d -e R3_REGISTRATION_CODE="[CODE]" remoteit/remoteit-agent:x86_64',
    instructions: (
      <>
        This command is for testing on x86 platforms. For other platforms and production settings please visit our
        <Link href="https://hub.docker.com/r/remoteit/remoteit-agent">Docker Hub page.</Link>
      </>
    ),
    qualifier: 'For testing x86 systems running Docker',
    link: 'https://hub.docker.com/r/remoteit/remoteit-agent',
  },
})
