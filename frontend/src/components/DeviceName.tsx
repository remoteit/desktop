import React from 'react'
import { Icon } from './Icon'
import { Title } from './Title'
import { ColorChip } from './ColorChip'
import { useLocation } from 'react-router-dom'
import { attributeName } from '@common/nameHelper'
import { REGEX_FIRST_PATH } from '../constants'
import { Tooltip } from '@mui/material'

type Props = {
  connection?: IConnection
  service?: IService
  device?: IDevice
  shared?: boolean
  inline?: boolean
}

export const DeviceName: React.FC<Props> = ({ connection, service, device, inline }) => {
  const location = useLocation()
  const menu = location.pathname.match(REGEX_FIRST_PATH)
  const instance = service || device
  const unConfigurable = device && !(device.configurable && device.permissions.includes('MANAGE'))
  const unlicensed = instance?.license === 'EVALUATION' || instance?.license === 'UNLICENSED'

  let name = ''

  if (device) name += attributeName(device)
  if (service) {
    if (device) name += ' - '
    name += attributeName(service)
  }
  if (connection?.name && menu?.[0] === '/networks') name = connection.name

  return (
    <Title inline={inline} offline={service?.state === 'inactive'}>
      {name || 'No device found'}
      {unlicensed && (
        <Tooltip title="Unlicensed" placement="top" arrow>
          <sup>
            <Icon name="exclamation-triangle" size="xxxs" type="solid" color="warning" fixedWidth />
          </sup>
        </Tooltip>
      )}
      {unConfigurable && (
        <Tooltip title="Not remote configurable" placement="top" arrow>
          <sup>
            <Icon name="cloud-slash" size="xxs" type="regular" fixedWidth />
          </sup>
        </Tooltip>
      )}
      {device?.newDevice && (
        <sup>
          <ColorChip label="NEW" size="small" color="success" variant="contained" />
        </sup>
      )}
      {/* {device?.shared && (
        <Tooltip title={`Shared by ${device?.owner.email}`} placement="top" arrow>
          <sup>
            <Icon name="user-group" size="xxxs" type="solid" fixedWidth />
          </sup>
        </Tooltip>
      )} */}
    </Title>
  )
}
