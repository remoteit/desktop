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
  const shared = device?.access.length

  useEffect(() => {
    analyticsHelper.page('UsersPageDevice')
  }, [])

  return (
    <Container scrollbars header={<SharedUsersHeader />}>
      {!!(shared && device?.access) && <SharedUsersList device={device} />}
    </Container>
  )
}
