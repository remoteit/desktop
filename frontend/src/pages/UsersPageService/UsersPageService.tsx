import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Container } from '../../components/Container'
import { findService } from '../../models/devices'
import { useSelector } from 'react-redux'
import { getConnected } from '../../helpers/userHelper'
import { attributeName } from '../../shared/nameHelper'
import { SharedUsersList } from '../../components/SharedUsersList'
import { ApplicationState } from '../../store'
import { SharedUsersHeader } from '../../components/SharedUsersHeader'
import analyticsHelper from '../../helpers/analyticsHelper'

export const UsersPageService: React.FC = () => {
  const { serviceID = '' } = useParams<{ serviceID: string }>()
  const [service, device] = useSelector((state: ApplicationState) => findService(state.devices.all, serviceID))
  const users = service?.access
  const connected = service && getConnected([service])

  useEffect(() => {
    analyticsHelper.page('UsersPageService')
  }, [])

  return (
    <Container header={<SharedUsersHeader device={device} title={`${attributeName(service)} users`} />}>
      <SharedUsersList users={users} connected={connected} />
    </Container>
  )
}
