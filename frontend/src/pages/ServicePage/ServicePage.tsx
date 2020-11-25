import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, useLocation } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { PortSetting } from '../../components/PortSetting'
import { NameSetting } from '../../components/NameSetting'
import { ServiceName } from '../../components/ServiceName'
import { Breadcrumbs } from '../../components/Breadcrumbs'
import { ProxySetting } from '../../components/ProxySetting'
import { selectService } from '../../models/devices'
import { CustomAttributeSettings } from '../../components/CustomAttributeSettings'
import { LicensingNotice } from '../../components/LicensingNotice'
import { ListItemLocation } from '../../components/ListItemLocation'
import { ServiceConnected } from '../../components/ServiceConnected'
import { AutoStartSetting } from '../../components/AutoStartSetting'
import { ApplicationState, Dispatch } from '../../store'
import { Typography, Divider, List } from '@material-ui/core'
import { ConnectionErrorMessage } from '../../components/ConnectionErrorMessage'
import { ConnectionStateIcon } from '../../components/ConnectionStateIcon'
import { UnauthorizedPage } from '../UnauthorizedPage'
import { LanShareSelect } from '../../components/LanShareSelect'
import { LoadingMessage } from '../../components/LoadingMessage'
import { InlineTemplateSetting } from '../../components/InlineTemplateSetting'
import { AddUserButton } from '../../buttons/AddUserButton'
import { ConnectButton } from '../../buttons/ConnectButton'
import { LaunchButton } from '../../buttons/LaunchButton'
import { ForgetButton } from '../../buttons/ForgetButton'
import { UsersSelect } from '../../components/UsersSelect'
import { ErrorButton } from '../../buttons/ErrorButton'
import { EditButton } from '../../buttons/EditButton'
import { CopyConnectionButton } from '../../buttons/CopyConnectionButton'
import { Container } from '../../components/Container'
import { Columns } from '../../components/Columns'
import { spacing } from '../../styling'
import analyticsHelper from '../../helpers/analyticsHelper'

export const ServicePage: React.FC = () => {
  const css = useStyles()
  const location = useLocation()
  const { serviceID = '' } = useParams<{ serviceID: string }>()
  const [showError, setShowError] = useState<boolean>(false)
  const { devices } = useDispatch<Dispatch>()
  const { connection, service, device, thisDevice, fetching } = useSelector((state: ApplicationState) => {
    const connection = state.backend.connections.find(c => c.id === serviceID)
    const [service, device] = selectService(state, serviceID)
    return {
      service,
      device,
      connection,
      thisDevice: state.backend.device?.uid === device?.id,
      fetching: state.devices.fetching,
    }
  })

  useEffect(() => {
    analyticsHelper.page('ServicePage')
    if (!device && connection?.deviceID) devices.fetchSingle({ deviceId: connection.deviceID, hidden: true })
  }, [])

  if (!device && fetching) return <LoadingMessage message="Fetching data..." />
  if (!service || !device) return <UnauthorizedPage />

  return (
    <Container
      header={
        <>
          <Breadcrumbs />
          <Typography variant="h1">
            <ConnectionStateIcon connection={connection} service={service} thisDevice={thisDevice} size="lg" />
            <ServiceName connection={connection} service={service} inline />
            <EditButton device={device} service={service} connection={connection} />
            <AddUserButton device={device} />
            <ErrorButton connection={connection} onClick={() => setShowError(!showError)} visible={showError} />
            <ForgetButton connection={connection} />
            <LaunchButton connection={connection} service={service} />
            <CopyConnectionButton connection={connection} service={service} />
          </Typography>
          <List className={css.errorMessage}>
            <ConnectionErrorMessage connection={connection} service={service} visible={showError} />
          </List>
          {service.license === 'UNLICENSED' && <LicensingNotice device={device} />}
        </>
      }
    >
      <ServiceConnected connection={connection} service={service} />
      <Columns center>
        <List>
          <NameSetting connection={connection} service={service} />
          <PortSetting connection={connection} service={service} />
          <InlineTemplateSetting connection={connection} service={service} context="launch" />
          <InlineTemplateSetting connection={connection} service={service} context="copy" />
          <CustomAttributeSettings connection={connection} service={service} />
        </List>
        <div className={css.actions}>
          <ConnectButton
            connection={connection}
            service={service}
            autoConnect={location.state?.autoConnect}
            size="medium"
          />
        </div>
      </Columns>
      <Divider />
      <List>
        <ProxySetting connection={connection} service={service} />
        <AutoStartSetting connection={connection} service={service} />
        <LanShareSelect connection={connection} service={service} />
      </List>
      <Divider />
      <List>
        {!device.shared && (
          <ListItemLocation title="Edit Service" icon="pen" pathname={location.pathname + '/edit'} dense />
        )}
        <UsersSelect service={service} device={device} />
        <ListItemLocation title="Service Details" icon="info-circle" pathname={location.pathname + '/details'} dense />
      </List>
    </Container>
  )
}

const useStyles = makeStyles({
  actions: {
    marginRight: spacing.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorMessage: { padding: 0 },
})
