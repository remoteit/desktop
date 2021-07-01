import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, useLocation, useHistory } from 'react-router-dom'
import { selectById } from '../models/devices'
import { PortSetting } from '../components/PortSetting'
import { NameSetting } from '../components/NameSetting'
import { ProxySetting } from '../components/ProxySetting'
import { PublicSetting } from '../components/PublicSetting'
import { TimeoutSetting } from '../components/TimeoutSetting'
import { LicensingNotice } from '../components/LicensingNotice'
import { ConnectionDetails } from '../components/ConnectionDetails'
import { newConnection } from '../helpers/connectionHelper'
import { CustomAttributeSettings } from '../components/CustomAttributeSettings'
import { ApplicationState, Dispatch } from '../store'
import { makeStyles, Divider, List } from '@material-ui/core'
import { ConnectionErrorMessage } from '../components/ConnectionErrorMessage'
import { InlineTemplateSetting } from '../components/InlineTemplateSetting'
import { ConnectionLogSetting } from '../components/ConnectionLogSetting'
import { ServiceAttributes } from '../components/ServiceAttributes'
import { AccordionMenuItem } from '../components/AccordionMenuItem'
import { NoConnectionPage } from './NoConnectionPage'
import { LanShareSelect } from '../components/LanShareSelect'
import { LoadingMessage } from '../components/LoadingMessage'
import { LaunchButton } from '../buttons/LaunchButton'
import { ForgetButton } from '../buttons/ForgetButton'
import { ComboButton } from '../buttons/ComboButton'
import { ClearButton } from '../buttons/ClearButton'
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
  const history = useHistory()
  const { deviceID, serviceID, sessionID } = useParams<{ deviceID?: string; serviceID?: string; sessionID?: string }>()
  const [showError, setShowError] = useState<boolean>(true)
  const { devices, ui } = useDispatch<Dispatch>()
  const { service, device, connection, session, fetching, accordion } = useSelector((state: ApplicationState) => {
    const [service, device] = selectById(state, serviceID)
    return {
      service,
      device,
      connection: state.connections.all.find(c => c.id === serviceID) || newConnection(service),
      session: state.sessions.all.find(s => s.id === sessionID),
      fetching: state.devices.fetching,
      accordion: state.ui.accordion,
    }
  })
  const accordionConfig = connection?.enabled ? 'configConnected' : 'config'

  useEffect(() => {
    analyticsHelper.page('ServicePage')
    const id = connection?.deviceID || deviceID

    if (!device && id) devices.fetchSingle({ id, hidden: true })
  }, [deviceID])

  if (!device && fetching) return <LoadingMessage message="Fetching data..." />
  if (!service || !device) return <NoConnectionPage />

  return (
    <Container
      gutterBottom
      header={
        <>
          <Gutters className={css.gutters}>
            <ErrorButton connection={connection} onClick={() => setShowError(!showError)} visible={showError} />
            <ComboButton
              connection={connection}
              service={service}
              autoConnect={location.state?.autoConnect}
              onClick={() => history.push(`/connections/${service?.id}`)}
              size="large"
              fullWidth
            />
            <InfoButton device={device} service={service} />
            <ClearButton connection={connection} />
            <ForgetButton connection={connection} />
          </Gutters>
          <List className={css.errorMessage}>
            <ConnectionErrorMessage connection={connection} service={service} visible={showError} />
          </List>
          <Gutters>
            <ConnectionDetails connection={connection} service={service} session={session} show={connection?.enabled} />
            {service.license === 'UNLICENSED' && <LicensingNotice device={device} />}
          </Gutters>
        </>
      }
    >
      <AccordionMenuItem
        subtitle="Configuration"
        expanded={accordion[accordionConfig]}
        onClick={() => ui.accordion({ [accordionConfig]: !accordion[accordionConfig] })}
        gutterTop
      >
        <List disablePadding>
          <NameSetting connection={connection} service={service} device={device} />
          <PortSetting connection={connection} service={service} />
          <InlineTemplateSetting connection={connection} service={service} context="launch" />
          <InlineTemplateSetting connection={connection} service={service} context="copy" />
          <CustomAttributeSettings connection={connection} service={service} />
        </List>
      </AccordionMenuItem>
      <AccordionMenuItem
        subtitle="Options"
        expanded={accordion.options}
        onClick={() => ui.accordion({ options: !accordion.options })}
        gutterTop
      >
        <List disablePadding>
          <TimeoutSetting connection={connection} service={service} />
          <ProxySetting connection={connection} service={service} />
          <LanShareSelect connection={connection} service={service} />
          <ConnectionLogSetting connection={connection} service={service} />
          <PublicSetting connection={connection} service={service} />
        </List>
      </AccordionMenuItem>
      <AccordionMenuItem
        subtitle="Service Details"
        expanded={accordion.service}
        onClick={() => ui.accordion({ service: !accordion.service })}
        gutterTop
      >
        <ServiceAttributes service={service} disablePadding />
      </AccordionMenuItem>
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
  gutters: { display: 'flex' },
})
