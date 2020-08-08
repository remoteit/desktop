import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { findService } from '../../models/devices'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { Button, Typography } from '@material-ui/core'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { Container } from '../../components/Container'
import { Users } from '../../components/Users'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import analytics from '../../helpers/Analytics'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'

export const UsersPage: React.FC = () => {
  const { serviceID = '' } = useParams()
  const { deviceID = '' } = useParams()
  const [service] = useSelector((state: ApplicationState) => findService(state.devices.all, serviceID))
  const { device, authUsername } = useSelector((state: ApplicationState) => ({
    device: state.devices.all.find(device => device.id === deviceID),
    authUsername: state.auth.user?.username
  }))
  const connected = !!service?.sessions.length
  const css = useStyles()
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
            {isOwner && <Button
              color="primary"
              variant="contained"
              onClick={() => history.push(`/devices/${deviceID}/share`)}
              className={css.shareButton}
            >
              <Icon name="user-plus" fixedWidth />
              <span className={css.spanShare}>Share</span>
            </Button>}
          </Typography>
        </>
      }
    >
      {connected && (
        <>
          <Typography variant="subtitle1" color="primary">
            Connected
          </Typography>
        </>
      )}
      <Users deviceId={deviceID} service={service} />
    </Container>
  )
}

const useStyles = makeStyles({
  shareButton: {
    padding: '5px 10px 5px 10px',
  },
  spanShare: {
    margin: '0px 10px 0px 10px',
  },
})
