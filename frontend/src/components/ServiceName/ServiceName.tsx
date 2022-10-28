import React from 'react'
import { Icon } from '../Icon'
import { Title } from '../Title'
import { ColorChip } from '../ColorChip'
import { useLocation } from 'react-router-dom'
import { attributeName } from '../../shared/nameHelper'
import { REGEX_FIRST_PATH } from '../../shared/constants'
import { Tooltip } from '@mui/material'

type Props = {
  connection?: IConnection
  service?: IService
  device?: IDevice
  shared?: boolean
  inline?: boolean
}

export const ServiceName: React.FC<Props> = ({ connection, service, device, inline }) => {
  const location = useLocation()
  const menu = location.pathname.match(REGEX_FIRST_PATH)
  const instance = service || device
  const configurable = device?.configurable //&& device?.permissions.includes('MANAGE')
  const unlicensed = instance?.license === 'EVALUATION' || instance?.license === 'UNLICENSED'

  let name = ''

  if (device) name += attributeName(device)
  if (service) {
    if (device) name += ' - '
    name += attributeName(service)
  }
  if (connection?.name && menu && menu[0] === '/networks') name = connection.name

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
      {configurable && (
        <Tooltip title="Remote configurable" placement="top" arrow>
          <sup>
            <Icon name="wifi" size="xxxs" type="solid" fixedWidth />
          </sup>
        </Tooltip>
      )}
      {device?.newDevice && (
        <sup>
          <ColorChip label="NEW" size="small" typeColor="alwaysWhite" backgroundColor="success" />
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
