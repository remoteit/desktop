import React from 'react'
import { platforms } from '..'
import { Link } from '../../components/Link'
import logo from '../docker/docker.svg'

const Component = ({ darkMode, ...props }) => {
  return <img src={logo} alt="Docker" {...props} />
}

platforms.register({
  id: 'docker-jumpbox',
  name: 'Docker Jumpbox',
  component: Component,
  types: { 1221: 'Docker Jumpbox' },
  services: [],
  installation: {
    command:
      'docker run -d -e R3_REGISTRATION_CODE="[CODE]" -v /var/run/docker.sock:/var/run/docker.sock --restart unless-stopped --name remoteit_docker_jumpbox remoteit/docker-extension:latest',
    instructions: (
      <>
        For production settings please visit our
        <Link href="https://hub.docker.com/r/remoteit/docker-extension">Docker Hub page.</Link>
      </>
    ),
    qualifier: 'For testing on any system running Docker',
    link: 'https://hub.docker.com/r/remoteit/docker-extension',
  },
})
