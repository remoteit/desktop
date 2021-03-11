import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, useLocation } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { PortSetting } from '../components/PortSetting'
import { NameSetting } from '../components/NameSetting'
import { HostSetting } from '../components/HostSetting'
import { ProxySetting } from '../components/ProxySetting'
import { selectById } from '../models/devices'
import { LicensingNotice } from '../components/LicensingNotice'
import { ServiceConnected } from '../components/ServiceConnected'
import { AutoStartSetting } from '../components/AutoStartSetting'
import { CustomAttributeSettings } from '../components/CustomAttributeSettings'
import { ApplicationState, Dispatch } from '../store'
import { Divider, List } from '@material-ui/core'
import { ConnectionErrorMessage } from '../components/ConnectionErrorMessage'
import { InlineTemplateSetting } from '../components/InlineTemplateSetting'
import { ConnectionLogSetting } from '../components/ConnectionLogSetting'
import { NoConnectionPage } from './NoConnectionPage'
import { LanShareSelect } from '../components/LanShareSelect'
import { LoadingMessage } from '../components/LoadingMessage'
import { ComboButton } from '../buttons/ComboButton'
import { LaunchButton } from '../buttons/LaunchButton'
import { ForgetButton } from '../buttons/ForgetButton'
import { ErrorButton } from '../buttons/ErrorButton'
import { InfoButton } from '../buttons/InfoButton'
import { CopyButton } from '../buttons/CopyButton'
import { Container } from '../components/Container'
import { Gutters } from '../components/Gutters'
import { spacing } from '../styling'
import analyticsHelper from '../helpers/analyticsHelper'

export const ConnectionPage: React.FC = () => {
  const css = useStyles()
  const location = useLocation<{ autoConnect: boolean }>()
  const { deviceID, serviceID, sessionID } = useParams<{ deviceID?: string; serviceID?: string; sessionID?: string }>()
  const [showError, setShowError] = useState<boolean>(true)
  const { devices } = useDispatch<Dispatch>()
  const { service, device, connection, session, fetching } = useSelector((state: ApplicationState) => {
    const [service, device] = selectById(state, serviceID)
    return {
      service,
      device,
      connection: state.backend.connections.find(c => c.id === serviceID),
      session: state.sessions.all.find(s => s.id === sessionID),
      fetching: state.devices.fetching,
    }
  })

  useEffect(() => {
    analyticsHelper.page('ServicePage')
    const id = connection?.deviceID || deviceID
    if (!device && id) devices.fetchSingle({ id, hidden: true })
  }, [deviceID])

  if (!device && fetching) return <LoadingMessage message="Fetching data..." />
  if (!service || !device) return <NoConnectionPage />

  return (
    <Container
      header={
        <>
          <Gutters className={css.gutters} inset>
            <ComboButton
              connection={connection}
              service={service}
              autoConnect={location.state?.autoConnect}
              size="large"
              fullWidth
            />
            <InfoButton device={device} service={service} />
            <ErrorButton connection={connection} onClick={() => setShowError(!showError)} visible={showError} />
            <ForgetButton connection={connection} />
            <CopyButton connection={connection} service={service} />
            <LaunchButton connection={connection} service={service} />
          </Gutters>
          <ServiceConnected connection={connection} session={session} show={connection?.enabled} />
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
  gutters: {
    display: 'flex',
    margin: spacing.lg,
  },
})
