import React, { useEffect } from 'react'
import { ApplicationState } from '../../store'
import { selectSessionUsers } from '../../models/sessions'
import { SharedUsersList } from '../../components/SharedUsersList'
import { DeviceHeaderMenu } from '../../components/DeviceHeaderMenu'
import { useSelector } from 'react-redux'
import analyticsHelper from '../../helpers/analyticsHelper'

export const UsersPageDevice: React.FC<{ device?: IDevice }> = ({ device }) => {
  const connected = useSelector((state: ApplicationState) => selectSessionUsers(state, device?.id))
  const users = device?.access

  useEffect(() => {
    analyticsHelper.page('UsersPageDevice')
  }, [])

  return (
    <DeviceHeaderMenu device={device}>
      <SharedUsersList device={device} users={users} connected={connected} />
    </DeviceHeaderMenu>
  )
}
