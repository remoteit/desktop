import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { findService } from '../../models/devices'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { Container } from '../../components/Container'
import { useHistory } from 'react-router-dom'
import analytics from '../../helpers/Analytics'
import { SharedUsersList } from '../../components/SharedUsersList'
import { SharedUsersHeader } from '../../components/SharedUsersHeader'

export const UsersPageService: React.FC = () => {
  const { serviceID = '' } = useParams()
  const { deviceID = '' } = useParams()
  const { device, service } = useSelector((state: ApplicationState) => ({
    device: state.devices.find((d: IDevice) => d.id === deviceID),
    service: findService(state.devices.all, serviceID)[0]
  }))
  const shared =  service?.access.length

  const history = useHistory()

  useEffect(() => {
    analytics.page('UsersPageService')
  }, [])

  const onClick = () => history.push(`/devices/${deviceID}/share`)

  return (
    <Container
      scrollbars
      header={
        <SharedUsersHeader onClick={onClick} />
      }
    >
     {(service && shared) && <SharedUsersList device={device} service={service} />}
    </Container>
  )
}
