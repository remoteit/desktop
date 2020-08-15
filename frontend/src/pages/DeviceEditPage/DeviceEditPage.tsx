import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { ApplicationState, Dispatch } from '../../store'
import { Typography, Divider, ListItemIcon, ListItemText, List } from '@material-ui/core'
import { useParams } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { Container } from '../../components/Container'
import { OutOfBand } from '../../components/OutOfBand'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { DeviceNameSetting } from '../../components/DeviceNameSetting'
import { Title } from '../../components/Title'
import { Icon } from '../../components/Icon'
import { emit } from '../../services/Controller'
import { ListItemLocation } from '../../components/ListItemLocation/ListItemLocation'
import { SettingsListItem } from '../../components/SettingsListItem/SettingsListItem'
import { Targets } from '../../components/Targets/Targets'

type Props = {
  targets: ITarget[]
  targetDevice: ITargetDevice
}
export const DeviceEditPage: React.FC<Props> = ({ targetDevice, targets, ...props }) => {
  const css = useStyles()
  const { deviceID } = useParams()
  const { connections, device, searched, query, thisDeviceId } = useSelector((state: ApplicationState) => ({
    connections: state.backend.connections,
    device: state.devices.all.find((d: IDevice) => d.id === deviceID && !d.hidden),
    searched: state.devices.searched,
    query: state.devices.query,
    thisDeviceId: state.backend.device.uid,
  }))

  const { ui } = useDispatch<Dispatch>()

  const onUpdate = (t: ITarget[]) => emit('targets', t)
  const onCancel = () => ui.set({ setupAdded: undefined })

  useEffect(() => {
    analytics.page('DevicesDetailPage')
  }, [])

  if (!device) return null

  return (
    <Container
      header={
        <>
          <OutOfBand />
          <Breadcrumbs />
          <Typography variant="h1">
            <Icon name="pen" size="lg" type="light" color="grayDarker" fixedWidth />
            <Title>Edit device</Title>
          </Typography>
        </>
      }
    >
      <List>
        <DeviceNameSetting device={device} targetDevice={targetDevice} />
      </List>
      {device.id === targetDevice.uid && (
        <>
          <Divider />
          <Typography variant="subtitle1">Services</Typography>
          <section>
            <Targets targetDevice={targetDevice} targets={targets} onUpdate={onUpdate} onCancel={onCancel} {...props} />
          </section>
        </>
      )}
    </Container>
  )
}

const useStyles = makeStyles({})
