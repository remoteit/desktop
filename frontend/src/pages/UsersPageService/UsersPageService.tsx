import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { findService } from '../../models/devices'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { Container } from '../../components/Container'
import { SharedUsersList } from '../../components/SharedUsersList'
import { SharedUsersHeader } from '../../components/SharedUsersHeader'
import analyticsHelper from '../../helpers/analyticsHelper'

export const UsersPageService: React.FC = () => {
  const { serviceID = '' } = useParams()
  const [service, device] = useSelector((state: ApplicationState) => findService(state.devices.all, serviceID))
  const shared = service?.access.length

  useEffect(() => {
    analyticsHelper.page('UsersPageService')
  }, [])

  return (
    <Container scrollbars header={<SharedUsersHeader />}>
      {!!(service && device && shared) && <SharedUsersList device={device} service={service} />}
    </Container>
  )
}
