import React from 'react'
import { State } from '../store'
import { selectSessionUsers } from '../selectors/sessions'
import { SharedUsersLists } from '../components/SharedUsersLists'
import { DeviceHeaderMenu } from '../components/DeviceHeaderMenu'
import { useSelector } from 'react-redux'

export const DeviceUsersPage: React.FC<{ device?: IDevice }> = ({ device }) => {
  const connected = useSelector((state: State) => selectSessionUsers(state, undefined, device?.id))
  const users = device?.access

  return (
    <DeviceHeaderMenu>
      <SharedUsersLists device={device} users={users} connected={connected} />
    </DeviceHeaderMenu>
  )
}
