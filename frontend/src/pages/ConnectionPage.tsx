import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, useLocation } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { PortSetting } from '../components/PortSetting'
import { NameSetting } from '../components/NameSetting'
import { ServiceName } from '../components/ServiceName'
import { HostSetting } from '../components/HostSetting'
import { ProxySetting } from '../components/ProxySetting'
import { selectById } from '../models/devices'
import { LicensingNotice } from '../components/LicensingNotice'
import { ServiceConnected } from '../components/ServiceConnected'
import { AutoStartSetting } from '../components/AutoStartSetting'
import { CustomAttributeSettings } from '../components/CustomAttributeSettings'
import { ApplicationState, Dispatch } from '../store'
import { Typography, Divider, List, Collapse } from '@material-ui/core'
import { ConnectionErrorMessage } from '../components/ConnectionErrorMessage'
import { InlineTemplateSetting } from '../components/InlineTemplateSetting'
import { ConnectionLogSetting } from '../components/ConnectionLogSetting'
import { NoConnectionPage } from './NoConnectionPage'
import { LanShareSelect } from '../components/LanShareSelect'
import { LoadingMessage } from '../components/LoadingMessage'
import { AddUserButton } from '../buttons/AddUserButton'
import { ComboButton } from '../buttons/ComboButton'
import { LaunchButton } from '../buttons/LaunchButton'
import { ForgetButton } from '../buttons/ForgetButton'
import { ErrorButton } from '../buttons/ErrorButton'
import { EditButton } from '../buttons/EditButton'
import { CopyButton } from '../buttons/CopyButton'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { spacing } from '../styling'
import analyticsHelper from '../helpers/analyticsHelper'

export const ConnectionPage: React.FC = () => {
  const css = useStyles()
  const location = useLocation<{ autoConnect: boolean }>()
  const { serviceID = '' } = useParams<{ serviceID: string }>()
  const [showError, setShowError] = useState<boolean>(true)
  const { devices } = useDispatch<Dispatch>()
  const { connection, service, device, thisDevice, fetching, access } = useSelector((state: ApplicationState) => {
    const connection = state.backend.connections.find(c => c.id === serviceID)
    const [service, device] = selectById(state, serviceID)
    return {
      service,
      device,
      connection,
      thisDevice: state.backend.device?.uid === device?.id,
      fetching: state.devices.fetching,
      access: state.accounts.access,
    }
  })

  useEffect(() => {
    analyticsHelper.page('ServicePage')
    if (!device && connection?.deviceID) devices.fetchSingle({ deviceId: connection.deviceID, hidden: true })
  }, [])

  if (!device && fetching) return <LoadingMessage message="Fetching data..." />
  if (!service || !device) return <NoConnectionPage />

  return (
    <Container
      header={
        <>
          <Gutters inset>
            <ComboButton
              connection={connection}
              service={service}
              autoConnect={location.state?.autoConnect}
              size="large"
              fullWidth
            />
            <EditButton device={device} service={service} connection={connection} />
            <ErrorButton connection={connection} onClick={() => setShowError(!showError)} visible={showError} />
            <AddUserButton device={device} />
            <ForgetButton connection={connection} />
            <LaunchButton connection={connection} service={service} />
            <CopyButton connection={connection} service={service} />
          </Gutters>
          <ServiceConnected connection={connection} service={service} />
          {service.license === 'UNLICENSED' && <LicensingNotice device={device} />}
          <List className={css.errorMessage}>
            <ConnectionErrorMessage connection={connection} service={service} visible={showError} />
          </List>
        </>
      }
    >
      <List>
        <NameSetting connection={connection} service={service} />
        <PortSetting connection={connection} service={service} />
        <HostSetting connection={connection} service={service} />
      </List>
      <Divider variant="inset" />
      <List>
        <InlineTemplateSetting connection={connection} service={service} context="launch" />
        <InlineTemplateSetting connection={connection} service={service} context="copy" />
        <CustomAttributeSettings connection={connection} service={service} />
        <ProxySetting connection={connection} service={service} />
        <AutoStartSetting connection={connection} service={service} />
        <LanShareSelect connection={connection} service={service} />
        <ConnectionLogSetting connection={connection} service={service} />
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
