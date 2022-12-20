import React, { useState, useEffect } from 'react'
import { List, Button, Typography, Collapse, Divider } from '@mui/material'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, useLocation } from 'react-router-dom'
import { canUseConnectLink } from '../models/applicationTypes'
import { getDeviceModel } from '../selectors/devices'
import { DeviceContext } from '../services/Context'
import { windowOpen } from '../services/Browser'
import { makeStyles } from '@mui/styles'
import { LicensingNotice } from './LicensingNotice'
import { ConnectionDetails } from './ConnectionDetails'
import { ConnectionErrorMessage } from './ConnectionErrorMessage'
import { ConnectLinkSetting } from './ConnectLinkSetting'
import { ServiceAttributes } from './ServiceAttributes'
import { NetworksAccordion } from './NetworksAccordion'
import { AccordionMenuItem } from './AccordionMenuItem'
import { ListItemLocation } from './ListItemLocation'
import { AutoLaunchToggle } from './AutoLaunchToggle'
import { ConnectionSurvey } from './ConnectionSurvey'
import { AccessAccordion } from './AccessAccordion'
import { ConnectionMenu } from './ConnectionMenu'
import { ComboButton } from '../buttons/ComboButton'
import { GuideBubble } from './GuideBubble'
import { ErrorButton } from '../buttons/ErrorButton'
import { DesktopUI } from './DesktopUI'
import { DataCopy } from './DataCopy'
import { PortalUI } from './PortalUI'
import { Gutters } from './Gutters'
import { spacing } from '../styling'
import { Notice } from './Notice'
import { Icon } from './Icon'
import { Pre } from './Pre'

export const Connect: React.FC = () => {
  const css = useStyles()
  const location = useLocation<{
    autoConnect?: boolean
    autoLaunch?: boolean
    autoCopy?: boolean
    autoFeedback?: boolean
  }>()
  const { sessionID } = useParams<{ deviceID?: string; sessionID?: string }>()
  const { connection, device, service, instance } = React.useContext(DeviceContext)
  const [showError, setShowError] = useState<boolean>(true)
  const [connectThisDevice, setConnectThisDevice] = useState<boolean>(false)
  const dispatch = useDispatch<Dispatch>()
  const { session, accordion, thisDevice, showConnectLink } = useSelector((state: ApplicationState) => ({
    thisDevice: device?.thisDevice && instance?.owner.id === state.user.id,
    session: state.sessions.all.find(s => s.id === sessionID),
    fetching: getDeviceModel(state).fetching,
    accordion: state.ui.accordion,
    showConnectLink: canUseConnectLink(state, service?.typeID) && !(!connection.connectLink && connection.enabled),
  }))

  const displayThisDevice = thisDevice && !connectThisDevice

  useEffect(() => {
    if (!location.state) return
    if (location.state.autoConnect) dispatch.ui.set({ autoConnect: true })
    if (location.state.autoLaunch) dispatch.ui.set({ autoLaunch: true })
    if (location.state.autoCopy) dispatch.ui.set({ autoCopy: true })
  }, [location])

  if (!service || !instance) return null

  return (
    <>
      {displayThisDevice && (
        <Notice gutterTop solid onClose={() => setConnectThisDevice(true)}>
          <Typography variant="h3">You are on the same device as this service.</Typography>
          <Typography variant="body2" gutterBottom>
            So you can connect directly without using Remote.It.
          </Typography>
          <DataCopy
            label="Local endpoint"
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
        show={!!(connection.enabled && connection.host) || connection.connectLink}
      />
      {service.license === 'UNLICENSED' && <LicensingNotice instance={instance} />}
      {!displayThisDevice && !connection.connectLink && (
        <GuideBubble
          guide="connectButton"
          enterDelay={400}
          placement="left"
          startDate={new Date('2022-09-20')}
          queueAfter={device ? 'availableServices' : 'addNetwork'}
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
              size="large"
              service={service}
              connection={connection}
              permissions={instance.permissions}
              onClick={() => dispatch.ui.guide({ guide: 'aws', step: 6 })}
              fullWidth
            />
          </Gutters>
        </GuideBubble>
      )}
      <ConnectionErrorMessage connection={connection} visible={showError} />
      <ConnectionSurvey connection={connection} highlight={!!location.state?.autoFeedback} />
      <Gutters size="md" bottom={null}>
        <AccordionMenuItem
          gutters
          subtitle="Connection"
          expanded={accordion.config}
          onClick={() => dispatch.ui.accordion({ config: !accordion.config })}
          action={<ConnectionMenu connection={connection} service={service} />}
        >
          <List disablePadding>
            <Collapse in={!connection.connectLink}>
              <AutoLaunchToggle connection={connection} service={service} />
            </Collapse>
            <Collapse in={showConnectLink}>
              <ConnectLinkSetting connection={connection} permissions={instance.permissions} />
            </Collapse>
            <Collapse in={!connection.connectLink}>
              <ListItemLocation icon="sliders" title="Connection configuration" pathname="advanced" dense>
                <Icon name="angle-right" inlineLeft fixedWidth />
              </ListItemLocation>
            </Collapse>
            <PortalUI>
              <Notice gutterTop severity="info">
                <strong>Want Persistent URLs for your system?</strong>
                <em>
                  Get Peer-to-peer on demand connections with persistent URLs. Remote system and network access.
                  Improved launch commands and the Remote.It CLI.
                </em>
                <Button
                  size="small"
                  color="primary"
                  variant="contained"
                  sx={{ marginTop: 1, marginBottom: 1 }}
                  onClick={() => windowOpen('https://link.remote.it/download/desktop')}
                >
                  Download Desktop
                </Button>
              </Notice>
            </PortalUI>
          </List>
        </AccordionMenuItem>
        <AccordionMenuItem gutters subtitle="Service" defaultExpanded>
          {device?.permissions.includes('MANAGE') && (
            <>
              <ListItemLocation icon="sliders" title="Service configuration" pathname="edit" dense>
                <Icon name="angle-right" inlineLeft fixedWidth />
              </ListItemLocation>
              <Divider variant="inset" sx={{ marginTop: 2, marginBottom: 3 }} />
            </>
          )}
          <ServiceAttributes device={device} service={service} disablePadding />
        </AccordionMenuItem>
        <NetworksAccordion
          instance={instance}
          service={service}
          connection={connection}
          expanded={accordion.networks}
          onClick={() => dispatch.ui.accordion({ networks: !accordion.networks })}
        />
        <AccessAccordion
          expanded={accordion.access}
          onClick={() => dispatch.ui.accordion({ access: !accordion.access })}
        />
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
