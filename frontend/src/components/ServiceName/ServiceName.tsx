import React from 'react'
import { Icon } from '../Icon'
import { Title } from '../Title'
import { useLocation } from 'react-router-dom'
import { REGEX_FIRST_PATH } from '../../shared/constants'
import { attributeName } from '../../shared/nameHelper'
import { Tooltip } from '@material-ui/core'
import { colors } from '../../styling'

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

  let name = service ? attributeName(service) : attributeName(device)
  let color: string | undefined = colors.grayDark
  let failover = connection?.isP2P === false

  if (menu && menu[0] === '/connections') name = connection?.name || name
  if (instance?.state === 'active') color = undefined
  if (connection?.active) color = undefined

  return (
    <Title color={color}>
      {!instance && !connection ? 'No device found' : name}
      {device?.shared && (
        <sup>
          <Tooltip title={`Shared by ${device?.owner}`}>
            <Icon name="user-friends" size="xxxs" type="solid" fixedWidth />
          </Tooltip>
        </sup>
      )}
      {failover && (
        <sup>
          <Tooltip title="Proxy failover connection">
            <Icon name="cloud" size="xxxs" type="solid" fixedWidth />
          </Tooltip>
        </sup>
      )}
      {accessDisabled && (
        <sup>
          <Tooltip title="Shared access disabled">
            <Icon name="do-not-enter" size="xxxs" type="solid" fixedWidth />
          </Tooltip>
        </sup>
      )}
      {children && <>{` ${children}`}</>}
    </Title>
  )
}
