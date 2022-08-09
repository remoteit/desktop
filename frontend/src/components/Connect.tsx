import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, useLocation } from 'react-router-dom'
import { getDeviceModel } from '../models/accounts'
import { windowOpen } from '../services/Browser'
import { selectById } from '../models/devices'
import { PortSetting } from './PortSetting'
import { NameSetting } from './NameSetting'
import { makeStyles } from '@mui/styles'
import { List, Button } from '@mui/material'
import { ProxySetting } from './ProxySetting'
import { PublicSetting } from './PublicSetting'
import { TimeoutSetting } from './TimeoutSetting'
import { LicensingNotice } from './LicensingNotice'
import { selectConnection } from '../helpers/connectionHelper'
import { ConnectionDetails } from './ConnectionDetails'
import { ApplicationState, Dispatch } from '../store'
import { ConnectionErrorMessage } from './ConnectionErrorMessage'
import { ConnectionLogSetting } from './ConnectionLogSetting'
import { NetworksAccordion } from './NetworksAccordion'
import { TargetHostSetting } from './TargetHostSetting'
import { AccordionMenuItem } from './AccordionMenuItem'
import { NoConnectionPage } from '../pages/NoConnectionPage'
import { ConnectionSurvey } from './ConnectionSurvey'
import { LanShareSelect } from './LanShareSelect'
import { LoadingMessage } from './LoadingMessage'
import { ForgetButton } from '../buttons/ForgetButton'
import { LaunchSelect } from './LaunchSelect'
import { ComboButton } from '../buttons/ComboButton'
import { ErrorButton } from '../buttons/ErrorButton'
import { DesktopUI } from './DesktopUI'
import { GuideStep } from './GuideStep'
import { PortalUI } from './PortalUI'
import { Gutters } from './Gutters'
import { spacing } from '../styling'
import { Notice } from './Notice'
import analyticsHelper from '../helpers/analyticsHelper'

export const Connect: React.FC = () => {
  const css = useStyles()
  const location = useLocation<{ autoConnect?: boolean; autoLaunch?: boolean; autoCopy?: boolean }>()
  const { deviceID, serviceID, sessionID } = useParams<{ deviceID?: string; serviceID?: string; sessionID?: string }>()
  const [showError, setShowError] = useState<boolean>(true)
  const dispatch = useDispatch<Dispatch>()
  const { service, device, connection, session, fetching, accordion } = useSelector((state: ApplicationState) => {
    const [service, device] = selectById(state, serviceID)
    return {
      service,
      device,
      connection: selectConnection(state, service),
      session: state.sessions.all.find(s => s.id === sessionID),
      fetching: getDeviceModel(state).fetching,
      accordion: state.ui.accordion,
    }
  })
  const accordionConfig = connection?.enabled ? 'configConnected' : 'config'

  useEffect(() => {
    analyticsHelper.page('ServicePage')
    const id = connection?.deviceID || deviceID

    if (!device && id) dispatch.devices.fetchSingle({ id, hidden: true })
  }, [deviceID])

  useEffect(() => {
    if (!location.state) return
    if (location.state.autoConnect) dispatch.ui.set({ autoConnect: true })
    if (location.state.autoLaunch) dispatch.ui.set({ autoLaunch: true })
    if (location.state.autoCopy) dispatch.ui.set({ autoCopy: true })
  }, [location])

  if (!device && fetching) return <LoadingMessage message="Fetching data..." />
  if (!service || !device) return <NoConnectionPage />

  return (
    <>
      <ConnectionDetails connection={connection} service={service} session={session} show={connection?.enabled} />
      {service.license === 'UNLICENSED' && <LicensingNotice device={device} />}
      <ConnectionSurvey connection={connection} />
      <GuideStep
        guide="guideAWS"
        step={5}
        instructions={
          'Enable the connect on demand listener by adding the service to your network.' +
          (connection.autoLaunch ? ' The connection will auto launch.' : '')
        }
      >
        <Gutters className={css.gutters} top={null}>
          <ErrorButton connection={connection} onClick={() => setShowError(!showError)} visible={showError} />
          <ComboButton
            connection={connection}
            service={service}
            permissions={device.permissions}
            size="large"
            fullWidth
            onClick={() => dispatch.ui.guide({ guide: 'guideAWS', step: 6 })}
          />
          <ForgetButton connection={connection} inline />
        </Gutters>
      </GuideStep>
      <List disablePadding>
        <ConnectionErrorMessage connection={connection} service={service} visible={showError} />
      </List>
      <Gutters top={null}>
        <AccordionMenuItem
          gutters
          subtitle="Configuration"
          expanded={accordion[accordionConfig]}
          onClick={() => dispatch.ui.accordion({ [accordionConfig]: !accordion[accordionConfig] })}
          elevation={0}
        >
          <List disablePadding>
            <DesktopUI>
              <NameSetting connection={connection} service={service} device={device} />
              <PortSetting connection={connection} service={service} />
            </DesktopUI>
            <LaunchSelect connection={connection} service={service} />
            <PortalUI>
              <Notice
                gutterTop
                severity="info"
                button={
                  <Button
                    size="small"
                    color="primary"
                    variant="contained"
                    onClick={() => windowOpen('https://link.remote.it/download')}
                  >
                    Download
                  </Button>
                }
              >
                <strong>Get Desktop for additional features and control.</strong>
                <em>
                  Peer-to-peer and on demand connections with persistent URLs and LAN sharing. Remote system and network
                  access. Improved launch commands and the Remote.It CLI.
                </em>
              </Notice>
            </PortalUI>
          </List>
        </AccordionMenuItem>
        <NetworksAccordion
          device={device}
          service={service}
          connection={connection}
          expanded={accordion.networks}
          onClick={() => dispatch.ui.accordion({ networks: !accordion.networks })}
        />
        <AccordionMenuItem
          gutters
          subtitle="Options"
          expanded={accordion.options}
          onClick={() => dispatch.ui.accordion({ options: !accordion.options })}
          elevation={0}
        >
          <List disablePadding>
            <DesktopUI>
              <TimeoutSetting connection={connection} service={service} />
              <ProxySetting connection={connection} service={service} />
              <LanShareSelect connection={connection} />
              <TargetHostSetting connection={connection} service={service} />
              <ConnectionLogSetting connection={connection} service={service} />
            </DesktopUI>
            <PortalUI>
              <PublicSetting connection={connection} service={service} />
            </PortalUI>
          </List>
        </AccordionMenuItem>
      </Gutters>
    </>
  )
}

const useStyles = makeStyles({
  actions: {
    marginRight: spacing.md,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gutters: { display: 'flex' },
})
