import React from 'react'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { Box, ListItemText, ListItemIcon, SxProps, Theme } from '@mui/material'
import { ListItemLocation } from './ListItemLocation'
import { TargetPlatform } from './TargetPlatform'
import { ConnectionName } from './ConnectionName'
import { spacing } from '../styling'
import { Icon } from './Icon'

export interface Props {
  name: string
  connection?: IConnection
  connectionsPage?: boolean
  to: string
  match?: string
  connected: boolean
  offline: boolean
  platform?: number
  enabled?: boolean
  manufacturer?: ISession['manufacturer']
  children?: React.ReactNode
}

export const ConnectionListItem: React.FC<Props> = ({
  name,
  connection,
  connectionsPage,
  to,
  match,
  connected,
  offline,
  platform,
  enabled,
  manufacturer,
  children,
}) => {
  const dispatch = useDispatch<Dispatch>()
  const error = !!connection?.error
  const color = offline ? 'gray' : error ? 'error' : connected ? 'primary' : 'grayDarkest'
  const borderColor = error ? 'error' : connected ? 'primary' : 'grayDark'

  let icon: React.ReactNode | null = null
  if (connected) icon = <Icon color={color} name={error ? 'exclamation-triangle' : 'play'} size="sm" type="solid" />
  if (connection?.connectLink || manufacturer === 'ANONYMOUS' || manufacturer === 'KEY')
    icon = <Icon color={color} name={manufacturer === 'KEY' ? 'key' : 'globe'} type="solid" size="xxs" />

  return (
    <ListItemLocation
      dense
      sx={itemSx}
      to={to}
      match={match}
      onClick={() =>
        dispatch.ui.setDefaultSelected({
          key: connectionsPage ? '/connections' : '/networks',
          value: to,
        })
      }
    >
      <ListItemIcon
        sx={{ position: 'relative', '& > svg': { position: 'absolute', right: 2, transform: 'translate(0px, -55%)' } }}
      >
        <Box
          sx={theme => ({
            borderColor: enabled ? theme.palette.primary.main : theme.palette[borderColor]?.main,
            borderBottomColor: theme.palette[borderColor]?.main,
            borderWidth: '0 0 1px 1px',
            borderBottomWidth: 1,
            borderBottomStyle: connected ? 'solid' : 'dotted',
            borderStyle: 'solid',
            height: '2.7em',
            width: '1.4em',
            marginTop: '-2.7em',
            marginRight: '-1.4em',
            pointerEvents: 'none',
          })}
        />
        {icon}
      </ListItemIcon>
      <ListItemIcon sx={{ minWidth: 48, '& > span': { flexGrow: 1, textAlign: 'center' } }}>
        <TargetPlatform id={platform} size="md" tooltip />
      </ListItemIcon>
      <ListItemText primary={<ConnectionName name={name} port={connection?.port} color={color} />} />
      {children}
    </ListItemLocation>
  )
}

export const itemSx: SxProps<Theme> = {
  marginTop: 0,
  marginBottom: 0,
  marginRight: `${spacing.xs}px`,
  '& .MuiChip-root': { marginBottom: 0 },
}
