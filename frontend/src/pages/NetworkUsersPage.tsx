import React from 'react'
import { useParams } from 'react-router-dom'
import { selectNetwork } from '../models/networks'
import { ApplicationState } from '../store'
import { SharedUsersLists } from '../components/SharedUsersLists'
import { NetworkHeaderMenu } from '../components/NetworkHeaderMenu'
import { useSelector } from 'react-redux'

export const NetworkUsersPage: React.FC<{ device?: IDevice }> = ({ device }) => {
  const { networkID } = useParams<{ networkID?: string }>()
  const network = useSelector((state: ApplicationState) => selectNetwork(state, networkID))
  // const connected = useSelector((state: ApplicationState) => selectSessionUsers(state, device?.id))
  // const users = device?.access

  return (
    <NetworkHeaderMenu network={network}>
      <SharedUsersLists device={device} network={network} users={network.access} />
    </NetworkHeaderMenu>
  )
}
