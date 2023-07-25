import React, { useState, useContext, useEffect } from 'react'
import { ConnectionErrorMessage } from '../components/ConnectionErrorMessage'
import { useDispatch, useSelector } from 'react-redux'
import { Dispatch, ApplicationState } from '../store'
import { DeviceContext } from '../services/Context'
import { ListItemCopy } from '../components/ListItemCopy'
import { ComboButton } from './ComboButton'
import { GuideBubble } from '../components/GuideBubble'
import { ErrorButton } from '../buttons/ErrorButton'
import { makeStyles } from '@mui/styles'
import { Typography } from '@mui/material'
import { DesktopUI } from '../components/DesktopUI'
import { PortalUI } from '../components/PortalUI'
import { Gutters } from '../components/Gutters'
import { spacing } from '../styling'
import { Notice } from '../components/Notice'
import { Link } from '../components/Link'

export const ServiceConnectButton: React.FC = () => {
  const { device, service, connection, instance, user } = useContext(DeviceContext)
  const { connectThisDevice } = useSelector((state: ApplicationState) => state.ui)
  const [showError, setShowError] = useState<boolean>(true)
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()

  useEffect(() => {
    dispatch.ui.set({ connectThisDevice: false })
  }, [device?.id])

  if (connection.connectLink) return null

  const thisDevice = device?.thisDevice && instance?.owner.id === user.id
  const displayThisDevice = thisDevice && !connectThisDevice

  return (
    <>
      {displayThisDevice ? (
        <>
          <Notice gutterTop solid severity="info">
            This service can be connected to from anywhere using Remote.It.
          </Notice>
          <Notice gutterTop severity="warning">
            <Typography variant="body2" gutterBottom>
              You are on the same device as this service, so you should not connect with Remote.It. Connect directly
              using the address below:
            </Typography>
            <ListItemCopy
              label="Local endpoint"
              value={`${service?.host || '127.0.0.1'}:${service?.port}`}
              showBackground
              alwaysWhite
              fullWidth
            />
            <Typography variant="caption" display="block" marginTop={2} marginBottom={1}>
              <Link color="grayDark.main" onClick={() => dispatch.ui.set({ connectThisDevice: true })}>
                Connect anyway, I know what I'm doing.
              </Link>
            </Typography>
          </Notice>
        </>
      ) : (
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
              permissions={instance?.permissions}
              onClick={() => dispatch.ui.guide({ guide: 'aws', step: 6 })}
              fullWidth
            />
          </Gutters>
        </GuideBubble>
      )}
      <ConnectionErrorMessage connection={connection} visible={showError} />
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
