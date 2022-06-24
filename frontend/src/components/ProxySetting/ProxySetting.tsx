import React, { useState } from 'react'
import { ROUTES } from '../../models/devices'
import { IP_OPEN } from '../../shared/constants'
import { Dispatch } from '../../store'
import { useDispatch } from 'react-redux'
import { makeStyles, ListItem, ListItemIcon, TextField, MenuItem, Typography } from '@material-ui/core'
import { newConnection, setConnection } from '../../helpers/connectionHelper'
import { spacing } from '../../styling'
import { Icon } from '../Icon'

export const ProxySetting: React.FC<{ service: IService; connection: IConnection }> = ({ service, connection }) => {
  const [open, setOpen] = useState<boolean>(false)
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()

  if (!service) return null
  if (!connection) connection = newConnection(service)

  const defaults = newConnection(service)
  const disabled =
    connection.connected || connection.public || (service.attributes.route && service.attributes.route !== 'failover')
  const connectionRoute: IRouteType = connection.public
    ? 'public'
    : connection.proxyOnly
    ? 'proxy'
    : connection.failover
    ? 'failover'
    : 'p2p'
  const defaultRoute = defaults.proxyOnly ? 'proxy' : defaults.failover ? 'failover' : 'p2p'
  const route = ROUTES.find(r => r.key === connectionRoute)

  return (
    <ListItem dense onClick={() => setOpen(!open)} button>
      <ListItemIcon>
        <Icon name={route?.icon} size="md" modified={connectionRoute !== defaultRoute} fixedWidth />
      </ListItemIcon>
      <TextField
        select
        fullWidth
        disabled={disabled}
        label="Routing"
        value={connectionRoute}
        SelectProps={{
          open,
          renderValue: value => ROUTES.find(r => r.key === value)?.name,
          MenuProps: { classes: { paper: css.menu } },
        }}
        onChange={e => {
          const route = e.target.value as IRouteType
          setOpen(!open)
          const updated = {
            ...connection,
            failover: route !== 'p2p',
            proxyOnly: route === 'proxy',
            public: route === 'public',
            enabled: route === 'public' ? false : connection.enabled,
            publicRestriction: IP_OPEN,
          }
          if (updated.public && connection.enabled) {
            dispatch.connections.disconnect(connection)
          }
          setConnection(updated)
        }}
      >
        {ROUTES.map(r => (
          <MenuItem key={r.key} value={r.key}>
            {r.name}
            <Typography variant="caption" component="div">
              {r.description}
            </Typography>
          </MenuItem>
        ))}
      </TextField>
    </ListItem>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  menu: {
    '& .MuiMenuItem-root': { display: 'block', paddingTop: spacing.sm, paddingBottom: spacing.sm },
    '& .MuiListSubheader-root': { background: 'none' },
    '& .MuiTypography-caption': { lineHeight: '1em' },
  },
}))
