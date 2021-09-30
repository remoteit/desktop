import React from 'react'
import { Icon } from '../Icon'
import { Title } from '../Title'
import { isOffline } from '../../models/devices'
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
  const accessDisabled = !!device?.attributes?.accessDisabled
  const offline = isOffline(instance, connection)
  const proxy = service && connection?.connected && connection?.isP2P === false

  let name = ''

  if (device) name += attributeName(device)
  if (service) {
    if (device) name += ' - '
    name += attributeName(service)
  }
  if (connection?.name && menu && menu[0] === '/connections') name = connection.name

  return (
    <Title enabled={connection?.enabled} offline={offline} inline={inline} license={instance?.license}>
      {name || 'No device found'}
      {/* {!!targetPlatformId && (
        <sup>
          <TargetPlatform id={targetPlatformId} tooltip />
        </sup>
      )} */}
      {device?.configurable && !device?.shared && (
        <Tooltip title="Remote configurable" placement="top" arrow>
          <sup>
            <Icon name="wifi" size="xxs" type="solid" fixedWidth />
          </sup>
        </Tooltip>
      )}
      {device?.shared && (
        <Tooltip title={`Shared by ${device?.owner.email}`} placement="top" arrow>
          <sup>
            <Icon name="user-friends" size="xxxs" type="solid" fixedWidth />
          </sup>
        </Tooltip>
      )}
      {proxy && (
        <Tooltip title="Proxy connection" placement="top" arrow>
          <sup>
            <Icon name="cloud" size="xxxs" type="solid" fixedWidth />
          </sup>
        </Tooltip>
      )}
      {accessDisabled && (
        <Tooltip title="Shared access disabled" placement="top" arrow>
          <sup>
            <Icon name="do-not-enter" size="xxxs" type="solid" fixedWidth />
          </sup>
        </Tooltip>
      )}
      {children && <>{` ${children}`}</>}
    </Title>
  )
}
