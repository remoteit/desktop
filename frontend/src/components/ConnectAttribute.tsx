import React, { useContext } from 'react'
import { DeviceListContext } from '../services/Context'
import { useApplication } from '../hooks/useApplication'
import { CopyIconButton } from '../buttons/CopyIconButton'
import { ComboButton } from '../buttons/ComboButton'
import { LaunchButton } from '../buttons/LaunchButton'
import { makeStyles } from '@mui/styles'
import { Stack } from '@mui/material'

export const ConnectAttribute = ({ device, service, connection }: IDataOptions) => {
  const { setEvents } = useContext(DeviceListContext)
  const app = useApplication(service, connection)
  const css = useStyles()
  const buttons =
    connection &&
    (connection.enabled ||
      connection.connecting ||
      connection.starting ||
      connection.stopping ||
      connection.disconnecting ||
      connection.connectLink)

  return (
    <Stack
      flexDirection="row"
      position="relative"
      zIndex={3}
      onMouseEnter={() => setEvents?.(false)}
      onMouseLeave={() => setEvents?.(true)}
    >
      <ComboButton
        size="chip"
        service={service}
        className={css.connect}
        connection={connection}
        permissions={device?.permissions}
        fullWidth
      >
        {buttons && (
          <>
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
              device={device}
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
    </Stack>
  )
}

const useStyles = makeStyles({
  connect: { minWidth: 120 },
})
