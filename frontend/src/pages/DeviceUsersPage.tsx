import React, { useEffect } from 'react'
import { ApplicationState } from '../store'
import { selectSessionUsers } from '../models/sessions'
import { SharedUsersLists } from '../components/SharedUsersLists'
import { DeviceHeaderMenu } from '../components/DeviceHeaderMenu'
import { useSelector } from 'react-redux'
import analyticsHelper from '../helpers/analyticsHelper'

export const DeviceUsersPage: React.FC<{ device?: IDevice }> = ({ device }) => {
  const connected = useSelector((state: ApplicationState) => selectSessionUsers(state, device?.id))
  const users = device?.access

  useEffect(() => {
    analyticsHelper.page('DeviceUsersPage')
  }, [])

  return (
    <DeviceHeaderMenu>
      <SharedUsersLists device={device} users={users} connected={connected} />
    </DeviceHeaderMenu>
  )
}
