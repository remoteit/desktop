import React from 'react'
import { Icon } from '../Icon'
import { Title } from '../Title'
import { Tooltip } from '@material-ui/core'
import { useLocation } from 'react-router-dom'
import { TargetPlatform, TARGET_PLATFORMS } from '../TargetPlatform'
import { REGEX_FIRST_PATH } from '../../shared/constants'
import { attributeName } from '../../shared/nameHelper'

type Props = {
  connection?: IConnection
  service?: IService
  device?: IDevice
  shared?: boolean
  inline?: boolean
  children?: any
}

export const ServiceName: React.FC<Props> = ({ connection, service, device, children }) => {
  const location = useLocation()
  const menu = location.pathname.match(REGEX_FIRST_PATH)
  const instance = service || device
  const accessDisabled = !!device?.attributes.accessDisabled
  const offline = instance?.state !== 'active' && !connection?.active
  const targetPlatformId = device?.targetPlatform

  let name = service ? attributeName(service) : attributeName(device)
  let failover = service && connection?.isP2P === false

  if (menu && menu[0] === '/connections') name = connection?.name || name

  return (
    <Title offline={offline}>
      {!instance && !connection ? 'No device found' : name}
      {!!targetPlatformId && (
        <sup>
          <TargetPlatform id={targetPlatformId} tooltip />
        </sup>
      )}
      {device?.shared && (
        <sup>
          <Tooltip title={`Shared by ${device?.owner}`} placement="top" arrow>
            <Icon name="user-friends" size="xxxs" type="solid" fixedWidth />
          </Tooltip>
        </sup>
      )}
      {failover && (
        <sup>
          <Tooltip title="Proxy failover connection" placement="top" arrow>
            <Icon name="cloud" size="xxxs" type="solid" fixedWidth />
          </Tooltip>
        </sup>
      )}
      {accessDisabled && (
        <sup>
          <Tooltip title="Shared access disabled" placement="top" arrow>
            <Icon name="do-not-enter" size="xxxs" type="solid" fixedWidth />
          </Tooltip>
        </sup>
      )}
      {children && <>{` ${children}`}</>}
    </Title>
  )
}
