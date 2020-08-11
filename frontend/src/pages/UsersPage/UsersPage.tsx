import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { findService } from '../../models/devices'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { Tooltip, IconButton, Typography } from '@material-ui/core'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { Container } from '../../components/Container'
import { Users } from '../../components/Users'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { useHistory } from 'react-router-dom'
import analytics from '../../helpers/Analytics'

export const UsersPage: React.FC = () => {
  const { serviceID = '' } = useParams()
  const { deviceID = '' } = useParams()
  const [service] = useSelector((state: ApplicationState) => findService(state.devices.all, serviceID))
  const { device, authUsername } = useSelector((state: ApplicationState) => ({
    device: state.devices.all.find(device => device.id === deviceID),
    authUsername: state.auth.user?.username,
  }))
  const history = useHistory()

  useEffect(() => {
    analytics.page('UsersPage')
  }, [])

  const isOwner = authUsername === device?.owner

  return (
    <Container
      scrollbars
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">
            <Icon name="user-friends" size="lg" />
            <Title>Shared users</Title>
            {isOwner && (
              <Tooltip title="Add User">
                <div>
                  <IconButton onClick={() => history.push(`/devices/${deviceID}/share`)}>
                    <Icon name="user-plus" size="md" type="light" />
                  </IconButton>
                </div>
              </Tooltip>
            )}
          </Typography>
        </>
      }
    >
      <Users deviceId={deviceID} service={service} />
    </Container>
  )
}
