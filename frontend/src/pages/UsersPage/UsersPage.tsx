import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { findService } from '../../models/devices'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { Typography } from '@material-ui/core'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { Container } from '../../components/Container'
import { Users } from '../../components/Users'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import analytics from '../../helpers/Analytics'

export const UsersPage: React.FC = () => {
  const { serviceID = '' } = useParams()
  const [service, device] = useSelector((state: ApplicationState) => findService(state.devices.all, serviceID))
  const connected = !!service?.sessions.length

  useEffect(() => {
    analytics.page('LogPage')
  }, [])

  return (
    <Container
      scrollbars
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">
            <Icon name="user-friends" size="lg" />
            <Title primary="Users" />
          </Typography>
        </>
      }
    >
      {connected && (
        <>
          <Typography variant="subtitle1" color="primary">
            Connected
          </Typography>
          <Users service={service} connected />
        </>
      )}
      <Users service={service} />
    </Container>
  )
}
