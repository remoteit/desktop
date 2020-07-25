import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../../store'
import { Typography, IconButton } from '@material-ui/core'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { Container } from '../../components/Container'

import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import analytics from '../../helpers/Analytics'
import { DeviceShareContainer } from '../../components/DeviceShareContainer'
import { SharingManager } from '../../services/SharingManager';
import { useHistory } from 'react-router-dom'

export const SharePage  = () => {
  const { devices } = useDispatch<Dispatch>()
  const { userName = '' } = useParams()
  const { deviceID = '' } = useParams()
  const history = useHistory()
  useEffect(() => {
    analytics.page('LogPage')
  }, [])

  const [saving, setSaving] = React.useState<boolean>(false)

  async function handleUnshare(email: string): Promise<void> {
    setSaving(true)
    await SharingManager.unshare({ deviceID, email })
    setSaving(false)
    devices.get(deviceID)
    history.push(`/devices/${deviceID}/users`)
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
                onClick={() => handleUnshare(userName)}
                disabled={saving}
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
