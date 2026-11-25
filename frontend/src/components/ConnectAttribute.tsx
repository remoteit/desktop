import React from 'react'
import { useApplication } from '../hooks/useApplication'
import { CopyIconButton } from '../buttons/CopyIconButton'
import { ComboButton } from '../buttons/ComboButton'
import { LaunchButton } from '../buttons/LaunchButton'
import { Box } from '@mui/material'
import { copyReady } from '../helpers/connectionHelper'
import { useKnownWebAddress, useWebAddress, useWebTarget } from '../hooks/useWebAddress'

export const ConnectAttribute = ({ device, service, connection }: IDataOptions) => {
  const app = useApplication(service, connection)
  const canCopy = copyReady(connection)
  // Opened at its web address (services/webAddress): that is copied, where there is one, as a connection's is.
  const target = useWebTarget(service, connection)
  const address = useKnownWebAddress(target, useWebAddress(target) === true)
  const buttons =
    connection &&
    connection.online &&
    (connection.enabled ||
      connection.connecting ||
      connection.starting ||
      connection.stopping ||
      connection.disconnecting ||
      connection.connectLink)

  return (
    <Box zIndex={3} position="relative" onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
      <ComboButton size="chip" service={service} connection={connection} permissions={device?.permissions}>
        {!buttons && address && (
          <>
            &nbsp;
            <CopyIconButton
              value={address}
              color="primary"
              icon="clone"
              type="regular"
              size="sm"
              buttonBaseSize="small"
              fixedWidth
            />
          </>
        )}
        {buttons && (
          <>
            &nbsp;
            {canCopy && (
              <CopyIconButton
                app={app}
                color="primary"
                icon="clone"
                type="regular"
                size="sm"
                buttonBaseSize="small"
                fixedWidth
              />
            )}
            <LaunchButton
              app={app}
              connection={connection}
              size="sm"
              type="regular"
              color="primary"
              iconButtonProps={{
                buttonBaseSize: 'small',
                fixedWidth: true,
              }}
            />
          </>
        )}
      </ComboButton>
    </Box>
  )
}
