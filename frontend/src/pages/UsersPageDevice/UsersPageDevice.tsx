import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Container } from '../../components/Container'
import { SharedUsersHeader } from '../../components/SharedUsersHeader'
import { SharedUsersList } from '../../components/SharedUsersList'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import analyticsHelper from '../../helpers/analyticsHelper'

export const UsersPageDevice: React.FC = () => {
  const { deviceID = '' } = useParams()
  const { device } = useSelector((state: ApplicationState) => ({
    device: state.devices.all.find((d: IDevice) => d.id === deviceID),
  }))

  useEffect(() => {
    analyticsHelper.page('UsersPageDevice')
  }, [])

  return (
    <Container header={<SharedUsersHeader device={device} />}>
      <SharedUsersList device={device} />
    </Container>
  )
}
