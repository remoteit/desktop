import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, useLocation } from 'react-router-dom'
import { selectById } from '../models/devices'
import { PortSetting } from './PortSetting'
import { NameSetting } from './NameSetting'
import { ProxySetting } from './ProxySetting'
import { PublicSetting } from './PublicSetting'
import { TimeoutSetting } from './TimeoutSetting'
import { LicensingNotice } from './LicensingNotice'
import { selectConnection } from '../helpers/connectionHelper'
import { makeStyles, List } from '@material-ui/core'
import { ConnectionDetails } from './ConnectionDetails'
import { ApplicationState, Dispatch } from '../store'
import { ConnectionErrorMessage } from './ConnectionErrorMessage'
import { ConnectionLogSetting } from './ConnectionLogSetting'
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
import { Gutters } from './Gutters'
import { spacing } from '../styling'
import analyticsHelper from '../helpers/analyticsHelper'

export const Connect: React.FC = () => {
  const css = useStyles()
  const location = useLocation<{ autoConnect: boolean }>()
  const { deviceID, serviceID, sessionID } = useParams<{ deviceID?: string; serviceID?: string; sessionID?: string }>()
  const [showError, setShowError] = useState<boolean>(true)
  const { devices, ui } = useDispatch<Dispatch>()
  const { service, device, connection, session, fetching, accordion } = useSelector((state: ApplicationState) => {
    const [service, device] = selectById(state, serviceID)
    return {
      service,
      device,
      connection: selectConnection(state, service),
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
    <>
      <ConnectionDetails connection={connection} service={service} session={session} show={connection?.enabled} />
      {service.license === 'UNLICENSED' && <LicensingNotice device={device} />}
      <GuideStep
        guide="guideAWS"
        step={5}
        instructions="Now enable the connect on demand listener by adding the service to your network."
      >
        <Gutters className={css.gutters} top="lg">
          <ErrorButton connection={connection} onClick={() => setShowError(!showError)} visible={showError} />
          <ComboButton
            connection={connection}
            service={service}
            autoConnect={location.state?.autoConnect}
            permissions={device.permissions}
            size="large"
            fullWidth
            onClick={() => ui.guide({ guide: 'guideAWS', step: 6 })}
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
          onClick={() => ui.accordion({ [accordionConfig]: !accordion[accordionConfig] })}
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
          subtitle="Options"
          expanded={accordion.options}
          onClick={() => ui.accordion({ options: !accordion.options })}
          elevation={0}
        >
          <List disablePadding>
            <DesktopUI>
              <TimeoutSetting connection={connection} service={service} />
              <ProxySetting connection={connection} service={service} />
              <LanShareSelect connection={connection} service={service} />
            </DesktopUI>
            <PublicSetting connection={connection} service={service} />
            <DesktopUI>
              <ConnectionLogSetting connection={connection} service={service} />
              <TargetHostSetting connection={connection} service={service} />
            </DesktopUI>
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
