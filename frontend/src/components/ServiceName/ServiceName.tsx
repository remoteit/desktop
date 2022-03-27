import React from 'react'
import { Icon } from '../Icon'
import { Title } from '../Title'
import { useLocation } from 'react-router-dom'
import { attributeName } from '../../shared/nameHelper'
import { REGEX_FIRST_PATH } from '../../shared/constants'
import { Tooltip } from '@material-ui/core'

type Props = {
  connection?: IConnection
  service?: IService
  device?: IDevice
  shared?: boolean
  inline?: boolean
  children?: any
}

export const ServiceName: React.FC<Props> = ({ connection, service, device, inline, children }) => {
  const location = useLocation()
  const menu = location.pathname.match(REGEX_FIRST_PATH)
  const instance = service || device
  const configurable = device?.configurable && device?.permissions.includes('MANAGE')
  const unlicensed = instance?.license === 'EVALUATION' || instance?.license === 'UNLICENSED'

  let name = ''

  if (device) name += attributeName(device)
  if (service) {
    if (device) name += ' - '
    name += attributeName(service)
  }
  if (connection?.name && menu && menu[0] === '/connections') name = connection.name

  return (
    <Title enabled={connection?.enabled} inline={inline}>
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
            <Icon name="wifi" size="xxs" type="solid" fixedWidth />
          </sup>
        </Tooltip>
      )}
      {/* {device?.shared && !configurable && (
        <Tooltip title={`Shared by ${device?.owner.email}`} placement="top" arrow>
          <sup>
            <Icon name="user-friends" size="xxxs" type="solid" fixedWidth />
          </sup>
        </Tooltip>
      )} */}
      {children && <>{` ${children}`}</>}
    </Title>
  )
}
