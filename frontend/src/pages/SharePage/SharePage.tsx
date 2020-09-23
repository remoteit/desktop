import React, { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../../store'
import { makeStyles, Typography, IconButton, Tooltip, CircularProgress } from '@material-ui/core'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { findService } from '../../models/devices'
import { Container } from '../../components/Container'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { useHistory } from 'react-router-dom'
import analyticsHelper from '../../helpers/analyticsHelper'
import styles from '../../styling'
import { DeviceShareAdd, DeviceShareDetails } from '../../components/DeviceShareContainer'
import { SharingDetails } from '../../components/DeviceShareContainer/SharingForm'

export const SharePage = () => {
  const { email = '', deviceID = '', serviceID = '' } = useParams()
  const { shares } = useDispatch<Dispatch>()
  const { device, deleting } = useSelector((state: ApplicationState) => {
    const deleting = state.shares.deleting
    let device: IDevice | undefined
    if (deviceID) {
      device = state.devices.all.find(device => device.id === deviceID)
    } else if (serviceID) {
      const result = findService(state.devices.all, serviceID)
      device = result[1]
    }
    return { deleting, device }
  })
  const { contacts = [] } = useSelector((state: ApplicationState) => state.devices)
  const [selectedContacts, setSelectedContacts] = React.useState<string[]>([])
  const [changing, setChanging] = useState(false)
  const location = useLocation()
  const history = useHistory()
  const css = useStyles()

  useEffect(() => {
    analyticsHelper.page('SharePage')
  }, [])

  const handleUnshare = async () => {
    await shares.delete({ deviceID, email })
    history.push(location.pathname.replace(email ? `/${email}` : '/share', ''))
  }

  const handleShareUpdate = (share: SharingDetails, isNew: boolean) => {
    const shareData = mapShareData(share, isNew)
    const { scripting, services } = share.access
    shares.share(shareData)
    if (device && shareData) {
      shares.updateDeviceState({ device, contacts: shareData.email, scripting, services, isNew })
    }
    goToNext()
  }

  const goToNext = () =>
    email === ''
      ? history.push(location.pathname.replace('/share', ''))
      : history.push(location.pathname.replace(`/${email}`, ''))

  const mapShareData = (share: SharingDetails, isNew: boolean) => {
    const { access } = share
    const scripting = access.scripting
    const services =
      device?.services.map((ser: { id: string }) => ({
        serviceId: ser.id,
        action: access.services.includes(ser.id) ? 'ADD' : 'REMOVE',
      })) || []
    const email = isNew ? share.contacts : [share.contacts[0]]

    if (device) {
      return {
        deviceId: device.id,
        scripting,
        services,
        email,
      }
    }
    return
  }

  return (
    <Container
      header={
        <>
          <Breadcrumbs />
          {email ? (
            <Typography variant="h1">
              <Icon name={email === '' ? 'user-plus' : 'user'} size="lg" />
              <Title>{email || 'Share'}</Title>
              {deleting ? (
                <CircularProgress className={css.loading} size={styles.fontSizes.md} />
              ) : (
                <Tooltip title={`Remove ${email}`}>
                  <IconButton onClick={handleUnshare} disabled={deleting}>
                    <Icon name="trash-alt" size="md" fixedWidth />
                  </IconButton>
                </Tooltip>
              )}
            </Typography>
          ) : (
            device && (
              <DeviceShareAdd
                contacts={contacts}
                device={device}
                onChangeContacts={setSelectedContacts}
                selectedContacts={selectedContacts}
                setChanging={setChanging}
              />
            )
          )}
        </>
      }
    >
      {
        <>
          {device && (
            <DeviceShareDetails
              device={device}
              share={handleShareUpdate}
              selectedContacts={selectedContacts}
              updateSharing={handleShareUpdate}
              changing={changing}
              setChanging={setChanging}
            />
          )}
        </>
      }
    </Container>
  )
}

const useStyles = makeStyles({
  loading: { color: styles.colors.danger, margin: styles.spacing.sm },
})
