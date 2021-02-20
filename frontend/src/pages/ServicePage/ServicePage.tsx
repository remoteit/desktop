import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, useLocation } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { PortSetting } from '../../components/PortSetting'
import { NameSetting } from '../../components/NameSetting'
import { ServiceName } from '../../components/ServiceName'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { HostSetting } from '../../components/HostSetting'
import { ProxySetting } from '../../components/ProxySetting'
import { selectService } from '../../models/devices'
import { LicensingNotice } from '../../components/LicensingNotice'
import { ListItemLocation } from '../../components/ListItemLocation'
import { ServiceConnected } from '../../components/ServiceConnected'
import { AutoStartSetting } from '../../components/AutoStartSetting'
import { CustomAttributeSettings } from '../../components/CustomAttributeSettings'
import { ApplicationState, Dispatch } from '../../store'
import { Typography, Divider, List } from '@material-ui/core'
import { ConnectionErrorMessage } from '../../components/ConnectionErrorMessage'
import { InlineTemplateSetting } from '../../components/InlineTemplateSetting'
import { ConnectionLogSetting } from '../../components/ConnectionLogSetting'
import { ConnectionStateIcon } from '../../components/ConnectionStateIcon'
import { UnauthorizedPage } from '../UnauthorizedPage'
import { LanShareSelect } from '../../components/LanShareSelect'
import { LoadingMessage } from '../../components/LoadingMessage'
import { AddUserButton } from '../../buttons/AddUserButton'
import { ConnectButton } from '../../buttons/ConnectButton'
import { LaunchButton } from '../../buttons/LaunchButton'
import { ForgetButton } from '../../buttons/ForgetButton'
import { UsersSelect } from '../../components/UsersSelect'
import { ErrorButton } from '../../buttons/ErrorButton'
import { EditButton } from '../../buttons/EditButton'
import { CopyButton } from '../../buttons/CopyButton'
import { Container } from '../../components/Container'
import { Columns } from '../../components/Columns'
import { spacing } from '../../styling'
import analyticsHelper from '../../helpers/analyticsHelper'

export const ServicePage: React.FC = () => {
  const css = useStyles()
  const location = useLocation()
  const { serviceID = '' } = useParams<{ serviceID: string }>()
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
            <EditButton device={device} service={service} connection={connection} />
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
      This page should be replaced by the service overview and details page
      <List>
        {/* {!device.shared && (
          <ListItemLocation title="Edit Service" icon="pen" pathname={location.pathname + '/edit'} dense />
        )} */}
        <UsersSelect service={service} device={device} access={access} />
        <ListItemLocation title="Service Details" icon="info-circle" pathname={location.pathname + '/details'} dense />
      </List>
    </Container>
  )
}

const useStyles = makeStyles({
  errorMessage: { padding: 0 },
})
