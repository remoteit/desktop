import React, { useState, useEffect } from 'react'
import { List, Button, Typography, Collapse } from '@mui/material'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, useLocation } from 'react-router-dom'
import { getDeviceModel } from '../models/accounts'
import { canUseConnectLink } from '../models/applicationTypes'
import { windowOpen } from '../services/Browser'
import { PortSetting } from './PortSetting'
import { NameSetting } from './NameSetting'
import { makeStyles } from '@mui/styles'
import { RouteSetting } from './RouteSetting'
import { PublicSetting } from './PublicSetting'
import { TimeoutSetting } from './TimeoutSetting'
import { LicensingNotice } from './LicensingNotice'
import { ConnectionDetails } from './ConnectionDetails'
import { ConnectionErrorMessage } from './ConnectionErrorMessage'
import { ConnectionLogSetting } from './ConnectionLogSetting'
import { NetworksAccordion } from './NetworksAccordion'
import { TargetHostSetting } from './TargetHostSetting'
import { AccordionMenuItem } from './AccordionMenuItem'
import { ConnectLinkSetting } from './ConnectLinkSetting'
import { NoConnectionPage } from '../pages/NoConnectionPage'
import { ConnectionSurvey } from './ConnectionSurvey'
import { LanShareSelect } from './LanShareSelect'
import { ConnectionMenu } from './ConnectionMenu'
import { LaunchSelect } from './LaunchSelect'
import { ComboButton } from '../buttons/ComboButton'
import { GuideBubble } from './GuideBubble'
import { ErrorButton } from '../buttons/ErrorButton'
import { DesktopUI } from './DesktopUI'
import { DataCopy } from './DataCopy'
import { PortalUI } from './PortalUI'
import { Gutters } from './Gutters'
import { spacing } from '../styling'
import { Notice } from './Notice'

type Props = {
  service?: IService
  device?: IDevice
  connection: IConnection
}

export const Connect: React.FC<Props> = ({ service, device, connection }) => {
  const css = useStyles()
  const location = useLocation<{
    autoConnect?: boolean
    autoLaunch?: boolean
    autoCopy?: boolean
    autoFeedback?: boolean
  }>()
  const { deviceID, sessionID } = useParams<{ deviceID?: string; sessionID?: string }>()
  const [showError, setShowError] = useState<boolean>(true)
  const dispatch = useDispatch<Dispatch>()
  const { session, accordion, ownDevice, canUseConnectLink } = useSelector((state: ApplicationState) => ({
    ownDevice: device?.thisDevice && device?.owner.id === state.user.id,
    session: state.sessions.all.find(s => s.id === sessionID),
    fetching: getDeviceModel(state).fetching,
    accordion: state.ui.accordion,
    canUseConnectLink: canUseConnectLink(state, service?.typeID),
  }))

  const accordionConfig = connection?.enabled ? 'configConnected' : 'config'

  useEffect(() => {
    // FIXME - move this up to the router level - for connection display now
    const id = connection?.deviceID || deviceID
    if (!device && id) dispatch.devices.fetchSingle({ id, hidden: true })
  }, [deviceID])

  useEffect(() => {
    if (!location.state) return
    if (location.state.autoConnect) dispatch.ui.set({ autoConnect: true })
    if (location.state.autoLaunch) dispatch.ui.set({ autoLaunch: true })
    if (location.state.autoCopy) dispatch.ui.set({ autoCopy: true })
  }, [location])

  if (!service || !device) return <NoConnectionPage />

  return (
    <>
      {ownDevice && (
        <Notice gutterTop solid>
          <Typography variant="h3">You are on the same device as this service.</Typography>
          <Typography variant="body2" gutterBottom>
            So you can connect directly without using Remote.It.
          </Typography>
          <DataCopy
            label="Connection endpoint"
            value={`${service.host || '127.0.0.1'}:${service.port}`}
            showBackground
            alwaysWhite
            fullWidth
          />
        </Notice>
      )}
      <ConnectionDetails
        connection={connection}
        service={service}
        session={session}
        show={!!(connection.enabled && connection.host)}
      />
      {service.license === 'UNLICENSED' && <LicensingNotice device={device} />}
      {(!ownDevice || connection.connectLink) && (
        <GuideBubble
          guide="connectButton"
          enterDelay={400}
          placement="left"
          startDate={new Date('2022-09-20')}
          queueAfter={deviceID ? 'availableServices' : 'addNetwork'}
          instructions={
            <>
              <Typography variant="h3" gutterBottom>
                <b>
                  <PortalUI>Starting a connection</PortalUI>
                  <DesktopUI>Connect on demand</DesktopUI>
                </b>
              </Typography>
              <PortalUI>
                <Typography variant="body2" gutterBottom>
                  Create a connection to this service with the button to the right.
                </Typography>
              </PortalUI>
              <DesktopUI>
                <Typography variant="body2" gutterBottom>
                  Start listening on to this endpoint for network requests. On request, automatically create the
                  connection and disconnect when idle.
                </Typography>
              </DesktopUI>
              {connection.autoLaunch && (
                <Typography variant="body2" gutterBottom>
                  <em>
                    This connection will launch when connected because the "Auto Launch" configuration toggle is on.
                  </em>
                </Typography>
              )}
            </>
          }
        >
          <Gutters size="md" className={css.gutters} bottom={null}>
            <ErrorButton connection={connection} onClick={() => setShowError(!showError)} visible={showError} />
            <ComboButton
              connection={connection}
              service={service}
              permissions={device.permissions}
              size="large"
              fullWidth
              loading={!device.loaded}
              onClick={() => dispatch.ui.guide({ guide: 'aws', step: 6 })}
            />
            <ConnectionMenu connection={connection} service={service} />
          </Gutters>
        </GuideBubble>
      )}
      <ConnectionErrorMessage connection={connection} visible={showError} />
      <ConnectionSurvey connection={connection} highlight={!!location.state?.autoFeedback} />
      <Gutters size="md" bottom={null}>
        <AccordionMenuItem
          gutters
          subtitle="Configuration"
          expanded={accordion[accordionConfig]}
          onClick={() => dispatch.ui.accordion({ [accordionConfig]: !accordion[accordionConfig] })}
          elevation={0}
        >
          <List disablePadding>
            <Collapse in={!connection.connectLink}>
              <DesktopUI>
                <NameSetting connection={connection} service={service} device={device} />
                <PortSetting connection={connection} service={service} />
              </DesktopUI>
              <LaunchSelect connection={connection} service={service} />
            </Collapse>
            {canUseConnectLink && <ConnectLinkSetting connection={connection} permissions={device.permissions} />}
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
              <RouteSetting connection={connection} service={service} />
              <LanShareSelect connection={connection} />
              <TargetHostSetting connection={connection} service={service} />
              <TimeoutSetting connection={connection} service={service} />
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
  gutters: { display: 'flex', alignItems: 'flex-end', '& button': { height: 45 } },
})
