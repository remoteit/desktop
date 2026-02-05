import React from 'react'
import { Dispatch } from '../store'
import { MAX_NAME_LENGTH } from '@common/constants'
import { ListItemLocation, ListItemLocationProps } from './ListItemLocation'
import { Typography, ListItemSecondaryAction, Box } from '@mui/material'
import { InlineTextFieldSetting } from './InlineTextFieldSetting'
import { ConnectionStateIcon } from './ConnectionStateIcon'
import { useDispatch } from 'react-redux'
import { DeviceName } from './DeviceName'
import { IconButton } from '../buttons/IconButton'
import { fontSizes } from '../styling'

type Props = {
  device: IDevice
  connection?: IConnection
  editable: boolean
}

type DisplayComponentProps = Props & ListItemLocationProps & { onClick?: () => void }

export const DeviceNameLocation: React.FC<Props> = props => {
  const dispatch = useDispatch<Dispatch>()
  const icon = <ConnectionStateIcon device={props.device} connection={props.connection} size="xl" />
  return (
    <Box marginBottom={0.75}>
      <InlineTextFieldSetting
        icon={icon}
        value={props.device.name}
        maxLength={MAX_NAME_LENGTH}
        disabled={!props.device.permissions.includes('MANAGE')}
        DisplayComponent={<DisplayComponent {...props} icon={icon} />}
        onSave={name => {
          dispatch.accounts.setDevice({ id: props.device.id, device: { ...props.device, name: name.toString() } })
          dispatch.devices.rename({ id: props.device.id, name: name.toString() })
        }}
        fieldProps={{
          sx: { '& input.MuiInput-input': { fontSize: fontSizes.md } },
        }}
      />
    </Box>
  )
}

const DisplayComponent: React.FC<DisplayComponentProps> = ({
  device,
  connection,
  editable,
  onClick,
  disabled,
  ...props
}) => {
  const dispatch = useDispatch<Dispatch>()
  return (
    <ListItemLocation
      sx={{
        paddingTop: 1.5,
        paddingBottom: 1.5,
      }}
      to={`/devices/${device.id}/details`}
      match={[
        `/devices/${device.id}/details`,
        `/devices/${device.id}/edit`,
        `/devices/${device.id}/users`,
        `/devices/${device.id}/logs`,
      ]}
      title={
        <Typography variant="h3">
          <DeviceName device={device} connection={connection} />
        </Typography>
      }
      subtitle={device.thisDevice ? 'This device' : undefined}
      onClick={() => dispatch.ui.setDefaultService({ deviceId: device.id, serviceId: null })}
      exactMatch
      {...props}
    >
      {editable && (
        <ListItemSecondaryAction sx={{ marginTop: -0.1, marginRight: -1 }} className="hidden">
          <IconButton
            title="Rename"
            buttonBaseSize="small"
            onClick={event => {
              event.stopPropagation()
              event.preventDefault()
              onClick?.()
            }}
            onMouseDown={event => event.stopPropagation()}
            icon="pencil"
            color="grayDark"
            size="sm"
            sx={{ zIndex: 6 }}
          />
        </ListItemSecondaryAction>
      )}
    </ListItemLocation>
  )
}
