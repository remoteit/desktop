import React, { useEffect } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { Typography, IconButton, Tooltip } from '@material-ui/core'
import { DeviceShareContainer } from '../../components/DeviceShareContainer'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { Container } from '../../components/Container'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { useHistory } from 'react-router-dom'
import analytics from '../../helpers/Analytics'

export const SharePage = () => {
  const { shares } = useDispatch<Dispatch>()
  const { deleting } = useSelector((state: ApplicationState) => state.shares)
  const { email = '' } = useParams()
  const { deviceID = '' } = useParams()
  const location = useLocation()
  const history = useHistory()

  useEffect(() => {
    analytics.page('SharePage')
  }, [])

  const handleUnshare = async () => {
    await shares.delete({ deviceID, email })
    history.push(location.pathname.replace(email ? `/${email}` : '/share', ''))
  }

  return (
    <Container
      scrollbars
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">
            <Icon name={email === '' ? 'user-plus' : 'user'} size="lg" />
            <Title>{email || 'Share'}</Title>
            {email && (
              <Tooltip title={`Remove ${email}`}>
                <IconButton onClick={handleUnshare} disabled={deleting}>
                  <Icon name="trash-alt" size="md" fixedWidth />
                </IconButton>
              </Tooltip>
            )}
          </Typography>
        </>
      }
    >
      <DeviceShareContainer username={email} />
    </Container>
  )
}
