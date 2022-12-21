import React, { useEffect } from 'react'
import { List, Button, Collapse, Divider } from '@mui/material'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, useLocation } from 'react-router-dom'
import { canUseConnectLink } from '../models/applicationTypes'
import { getDeviceModel } from '../selectors/devices'
import { DeviceContext } from '../services/Context'
import { windowOpen } from '../services/Browser'
import { LicensingNotice } from './LicensingNotice'
import { ConnectionDetails } from './ConnectionDetails'
import { ServiceConnectButton } from '../buttons/ServiceConnectButton'
import { ConnectLinkSetting } from './ConnectLinkSetting'
import { ServiceAttributes } from './ServiceAttributes'
import { NetworksAccordion } from './NetworksAccordion'
import { AccordionMenuItem } from './AccordionMenuItem'
import { ListItemLocation } from './ListItemLocation'
import { AutoLaunchToggle } from './AutoLaunchToggle'
import { ConnectionSurvey } from './ConnectionSurvey'
import { AccessAccordion } from './AccessAccordion'
import { ConnectionMenu } from './ConnectionMenu'
import { PortalUI } from './PortalUI'
import { Gutters } from './Gutters'
import { Notice } from './Notice'
import { Icon } from './Icon'
import { Pre } from './Pre'

export const Connect: React.FC = () => {
  const location = useLocation<{
    autoConnect?: boolean
    autoLaunch?: boolean
    autoCopy?: boolean
    autoFeedback?: boolean
  }>()
  const { sessionID } = useParams<{ deviceID?: string; sessionID?: string }>()
  const { connection, device, service, instance } = React.useContext(DeviceContext)
  const dispatch = useDispatch<Dispatch>()
  const { session, accordion, showConnectLink } = useSelector((state: ApplicationState) => ({
    session: state.sessions.all.find(s => s.id === sessionID),
    fetching: getDeviceModel(state).fetching,
    accordion: state.ui.accordion,
    showConnectLink: canUseConnectLink(state, service?.typeID) && !(!connection.connectLink && connection.enabled),
  }))

  useEffect(() => {
    if (!location.state) return
    if (location.state.autoConnect) dispatch.ui.set({ autoConnect: true })
    if (location.state.autoLaunch) dispatch.ui.set({ autoLaunch: true })
    if (location.state.autoCopy) dispatch.ui.set({ autoCopy: true })
  }, [location])

  if (!service || !instance) return null

  return (
    <>
      <ConnectionDetails
        connection={connection}
        service={service}
        session={session}
        show={!!(connection.enabled && connection.host) || connection.connectLink}
      />
      {service.license === 'UNLICENSED' && <LicensingNotice instance={instance} />}
      {/* <ServiceConnectButton /> */}
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
                <strong>Want Persistent URLs?</strong>
                <em>On demand connections with persistent URLs, remote access, and improved launch commands.</em>
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
