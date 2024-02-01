import React, { useState, useContext } from 'react'
import { ConnectionErrorMessage } from '../components/ConnectionErrorMessage'
import { Typography, Collapse } from '@mui/material'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { DeviceContext } from '../services/Context'
import { ComboButton } from './ComboButton'
import { GuideBubble } from '../components/GuideBubble'
import { ErrorButton } from '../buttons/ErrorButton'
import { makeStyles } from '@mui/styles'
import { DesktopUI } from '../components/DesktopUI'
import { Gutters } from '../components/Gutters'
import { spacing } from '../styling'

export const ServiceConnectButton: React.FC = () => {
  const { device, service, connection, instance } = useContext(DeviceContext)
  const [showError, setShowError] = useState<boolean>(true)
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()

  return (
    <Collapse in={!connection.connectLink} timeout={800}>
      <Gutters top={null} bottom="lg" size="md">
        <GuideBubble
          guide="connectButton"
          enterDelay={400}
          hide={connection.connectLink}
          startDate={new Date('2022-09-20')}
          queueAfter={device ? 'availableServices' : 'addNetwork'}
          instructions={
            <>
              <Typography variant="h3" gutterBottom>
                <b>
                  <DesktopUI hide>Starting a connection</DesktopUI>
                  <DesktopUI>Connect on demand</DesktopUI>
                </b>
              </Typography>
              <DesktopUI hide>
                <Typography variant="body2" gutterBottom>
                  Create a connection to this service with the connect button.
                </Typography>
              </DesktopUI>
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
              iconType="solid"
              service={service}
              connection={connection}
              permissions={instance?.permissions}
              onClick={() => dispatch.ui.guide({ guide: 'aws', step: 6 })}
              fullWidth
            />
          </Gutters>
        </GuideBubble>
        <ConnectionErrorMessage connection={connection} visible={showError} />
      </Gutters>
    </Collapse>
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
