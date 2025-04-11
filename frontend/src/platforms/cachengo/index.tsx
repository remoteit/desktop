import React from 'react'
import logo from './cachengo.png'
import { RentANodeRequest } from '../../components/RentANodeRequest'
import { platforms } from '..'

const Component = ({ darkMode, ...props }) => {
  return <img src={logo} alt="Cachengo" {...props} />
}

platforms.register({
  id: 'cachengo',
  name: 'Cachengo',
  component: Component,
  types: { 1227: 'Rent-A-Node', 1224: 'Cachengo' },
  installation: { command: true },
  override: RentANodeRequest,
})
