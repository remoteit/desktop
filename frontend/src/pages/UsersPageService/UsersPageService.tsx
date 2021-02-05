import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Container } from '../../components/Container'
import { getDevices } from '../../models/accounts'
import { findService } from '../../models/devices'
import { useSelector } from 'react-redux'
import { attributeName } from '../../shared/nameHelper'
import { SharedUsersList } from '../../components/SharedUsersList'
import { ApplicationState } from '../../store'
import { SharedUsersHeader } from '../../components/SharedUsersHeader'
import { selectSessionUsers } from '../../models/sessions'
import analyticsHelper from '../../helpers/analyticsHelper'

export const UsersPageService: React.FC = () => {
  const { serviceID = '' } = useParams<{ serviceID: string }>()
  const { service, device, connected } = useSelector((state: ApplicationState) => {
    const [service, device] = findService(getDevices(state), serviceID)
    return {
      connected: selectSessionUsers(state, serviceID),
      service,
      device,
    }
  })
  const users = service?.access

  useEffect(() => {
    analyticsHelper.page('UsersPageService')
  }, [])

  return (
    <Container header={<SharedUsersHeader device={device} title={`${attributeName(service)} users`} />}>
      <SharedUsersList users={users} connected={connected} />
    </Container>
  )
}
