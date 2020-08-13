import React from 'react'
import { Icon } from '../Icon'
import { Title } from '../Title'
import { useLocation } from 'react-router-dom'
import { REGEX_FIRST_PATH } from '../../shared/constants'
import { Tooltip } from '@material-ui/core'
import { colors } from '../../styling'

type Props = {
  connection?: IConnection
  service?: IService | IDevice
  shared?: boolean
  inline?: boolean
  children?: any
}

export const ServiceName: React.FC<Props> = ({ connection, service, shared, children }) => {
  const location = useLocation()

  const menu = location.pathname.match(REGEX_FIRST_PATH)
  const name = menu && menu[0] === '/connections' ? connection && connection.name : service && service.name

  let color: string | undefined = colors.grayDark
  let failover = connection?.isP2P === false

  if (service?.state === 'active') color = undefined
  if (connection?.active) color = undefined

  return (
    <Title color={color}>
      {!service && !connection ? 'No device found' : name}
      {shared && (
        <sup>
          <Tooltip title="Shared to you">
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
      {children && <>{` ${children}`}</>}
    </Title>
  )
}
