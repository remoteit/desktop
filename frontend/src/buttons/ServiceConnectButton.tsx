import React, { useState, useContext } from 'react'
import { ConnectionErrorMessage } from '../components/ConnectionErrorMessage'
import { DeviceContext } from '../services/Context'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { makeStyles } from '@mui/styles'
import { Typography } from '@mui/material'
import { ComboButton } from './ComboButton'
import { GuideBubble } from '../components/GuideBubble'
import { ErrorButton } from '../buttons/ErrorButton'
import { DesktopUI } from '../components/DesktopUI'
import { PortalUI } from '../components/PortalUI'
import { DataCopy } from '../components/DataCopy'
import { Gutters } from '../components/Gutters'
import { spacing } from '../styling'
import { Notice } from '../components/Notice'

export const ServiceConnectButton: React.FC = () => {
  const { device, service, connection, instance, user } = useContext(DeviceContext)
  const [connectThisDevice, setConnectThisDevice] = useState<boolean>(false)
  const [showError, setShowError] = useState<boolean>(true)
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()

  if (connection.connectLink) return null

  const thisDevice = device?.thisDevice && instance?.owner.id === user.id
  const displayThisDevice = thisDevice && !connectThisDevice

  return (
    <>
      {displayThisDevice ? (
        <Notice gutterTop solid onClose={() => setConnectThisDevice(true)}>
          <Typography variant="h3">You are on the same device as this service.</Typography>
          <Typography variant="body2" gutterBottom>
            So you can connect directly without using Remote.It.
          </Typography>
          <DataCopy
            label="Local endpoint"
            value={`${service?.host || '127.0.0.1'}:${service?.port}`}
            showBackground
            alwaysWhite
            fullWidth
          />
        </Notice>
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
