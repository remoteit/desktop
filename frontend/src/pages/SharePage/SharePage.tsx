import React, { useEffect } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { Typography, IconButton } from '@material-ui/core'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { Container } from '../../components/Container'

import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import analytics from '../../helpers/Analytics'
import { DeviceShareContainer } from '../../components/DeviceShareContainer'
import { useHistory } from 'react-router-dom'

export const SharePage  = () => {
  const { shares } = useDispatch<Dispatch>()
  const { deleting } = useSelector((state: ApplicationState) => state.shares)
  const { userName = '' } = useParams()
  const { deviceID = '' } = useParams()
  const location = useLocation()
  const history = useHistory()

  useEffect(() => {
    analytics.page('SharePage')
  }, [])

  const handleUnshare = async () => {
    await shares.delete({deviceID, email: userName})
    history.push(location.pathname.replace(userName ? `/${userName}` : '/share', ''))
  }

  return (
    <Container
      scrollbars
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">
            <Icon name={userName === '' ? 'user-plus' : 'user'} size="lg" />
            <Title>{userName || 'Share'}</Title>
          {userName && (
            <div className="right">
              <IconButton
                onClick={handleUnshare}
                disabled={deleting}
              >
                <Icon name="trash-alt" size="md" fixedWidth />
              </IconButton>
            </div>
          )}
          </Typography>
        </>
      }
    >
      <DeviceShareContainer username={userName} />
    </Container>
  )
}
