import React from 'react'
import { useApplication } from '../hooks/useApplication'
import { CopyIconButton } from '../buttons/CopyIconButton'
import { ComboButton } from '../buttons/ComboButton'
import { LaunchButton } from '../buttons/LaunchButton'
import { Box } from '@mui/material'

export const ConnectAttribute = ({ device, service, connection }: IDataOptions) => {
  const app = useApplication(service, connection)
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
        {buttons && (
          <>
            &nbsp;
            <CopyIconButton
              app={app}
              color="primary"
              icon="clone"
              type="regular"
              size="sm"
              buttonBaseSize="small"
              fixedWidth
            />
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
