import React, { useEffect } from 'react'
import { List, Button, Collapse, Divider } from '@mui/material'
import { State, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, useLocation } from 'react-router-dom'
import { useApplication } from '../hooks/useApplication'
import { isReverseProxy } from '../models/applicationTypes'
import { DeviceContext } from '../services/Context'
import { windowOpen } from '../services/Browser'
import { ConnectionData } from './ConnectionData'
import { LicensingNotice } from './LicensingNotice'
import { ConnectionDetails } from './ConnectionDetails'
import { ConnectLinkSetting } from './ConnectLinkSetting'
import { ServiceAttributes } from './ServiceAttributes'
import { NetworksAccordion } from './NetworksAccordion'
import { AccordionMenuItem } from './AccordionMenuItem'
import { ServiceKeySetting } from './ServiceKeySetting'
import { ListItemLocation } from './ListItemLocation'
import { AutoLaunchToggle } from './AutoLaunchToggle'
import { ConnectionSurvey } from './ConnectionSurvey'
import { AccessAccordion } from './AccessAccordion'
import { ConnectionMenu } from './ConnectionMenu'
import { GraphItem } from './GraphItem'
import { PortalUI } from './PortalUI'
import { Gutters } from './Gutters'
import { Notice } from './Notice'
import { Icon } from './Icon'
import { Pre } from './Pre'

export const Connect: React.FC<{ variant?: 'connection' | 'session' }> = ({ variant = 'connection' }) => {
  const location = useLocation<{
    autoConnect?: boolean
    autoLaunch?: boolean
    autoCopy?: boolean
    autoFeedback?: boolean
  }>()
  const dispatch = useDispatch<Dispatch>()
  const { sessionID } = useParams<{ deviceID?: string; sessionID?: string }>()
  const { connection, device, service, instance } = React.useContext(DeviceContext)
  const session = useSelector((state: State) => state.sessions.all.find(s => s.id === sessionID))
  const accordion = useSelector((state: State) => state.ui.accordion)
  const reverseProxy = useSelector((state: State) => isReverseProxy(state, service?.typeID))
  const showDesktopNotice = useSelector((state: State) => state.ui.showDesktopNotice)

  const app = useApplication(service, connection)

  useEffect(() => {
    if (!location.state) return
    if (location.state.autoConnect) dispatch.ui.set({ autoConnect: true })
    if (location.state.autoLaunch) dispatch.ui.set({ autoLaunch: true })
    if (location.state.autoCopy) dispatch.ui.set({ autoCopy: true })
  }, [location])

  if (!service || !instance) return null

  return (
    <>
      <Gutters top={null} size="md" bottom={null}>
        <ConnectionDetails
          app={app}
          connection={connection}
          session={session}
          showTitle={variant === 'session' ? session?.user?.email : undefined}
          show={connection.enabled || !!connection.connectLink || variant === 'session'}
        >
          <ConnectionData
            connection={variant === 'connection' ? connection : undefined}
            service={service}
            session={session}
          />
        </ConnectionDetails>
      </Gutters>
      {service.license === 'UNLICENSED' && <LicensingNotice instance={instance} />}
      <ConnectionSurvey connection={connection} highlight={!!location.state?.autoFeedback} />
      <Gutters size="md" bottom={null}>
        {variant === 'connection' && (
          <AccordionMenuItem
            gutters
            subtitle="Connection"
            expanded={accordion.config}
            onClick={() => dispatch.ui.accordion({ config: !accordion.config })}
            action={<ConnectionMenu connection={connection} service={service} />}
          >
            <List disablePadding>
              <ListItemLocation
                icon="sliders"
                title="Connection configuration"
                disabled={!!connection.connectLink}
                to="advanced"
                showDisabled
                dense
              >
                <Icon name="angle-right" inlineLeft fixedWidth />
              </ListItemLocation>
              <Divider variant="inset" sx={{ marginTop: 1, marginBottom: 1 }} />
              <Collapse in={!connection.connectLink && app.canLaunch}>
                <AutoLaunchToggle connection={connection} service={service} />
              </Collapse>
              {reverseProxy ? (
                <ConnectLinkSetting
                  connection={connection}
                  permissions={instance.permissions}
                  reverseProxy={reverseProxy}
                  disabled={!reverseProxy}
                />
              ) : (
                <ServiceKeySetting connection={connection} service={service} permissions={instance.permissions} />
              )}
              <PortalUI>
                {showDesktopNotice && (
                  <Notice
                    gutterTop
                    severity="info"
                    onClose={() => dispatch.ui.setPersistent({ showDesktopNotice: false })}
                  >
                    <strong>Want Persistent Private Endpoints?</strong>
                    <em>
                      On demand connections with persistent endpoints, remote access, and improved launch commands.
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
                )}
              </PortalUI>
            </List>
          </AccordionMenuItem>
        )}
        <AccordionMenuItem gutters subtitle="Service" defaultExpanded>
          {device?.permissions.includes('MANAGE') && (
            <>
              <ListItemLocation icon="sliders" title="Service configuration" to="edit" dense>
                <Icon name="angle-right" inlineLeft fixedWidth />
              </ListItemLocation>
              <Divider variant="inset" sx={{ marginTop: 1 }} />
            </>
          )}
          <GraphItem service={service} />
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
