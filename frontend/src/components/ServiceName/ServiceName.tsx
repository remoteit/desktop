import React from 'react'
import { useLocation } from 'react-router-dom'
import { makeStyles } from '@material-ui/styles'
import { REGEX_FIRST_PATH } from '../../constants'

import { colors, spacing } from '../../styling'
import { IService, IDevice } from 'remote.it'

type Props = {
  connection?: IConnection
  service?: IService | IDevice
  inline?: boolean
}

export const ServiceName: React.FC<Props> = ({ connection, service, inline }) => {
  const location = useLocation()
  const css = useStyles()

  const menu = location.pathname.match(REGEX_FIRST_PATH)
  const name = menu && menu[0] === '/connections' ? connection && connection.name : service && service.name

  let color = undefined
  let marginLeft = inline ? spacing.md : 0

  if (!service && !connection) return <span className={css.title}>No device found.</span>
  if (service && service.state === 'active') color = colors.success
  if (connection && connection.active) color = colors.primary

  return (
    <span className={css.title} style={{ color, marginLeft }}>
      {name}
    </span>
  )
}

const useStyles = makeStyles({ title: { flexGrow: 1 } })
