import React from 'react'
import { makeStyles } from '@mui/styles'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { ListItemText, ListItemIcon } from '@mui/material'
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
  const css = useStyles({ connected, color: borderColor, enabled })

  let icon: React.ReactNode | null = null
  if (connected) icon = <Icon color={color} name={error ? 'exclamation-triangle' : 'play'} size="sm" type="solid" />
  if (connection?.connectLink || manufacturer === 'ANONYMOUS' || manufacturer === 'KEY')
    icon = <Icon color={color} name={manufacturer === 'KEY' ? 'key' : 'globe'} type="solid" size="xxs" />

  return (
    <ListItemLocation
      dense
      className={css.item}
      to={to}
      match={match}
      onClick={() =>
        dispatch.ui.setDefaultSelected({
          key: connectionsPage ? '/connections' : '/networks',
          value: to,
        })
      }
    >
      <ListItemIcon className={css.connectIcon}>
        <div className={css.connection} />
        {icon}
      </ListItemIcon>
      <ListItemIcon className={css.platform}>
        <TargetPlatform id={platform} size="md" tooltip />
      </ListItemIcon>
      <ListItemText primary={<ConnectionName name={name} port={connection?.port} color={color} />} />
      {children}
    </ListItemLocation>
  )
}

export const useStyles = makeStyles(({ palette }) => ({
  connection: ({ connected, color, enabled }: any) => ({
    borderColor: enabled ? palette.primary.main : palette[color]?.main,
    borderBottomColor: palette[color]?.main,
    borderWidth: '0 0 1px 1px',
    borderBottomWidth: 1,
    borderBottomStyle: connected ? 'solid' : 'dotted',
    borderStyle: 'solid',
    height: '2.7em',
    width: '1.4em',
    marginTop: '-2.7em',
    marginRight: '-1.4em',
    pointerEvents: 'none',
  }),
  hover: {
    position: 'absolute',
    marginTop: -1,
  },
  name: {
    opacity: 0.8,
  },
  item: {
    marginTop: 0,
    marginBottom: 0,
    marginRight: spacing.xs,
    '& .MuiChip-root': { marginBottom: 0 },
  },
  connectIcon: {
    position: 'relative',
    '& > svg': { position: 'absolute', right: 2, transform: 'translate(0px, -55%)' },
  },
  platform: {
    minWidth: 48,
    '& > span': { flexGrow: 1, textAlign: 'center' },
  },
  mergeIcon: {
    zIndex: 2,
    backgroundImage: `radial-gradient(${palette.white.main}, transparent)`,
  },
  icon: { marginTop: spacing.xxs, marginRight: spacing.md, marginLeft: spacing.sm },
}))
