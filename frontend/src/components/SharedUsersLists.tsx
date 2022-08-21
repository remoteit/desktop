import React from 'react'
import { ApplicationState } from '../store'
import { SharedUsersPaginatedList } from './SharedUsersPaginatedList'
import { getOrganization } from '../models/organization'
import { useSelector } from 'react-redux'

interface Props {
  device?: IDevice
  network?: INetwork
  users?: IUser[]
  connected?: IUser[]
}

export const SharedUsersLists: React.FC<Props> = ({ device, network, connected = [], users = [] }) => {
  const members = useSelector((state: ApplicationState) => getOrganization(state).members.map(m => m.user))

  if (!users?.length && !members.length) return null
  const disconnected = users.filter(user => !connected.find(_u => _u.email === user.email))
  const manager = !!(device || network)?.permissions.includes('MANAGE')

  return (
    <>
      <SharedUsersPaginatedList title="Connected" device={device} users={connected} connected />
      <SharedUsersPaginatedList title="Guests" device={device} remove={network?.id} users={sort(disconnected)} />
      {manager && (
        <SharedUsersPaginatedList title="Organization members" device={device} users={sort(members)} members />
      )}
    </>
  )
}

const sort = (users: IUser[]) => users.sort((a, b) => (a.email > b.email ? 1 : b.email > a.email ? -1 : 0))
