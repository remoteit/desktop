import React from 'react'
import { platforms } from '..'
import { Link } from '../../components/Link'
import logo from './arm.svg'

const Component = ({ darkMode, ...props }) => {
  return <img src={logo} alt="arm" {...props} />
}

platforms.register({
  id: 'arm',
  component: Component,
  installation: {
    instructions: (
      <>
        Arm Virtual Hardware (AVH) requires an Arm account.
        <Link href="https://link.remote.it/avh">Learn more about AVH.</Link>
        This page will automatically update when complete.
      </>
    ),
  },
})
