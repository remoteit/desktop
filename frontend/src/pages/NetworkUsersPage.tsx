import { useStoredNetworkElsewhere } from '../hooks/useNetworkElsewhere'
import React from 'react'
import { useParams } from 'react-router-dom'
import { selectNetwork } from '../models/networks'
import { State } from '../store'
import { SharedUsersLists } from '../components/SharedUsersLists'
import { NetworkHeaderMenu } from '../components/NetworkHeaderMenu'
import { useSelector } from 'react-redux'

export const NetworkUsersPage: React.FC<{ device?: IDevice }> = ({ device }) => {
  const { networkID } = useParams<{ networkID?: string }>()
  // Opened at its address, and not this row's: looked for in the other rows here, whose row is then selected.
  useStoredNetworkElsewhere(networkID)
  const { network, email } = useSelector((state: State) => ({
    network: selectNetwork(state, networkID),
    email: state.user.email,
  }))

  return (
    <NetworkHeaderMenu network={network} email={email}>
      <SharedUsersLists device={device} network={network} users={network.access} />
    </NetworkHeaderMenu>
  )
}
