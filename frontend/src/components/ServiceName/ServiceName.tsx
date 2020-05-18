import React from 'react'
import { useLocation } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { REGEX_FIRST_PATH } from '../../constants'
import { Icon } from '../Icon'
import { colors, spacing } from '../../styling'

type Props = {
  connection?: IConnection
  service?: IService | IDevice
  shared?: boolean
  inline?: boolean
}

export const ServiceName: React.FC<Props> = ({ connection, service, shared, inline }) => {
  const location = useLocation()
  const css = useStyles()

  const menu = location.pathname.match(REGEX_FIRST_PATH)
  const name = menu && menu[0] === '/connections' ? connection && connection.name : service && service.name

  let color: string | undefined = colors.grayDark
  let marginLeft = inline ? spacing.md : 0

  if (service && service.state === 'active') color = undefined
  if (connection && connection.active) color = undefined

  return (
    <span className={css.title} style={{ color, marginLeft }}>
      {!service && !connection ? 'No device found' : name}
      {shared && (
        <sup>
          <Icon name="user-friends" size="xxxs" weight="solid" fixedWidth />
        </sup>
      )}
    </span>
  )
}

const useStyles = makeStyles({
  title: {
    flexGrow: 1,
    '& sup': { marginLeft: spacing.xs },
  },
})
