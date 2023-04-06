import React, { useState } from 'react'
import { IP_OPEN } from '../shared/constants'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { makeStyles } from '@mui/styles'
import { ListItem, ListItemIcon, TextField, MenuItem, Typography, Chip, Box } from '@mui/material'
import { newConnection, setConnection, getRoute, routeTypeToSettings } from '../helpers/connectionHelper'
import { spacing } from '../styling'
import { Icon } from './Icon'

export const ROUTES: IRoute[] = [
  {
    key: 'failover',
    icon: 'code-branch',
    name: 'Peer to peer with proxy failover',
    description: 'A direct connection to this service that fails over to a private proxy.',
  },
  {
    key: 'p2p',
    icon: 'arrows-h',
    name: 'Peer to peer only',
    description: 'A direct connection to this service.',
  },
  {
    key: 'proxy',
    icon: 'cloud',
    name: 'Proxy only',
    description: 'A private proxy connection routed through the cloud.',
  },
  {
    key: 'public',
    icon: 'globe',
    name: 'Public Proxy',
    description: 'A proxy connection with a temporary public URL.',
  },
]

export const RouteSetting: React.FC<{ service: IService; connection: IConnection }> = ({ service, connection }) => {
  const [open, setOpen] = useState<boolean>(false)
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles()

  if (!service) return null

  const defaults = newConnection(service)
  const disabled =
    connection.connected || ['p2p', 'proxy'].includes(service.attributes.route || '') || connection.connectLink
  const connectionRoute = getRoute(connection)
  const defaultRoute = getRoute(defaults)
  const route = ROUTES.find(r => r.key === connectionRoute)

  return (
    <ListItem dense onClick={() => setOpen(!open)} disabled={disabled} button>
      <ListItemIcon>
        <Icon name={route?.icon} size="md" modified={connectionRoute !== defaultRoute} fixedWidth />
      </ListItemIcon>
      <TextField
        select
        fullWidth
        variant="standard"
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
            ...routeTypeToSettings(route),
            publicRestriction: route === 'public' ? IP_OPEN : undefined,
            enabled: route === 'public' ? false : !!connection.enabled,
            port: connectionRoute === 'public' ? undefined : connection.port,
          }

          if (updated.public && connection.enabled) {
            dispatch.connections.disconnect(connection)
          }
          setConnection(updated)
        }}
      >
        {ROUTES.map(r => (
          <MenuItem key={r.key} value={r.key}>
            <Box display="flex" justifyContent="space-between">
              {r.name} {r.key === defaultRoute && <Chip size="small" label="default" />}
            </Box>
            <Typography variant="caption" component="div">
              {r.description}
            </Typography>
          </MenuItem>
        ))}
      </TextField>
    </ListItem>
  )
}

const useStyles = makeStyles({
  menu: {
    '& .MuiMenuItem-root': { display: 'block', paddingTop: spacing.sm, paddingBottom: spacing.sm },
    '& .MuiListSubheader-root': { background: 'inherit' },
    '& .MuiTypography-caption': { lineHeight: '1em' },
  },
})
