import React, { useEffect } from 'react'
import { ApplicationState } from '../../store'
import { SharedUsersHeader } from '../../components/SharedUsersHeader'
import { SharedUsersList } from '../../components/SharedUsersList'
import { getConnected } from '../../helpers/userHelper'
import { useSelector } from 'react-redux'
import { getDevices } from '../../models/accounts'
import { useParams } from 'react-router-dom'
import { Container } from '../../components/Container'
import analyticsHelper from '../../helpers/analyticsHelper'

export const UsersPageDevice: React.FC = () => {
  const { deviceID = '' } = useParams<{ deviceID: string }>()
  const { device } = useSelector((state: ApplicationState) => ({
    device: getDevices(state).find((d: IDevice) => d.id === deviceID),
  }))
  const users = device?.access
  const connected = getConnected(device?.services)

  useEffect(() => {
    analyticsHelper.page('UsersPageDevice')
  }, [])

  return (
    <Container header={<SharedUsersHeader device={device} />}>
      <SharedUsersList device={device} users={users} connected={connected} />
    </Container>
  )
}
