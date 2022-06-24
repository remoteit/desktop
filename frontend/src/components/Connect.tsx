import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, useLocation } from 'react-router-dom'
import { getDeviceModel } from '../models/accounts'
import { windowOpen } from '../services/Browser'
import { selectById } from '../models/devices'
import { PortSetting } from './PortSetting'
import { NameSetting } from './NameSetting'
import { ProxySetting } from './ProxySetting'
import { PublicSetting } from './PublicSetting'
import { NetworksJoined } from './NetworksJoined'
import { TimeoutSetting } from './TimeoutSetting'
import { LicensingNotice } from './LicensingNotice'
import { selectConnection } from '../helpers/connectionHelper'
import { ConnectionDetails } from './ConnectionDetails'
import { makeStyles, List, Button, Chip, Box } from '@material-ui/core'
import { ApplicationState, Dispatch } from '../store'
import { selectNetworks, selectNetworkByService } from '../models/networks'
import { ConnectionErrorMessage } from './ConnectionErrorMessage'
import { ConnectionLogSetting } from './ConnectionLogSetting'
import { DynamicButtonMenu } from '../buttons/DynamicButtonMenu'
import { TargetHostSetting } from './TargetHostSetting'
import { AccordionMenuItem } from './AccordionMenuItem'
import { NoConnectionPage } from '../pages/NoConnectionPage'
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
  const { service, device, connection, session, networks, joinedNetworks, fetching, accordion } = useSelector(
    (state: ApplicationState) => {
      const [service, device] = selectById(state, serviceID)
      return {
        service,
        device,
        connection: selectConnection(state, service),
        session: state.sessions.all.find(s => s.id === sessionID),
        networks: selectNetworks(state),
        joinedNetworks: selectNetworkByService(state, serviceID),
        fetching: getDeviceModel(state).fetching,
        accordion: state.ui.accordion,
      }
    }
  )
  const accordionConfig = connection?.enabled ? 'configConnected' : 'config'
  const availableNetworks = networks.filter(n => !joinedNetworks.find(j => j.id === n.id))

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
      <GuideStep
        guide="guideAWS"
        step={5}
        instructions="Enable the connect on demand listener by adding the service to your network. The connection will auto launch."
      >
        <Gutters className={css.gutters} top="lg">
          <ErrorButton connection={connection} onClick={() => setShowError(!showError)} visible={showError} />
          <ComboButton
            connection={connection}
            service={service}
            permissions={device.permissions}
            size="large"
            fullWidth
            onClick={() => dispatch.ui.guide({ guide: 'guideAWS', step: 0, done: true })}
          />
          <ForgetButton connection={connection} inline />
        </Gutters>
      </GuideStep>
      <List disablePadding>
        <ConnectionErrorMessage connection={connection} service={service} visible={showError} />
      </List>
      <Gutters>
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
            <GuideStep
              step={1}
              highlight
              placement="left"
              guide="guideLaunch"
              hide={!accordion[accordionConfig]}
              instructions="You can now launch services by deep link URL or terminal command."
            >
              <LaunchSelect connection={connection} service={service} />
            </GuideStep>
          </List>
        </AccordionMenuItem>
        <AccordionMenuItem
          gutters
          subtitle="Networks"
          expanded={accordion.networks}
          action={
            <Box display="flex" alignItems="center">
              {!!joinedNetworks.length && <Chip size="small" label={joinedNetworks.length.toLocaleString()} />}
              <DynamicButtonMenu
                options={availableNetworks.map(n => ({ value: n.id, label: n.name }))}
                title={availableNetworks.length === 1 ? `Add to ${availableNetworks[0].name}` : 'Add to network'}
                size="icon"
                icon="plus"
                disabled={!availableNetworks.length}
                onClick={networkId => {
                  if (!service) return
                  dispatch.networks.add({ serviceId: service.id, networkId })
                  dispatch.ui.accordion({ networks: true })
                }}
              />
            </Box>
          }
          onClick={() => dispatch.ui.accordion({ networks: !accordion.networks })}
          elevation={0}
        >
          <NetworksJoined service={service} networks={joinedNetworks} />
        </AccordionMenuItem>
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
              <LanShareSelect connection={connection} service={service} />
              <TargetHostSetting connection={connection} service={service} />
              <ConnectionLogSetting connection={connection} service={service} />
            </DesktopUI>
            <PortalUI>
              <PublicSetting connection={connection} service={service} />
              <Notice
                gutterBottom
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
