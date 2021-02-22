import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, useLocation } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { PortSetting } from './PortSetting'
import { NameSetting } from './NameSetting'
import { ServiceName } from './ServiceName'
import { Breadcrumbs } from './Breadcrumbs'
import { HostSetting } from './HostSetting'
import { ProxySetting } from './ProxySetting'
import { selectService } from '../models/devices'
import { LicensingNotice } from './LicensingNotice'
import { ListItemLocation } from './ListItemLocation'
import { ServiceConnected } from './ServiceConnected'
import { AutoStartSetting } from './AutoStartSetting'
import { CustomAttributeSettings } from './CustomAttributeSettings'
import { ApplicationState, Dispatch } from '../store'
import { Typography, Divider, List } from '@material-ui/core'
import { ConnectionErrorMessage } from './ConnectionErrorMessage'
import { InlineTemplateSetting } from './InlineTemplateSetting'
import { ConnectionLogSetting } from './ConnectionLogSetting'
import { ConnectionStateIcon } from './ConnectionStateIcon'
import { UnauthorizedPage } from '../pages/UnauthorizedPage'
import { LanShareSelect } from './LanShareSelect'
import { LoadingMessage } from './LoadingMessage'
import { AddUserButton } from '../buttons/AddUserButton'
import { ConnectButton } from '../buttons/ConnectButton'
import { LaunchButton } from '../buttons/LaunchButton'
import { ForgetButton } from '../buttons/ForgetButton'
import { UsersSelect } from './UsersSelect'
import { ErrorButton } from '../buttons/ErrorButton'
import { EditButton } from '../buttons/EditButton'
import { CopyButton } from '../buttons/CopyButton'
import { Container } from './Container'
import { Columns } from './Columns'
import { spacing } from '../styling'
import analyticsHelper from '../helpers/analyticsHelper'

export const ServiceHeaderMenu: React.FC = () => {
  const css = useStyles()
  const location = useLocation()
  const { deviceID, serviceID = '' } = useParams<{ deviceID: string; serviceID: string }>()
  const [showError, setShowError] = useState<boolean>(true)
  const { devices } = useDispatch<Dispatch>()
  const { connection, service, device, thisDevice, fetching, access } = useSelector((state: ApplicationState) => {
    const connection = state.backend.connections.find(c => c.id === serviceID)
    const [service, device] = selectService(state, serviceID)
    return {
      service,
      device,
      connection,
      thisDevice: state.backend.device?.uid === device?.id,
      fetching: state.devices.fetching,
      access: state.accounts.access,
    }
  })

  // useEffect(() => {
  //   analyticsHelper.page('ServicePage')
  //   if (!device && connection?.deviceID) devices.fetchSingle({ deviceId: connection.deviceID, hidden: true })
  // }, [])

  // if (!device && fetching) return <LoadingMessage message="Fetching data..." />

  if (!service || !device) return <UnauthorizedPage />

  return (
    <Container
      header={
        <>
          <Typography variant="h1">
            <ConnectionStateIcon connection={connection} service={service} thisDevice={thisDevice} size="lg" />
            <ServiceName connection={connection} service={service} inline />
            <ErrorButton connection={connection} onClick={() => setShowError(!showError)} visible={showError} />
            <AddUserButton device={device} />
            <LaunchButton connection={connection} service={service} />
            <CopyButton connection={connection} service={service} />
          </Typography>
          <List className={css.errorMessage}>
            <ConnectionErrorMessage connection={connection} service={service} visible={showError} />
          </List>
          {service.license === 'UNLICENSED' && <LicensingNotice device={device} />}
        </>
      }
    >
      <List>
        {!device.shared && (
          <ListItemLocation title="Edit Service" icon="pen" pathname={`/devices/${deviceID}/${serviceID}/edit`} dense />
        )}
        <UsersSelect service={service} device={device} access={access} />
        <ListItemLocation
          title="Service Details"
          icon="info-circle"
          pathname={`/devices/${deviceID}/${serviceID}/details`}
          dense
        />
      </List>
    </Container>
  )
}

const useStyles = makeStyles({
  errorMessage: { padding: 0 },
})
