import React, { useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import { replaceHost } from '../../shared/nameHelper'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { Typography, Divider, List, ListItemIcon, ListItemText, ListItemSecondaryAction, Chip } from '@material-ui/core'
import { findType } from '../../services/serviceTypes'
import { useParams } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { Container } from '../../components/Container'
import { OutOfBand } from '../../components/OutOfBand'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { DeviceNameSetting } from '../../components/DeviceNameSetting'
import { ListItemLocation } from '../../components/ListItemLocation'
import { SharedAccessSetting } from '../../components/SharedAccessSetting'
import { UnregisterButton } from '../../buttons/UnregisterButton'
import { DeleteButton } from '../../buttons/DeleteButton'
import { Targets } from '../../components/Targets/Targets'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { emit } from '../../services/Controller'

type Props = {
  targets: ITarget[]
  targetDevice: ITargetDevice
}
export const DeviceEditPage: React.FC<Props> = ({ targetDevice, targets, ...props }) => {
  const css = useStyles()
  const history = useHistory()
  const { deviceID } = useParams()
  const { ui } = useDispatch<Dispatch>()
  const { connections, device, searched, query, thisDeviceId } = useSelector((state: ApplicationState) => ({
    connections: state.backend.connections,
    device: state.devices.all.find((d: IDevice) => d.id === deviceID && !d.hidden),
    searched: state.devices.searched,
    query: state.devices.query,
    thisDeviceId: state.backend.device.uid,
  }))

  useEffect(() => {
    analytics.page('DevicesDetailPage')
  }, [])

  if (!device) {
    history.push(`/devices`)
    return null
  }

  const onUpdate = (t: ITarget[]) => emit('targets', t)
  const onCancel = () => ui.set({ setupAdded: undefined })
  const thisDevice = device.id === targetDevice.uid

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
        <SharedAccessSetting device={device} />
      </List>
      {thisDevice && (
        <>
          <Divider />
          <Typography variant="subtitle1">Services</Typography>
          <List>
            {targets.map(t => (
              <ListItemLocation key={t.uid} pathname={`/devices/${deviceID}/${t.uid}/edit`}>
                <ListItemIcon></ListItemIcon>
                <ListItemText primary={t.name} secondary={`${replaceHost(t.hostname)}:${t.port}`} />
                <ListItemSecondaryAction className={css.actions}>
                  <Chip label={findType(t.type).name} size="small" />
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
