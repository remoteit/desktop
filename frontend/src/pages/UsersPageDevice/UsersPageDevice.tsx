import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Container } from '../../components/Container'
import { useHistory } from 'react-router-dom'
import analytics from '../../helpers/Analytics'
import { SharedUsersHeader } from '../../components/SharedUsersHeader'
import { SharedUsersList } from '../../components/SharedUsersList'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'

export const UsersPageDevice: React.FC = () => {
  const { deviceID = '' } = useParams()
  const { device } = useSelector((state: ApplicationState) => ({
    device: state.devices.find((d: IDevice) => d.id === deviceID),
  }))
  const shared = device?.access.length
  const history = useHistory()

  useEffect(() => {
    analytics.page('UsersPageDevice')
  }, [])

  const onClick = () => history.push(`/devices/${deviceID}/share`)

  return (
    <Container
      scrollbars
      header={
        <SharedUsersHeader onClick={onClick} />
      }
    >
      {(shared && device?.access) && <SharedUsersList device={device} />}
    </Container>
  )
}
