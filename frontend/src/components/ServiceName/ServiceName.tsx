import React from 'react'
import { Icon } from '../Icon'
import { Title } from '../Title'
import { Tooltip } from '@material-ui/core'
import { useLocation } from 'react-router-dom'
import { TargetPlatform } from '../TargetPlatform'
import { REGEX_FIRST_PATH } from '../../shared/constants'
import { colors } from '../../styling'

type Props = {
  connection?: IConnection
  service?: IService | IDevice
  shared?: boolean
  inline?: boolean
}

export const ServiceName: React.FC<Props> = ({ connection, service, shared }) => {
  const location = useLocation()

  const menu = location.pathname.match(REGEX_FIRST_PATH)
  const name = menu && menu[0] === '/connections' ? connection && connection.name : service && service.name

  let color: string | undefined = colors.grayDark

  if (service && service.state === 'active') color = undefined
  if (connection && connection.active) color = undefined

  return (
    <Title color={color}>
      {!service && !connection ? 'No device found' : name}
      <TargetPlatform id={service?.targetPlatform} />
      {shared && (
        <sup>
          <Tooltip title={`Shared by ${service?.owner}`}>
            <Icon name="user-friends" size="xxxs" type="solid" fixedWidth />
          </Tooltip>
        </sup>
      )}
    </Title>
  )
}
