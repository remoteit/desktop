import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { replaceHost } from '../../shared/nameHelper'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import {
  Typography,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  CircularProgress,
} from '@material-ui/core'
import { findType } from '../../services/serviceTypes'
import { useParams } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { Container } from '../../components/Container'
import { OutOfBand } from '../../components/OutOfBand'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { AddServiceButton } from '../../buttons/AddServiceButton'
import { DeviceNameSetting } from '../../components/DeviceNameSetting'
import { DeviceLabelSetting } from '../../components/DeviceLabelSetting'
import { ListItemLocation } from '../../components/ListItemLocation'
import { UnregisterDeviceButton } from '../../buttons/UnregisterDeviceButton'
import { DeleteButton } from '../../buttons/DeleteButton'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { fontSizes } from '../../styling'
import analyticsHelper from '../../helpers/analyticsHelper'

type Props = {
  targets: ITarget[]
  targetDevice: ITargetDevice
}

type IServiceList = {
  typeID?: number
  name: string
  id: string
}

export const DeviceEditPage: React.FC<Props> = ({ targetDevice, targets }) => {
  const css = useStyles()
  const history = useHistory()
  const { deviceID } = useParams()
  const { setupBusy } = useSelector((state: ApplicationState) => state.ui)
  const device = useSelector((state: ApplicationState) =>
    state.devices.all.find((d: IDevice) => d.id === deviceID && !d.hidden)
  )

  useEffect(() => {
    analyticsHelper.page('DevicesDetailPage')
  }, [])

  if (!device) {
    history.push(`/devices`)
    return null
  }
  /* 
    @TODO: add arbitrary meta data here!!!!
  */

  const thisDevice = device.id === targetDevice.uid
  let serviceList: IServiceList[] = thisDevice
    ? targets.map(t => ({ id: t.uid, typeID: t.type, name: t.name })).reverse()
    : device.services

  function host(service: IServiceList) {
    const target = targets.find(t => t.uid === service.id)
    if (target) return `${replaceHost(target.hostname)}:${target.port}`
  }

  return (
    <Container
      header={
        <>
          <OutOfBand />
          <Breadcrumbs />
          <Typography variant="h1">
            <Icon name="pen" size="lg" type="light" color="grayDarker" fixedWidth />
            <Title>Edit device</Title>
            {thisDevice ? <UnregisterDeviceButton targetDevice={targetDevice} /> : <DeleteButton device={device} />}
          </Typography>
        </>
      }
    >
      <List>
        <DeviceNameSetting device={device} targetDevice={targetDevice} />
        <DeviceLabelSetting device={device} />
        {/* <SharedAccessSetting device={device} /> */}
      </List>
      <Divider />
      {!device.shared && (
        <>
          <Typography variant="subtitle1">
            <Title>Services</Title>
            <AddServiceButton device={device} thisDevice={thisDevice} />
          </Typography>
          <List>
            {thisDevice && setupBusy && (
              <ListItem disabled button dense>
                <ListItemIcon>
                  <CircularProgress color="inherit" size={fontSizes.md} />
                </ListItemIcon>
                <ListItemText primary="Registering..." />
              </ListItem>
            )}
            {serviceList.map(s => (
              <ListItemLocation key={s.id} pathname={`/devices/${deviceID}/${s.id}/edit`} dense>
                <ListItemIcon></ListItemIcon>
                <ListItemText primary={s.name} secondary={host(s)} />
                <ListItemSecondaryAction className={css.actions}>
                  <Chip label={findType(s.typeID).name} size="small" />
                </ListItemSecondaryAction>
              </ListItemLocation>
            ))}
          </List>
        </>
      )}
    </Container>
  )
}

const useStyles = makeStyles({
  actions: { right: 90 },
})
