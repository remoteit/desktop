import React, { useEffect } from 'react'
import { ApplicationState } from '../../store'
import { SharedUsersHeader } from '../../components/SharedUsersHeader'
import { selectSessionUsers } from '../../models/sessions'
import { SharedUsersList } from '../../components/SharedUsersList'
import { useSelector } from 'react-redux'
import { getDevices } from '../../models/accounts'
import { useParams } from 'react-router-dom'
import { Container } from '../../components/Container'
import analyticsHelper from '../../helpers/analyticsHelper'

export const UsersPageDevice: React.FC = () => {
  const { deviceID = '' } = useParams<{ deviceID: string }>()
  const { device, connected } = useSelector((state: ApplicationState) => ({
    device: getDevices(state).find((d: IDevice) => d.id === deviceID),
    connected: selectSessionUsers(state, deviceID),
  }))
  const users = device?.access

  useEffect(() => {
    analyticsHelper.page('UsersPageDevice')
  }, [])

  return (
    <Container header={<SharedUsersHeader device={device} />}>
      <SharedUsersList device={device} users={users} connected={connected} />
    </Container>
  )
}
