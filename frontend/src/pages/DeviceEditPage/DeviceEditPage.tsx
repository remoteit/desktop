import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { replaceHost } from '../../shared/nameHelper'
import { useSelector } from 'react-redux'
import { ApplicationState } from '../../store'
import { Typography, Divider, List, ListItemIcon, ListItemText, ListItemSecondaryAction, Chip } from '@material-ui/core'
import { findType } from '../../services/serviceTypes'
import { useParams } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { Container } from '../../components/Container'
import { OutOfBand } from '../../components/OutOfBand'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { DeviceNameSetting } from '../../components/DeviceNameSetting'
import { ListItemLocation } from '../../components/ListItemLocation'
import { UnregisterButton } from '../../buttons/UnregisterButton'
import { DeleteButton } from '../../buttons/DeleteButton'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import analyticsHelper from '../../helpers/analyticsHelper'

type Props = {
  targets: ITarget[]
  targetDevice: ITargetDevice
}
export const DeviceEditPage: React.FC<Props> = ({ targetDevice, targets }) => {
  const css = useStyles()
  const history = useHistory()
  const { deviceID } = useParams()
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

  function host(service: IService) {
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
            {thisDevice ? <UnregisterButton targetDevice={targetDevice} /> : <DeleteButton device={device} />}
          </Typography>
        </>
      }
    >
      <List>
        <DeviceNameSetting device={device} targetDevice={targetDevice} />
        {/* <SharedAccessSetting device={device} /> */}
      </List>
      <Divider />
      <Typography variant="subtitle1">Services</Typography>
      <List>
        {device.services.map(s => (
          <ListItemLocation key={s.id} pathname={`/devices/${deviceID}/${s.id}/edit`}>
            <ListItemIcon></ListItemIcon>
            <ListItemText primary={s.name} secondary={host(s)} />
            <ListItemSecondaryAction className={css.actions}>
              <Chip label={findType(s.typeID).name} size="small" />
            </ListItemSecondaryAction>
          </ListItemLocation>
        ))}
      </List>
    </Container>
  )
}

const useStyles = makeStyles({
  actions: { right: 90 },
})
