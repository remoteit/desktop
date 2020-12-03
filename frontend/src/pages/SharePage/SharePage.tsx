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
import { getDevices } from '../../models/accounts'
import { ContactSelector } from '../../components/ContactSelector'
import { ContactCard } from '../../components/ContactCard'
import { SharingDetails } from '../../components/SharingForm'
import analyticsHelper from '../../helpers/analyticsHelper'
import styles from '../../styling'
import { getPermissions } from '../../helpers/userHelper'

export const SharePage = () => {
  const { email = '', deviceID = '', serviceID = '' } = useParams<{
    email: string
    deviceID: string
    serviceID: string
  }>()
  const { shares } = useDispatch<Dispatch>()
  const { device, deleting } = useSelector((state: ApplicationState) => {
    const deleting = state.shares.deleting
    const devices = getDevices(state)
    let device: IDevice | undefined
    if (deviceID) {
      device = devices.find(device => device.id === deviceID)
    } else if (serviceID) {
      const result = findService(devices, serviceID)
      device = result[1]
    }
    return { deleting, device }
  })
  const { contacts = [], user } = useSelector((state: ApplicationState) => ({
    contacts: state.devices.contacts,
    user: state.devices.contacts.find(c => c.email === email),
  }))
  const [selected, setSelected] = React.useState<string[]>([])
  const [userSelected, setUserSelected] = React.useState<IUserRef | undefined>(user)
  const [changed, setChanged] = useState(false)
  const permissions = device && getPermissions(device, userSelected?.email)
  const [selectedServices, setSelectedServices] = useState(permissions?.services.map(s => s.id) || [])
  const [indeterminate, setIndeterminate] = React.useState<string[]>([])
  const [scripts, setScripts] = useState(permissions?.scripting || false)
  const location = useLocation()
  const history = useHistory()
  const css = useStyles()

  useEffect(() => {
    analyticsHelper.page('SharePage')
  }, [])

  const handleUnshare = async () => {
    await shares.delete({ deviceId: deviceID, email })
    history.push(location.pathname.replace(email ? `/${email}` : '/share', ''))
  }

  const handleShare = (share: SharingDetails, isNew: boolean) => {
    const shareData = mapShareData(share, isNew)
    const { scripting, services } = share.access
    if (shareData) shares.share(shareData)
    if (device && shareData) {
      shares.updateDeviceState({ device, emails: shareData.email, scripting, services, isNew })
    }
    goToNext()
  }

  //everything happend here
  let intersection: string[] = []
  const selectContacts = (emails: string[]) => {
    let userSelectedServices: string[][] = emails.map(email => {
      return device ? getPermissions(device, email).services.map(s => s.id) : []
    })
    let userSelectedScript: boolean[] = emails.map(email => {
      return device ? getPermissions(device, email).scripting : false
    })
    const match = userSelectedServices.map((services, index) => {
      intersection = index === 0 ? services : intersection.filter(value => services.includes(value))
      return intersection
    })
    const matchServices = match[match.length - 1]
    const indeterminateServices = userSelectedServices
      .flat() // get one array of indeterminate
      .filter((v, i, a) => a.indexOf(v) === i) // filter duplicates
      .filter(value => !matchServices.includes(value)) // get just indeterminate value
    setScripts(userSelectedScript.find(script => script === true) || false)
    setSelectedServices(matchServices)
    setIndeterminate(indeterminateServices)
    setUserSelected(contacts.find(c => emails.includes(c.email)))
    setSelected(emails)
  }

  const goToNext = () =>
    email === ''
      ? history.push(location.pathname.replace('/share', ''))
      : history.push(location.pathname.replace(`/${email}`, ''))

  const mapShareData = (share: SharingDetails, isNew: boolean): IShareProps | undefined => {
    const { access } = share
    const scripting = access.scripting
    const services =
      device?.services.map((ser: { id: string }) => ({
        serviceId: ser.id,
        action: access.services.includes(ser.id) ? 'ADD' : 'REMOVE',
      })) || []
    const email = isNew ? share.emails : [share.emails[0]]

    if (device) {
      return {
        deviceId: device.id,
        scripting,
        services,
        email,
      }
    }
  }

  return (
    <Container
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">
            {email ? (
              <>
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
              </>
            ) : (
              device && (
                <ContactSelector
                  contacts={contacts}
                  selected={contacts.filter(c => device.access.find(s => s.email === c.email))}
                  onChange={selectContacts}
                />
              )
            )}
          </Typography>
        </>
      }
    >
      {device && (
        <ContactCard
          device={device}
          user={email === '' ? userSelected : user}
          selected={selected}
          onShare={handleShare}
          changed={changed}
          setChanged={setChanged}
          scripts={scripts}
          setScripts={setScripts}
          selectedServices={selectedServices}
          indeterminateServices={indeterminate}
          setSelectedServices={setSelectedServices}
        />
      )}
    </Container>
  )
}

const useStyles = makeStyles({
  loading: { color: styles.colors.danger, margin: styles.spacing.sm },
})
