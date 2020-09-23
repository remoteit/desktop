import React, { useEffect } from 'react'
import { ApplicationState } from '../store'
import { Breadcrumbs } from '../components/Breadcrumbs'
import { Typography } from '@material-ui/core'
import { SharedUsersList } from '../components/SharedUsersList'
import { getConnected } from '../helpers/userHelper'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { Container } from '../components/Container'
import { AddUserButton } from '../buttons/AddUserButton'
import { Icon } from '../components/Icon'
import { Title } from '../components/Title'
import analyticsHelper from '../helpers/analyticsHelper'

export const AccountAccessPage: React.FC = () => {
  const { deviceID = '' } = useParams<{ deviceID: string }>()
  const { device } = useSelector((state: ApplicationState) => ({
    device: state.devices.all.find((d: IDevice) => d.id === deviceID),
  }))
  const users = device?.access
  const connected = getConnected(device?.services)

  useEffect(() => {
    analyticsHelper.page('AccountAccessPage')
  }, [])

  return (
    <Container
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">
            <Icon name="users" size="lg" />
            <Title>Account Linked Users</Title>
            <AddUserButton device={device} />
          </Typography>
        </>
      }
    >
      <SharedUsersList device={device} users={users} connected={connected} />
    </Container>
  )
}
