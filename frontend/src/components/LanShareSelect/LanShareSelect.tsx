import React from 'react'
import { makeStyles } from '@material-ui/styles'
import { useLocation } from 'react-router-dom'
import { ListItemIcon, Typography } from '@material-ui/core'
import { lanShareRestriction, lanShared } from '../../helpers/lanSharing'
import { ListItemLocation } from '../ListItemLocation'
import { Icon } from '../Icon'

type Props = {
  service: IService
  connection?: IConnection
}

export const LanShareSelect: React.FC<Props> = ({ connection, service }) => {
  const css = useStyles()
  const location = useLocation()
  const shared = lanShared(connection)
  const disabled: boolean = connection?.active || service.state !== 'active'
  const color = shared ? 'primary' : undefined
  return (
    <ListItemLocation disabled={disabled} pathname={location.pathname + '/lan'}>
      <ListItemIcon>
        <Icon name="network-wired" color={color} size="md" weight="light" />
      </ListItemIcon>
      <span className={css.text}>
        <Typography variant="caption">Local Network Sharing</Typography>
        <Typography variant="h2" color={color}>
          {shared && 'On -'} {lanShareRestriction(connection)}
        </Typography>
      </span>
    </ListItemLocation>
  )
}

const useStyles = makeStyles({
  text: { flexGrow: 1 },
})
