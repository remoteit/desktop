import React from 'react'
import { ApplicationState } from '../store'
import { SharedUsersPaginatedList } from './SharedUsersPaginatedList'
import { getOrganization } from '../models/organization'
import { useSelector } from 'react-redux'

interface Props {
  device?: IDevice
  users?: IUser[]
  connected?: IUser[]
  sharedUsers?: IUser[]
}

export const SharedUsersLists: React.FC<Props> = ({ device, connected = [], users = [] }) => {
  const { members, manager } = useSelector((state: ApplicationState) => ({
    members: getOrganization(state).members.map(m => m.user),
    manager: !!device?.permissions.includes('MANAGE'),
  }))

  if (!users?.length && !members.length) return null
  const disconnected = users.filter(user => !connected.find(_u => _u.email === user.email))

  return (
    <>
      <SharedUsersPaginatedList title="Connected" device={device} users={connected} connected />
      <SharedUsersPaginatedList title="Shared" device={device} users={sort(disconnected)} />
      {manager && <SharedUsersPaginatedList title="Organization members" device={device} users={sort(members)} />}
    </>
  )
}

const sort = (users: IUser[]) => users.sort((a, b) => (a.email > b.email ? 1 : b.email > a.email ? -1 : 0))
