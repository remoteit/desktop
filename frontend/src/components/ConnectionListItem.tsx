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
  pathname: string
  match?: string
  connected: boolean
  offline: boolean
  platform?: number
  enabled?: boolean
  networkEnabled?: boolean
  children?: React.ReactNode
}

export const ConnectionListItem: React.FC<Props> = ({
  name,
  connection,
  connectionsPage,
  pathname,
  match,
  connected,
  offline,
  platform,
  enabled,
  networkEnabled,
  children,
}) => {
  const dispatch = useDispatch<Dispatch>()
  const css = useStyles({ offline, enabled, connected, networkEnabled })

  let icon: React.ReactNode | null = null
  if (connected) icon = <Icon color="primary" name="play" size="sm" type="solid" />
  if (connection?.connectLink) icon = <Icon color="primary" name="circle-medium" type="solid" size="sm" />

  return (
    <ListItemLocation
      dense
      className={css.item}
      pathname={pathname}
      match={match}
      onClick={() =>
        dispatch.ui.setDefaultSelected({
          key: connectionsPage ? '/connections' : '/networks',
          value: pathname,
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
      <ListItemText primary={<ConnectionName name={name} port={connection?.port} />} className={css.text} />
      {children}
    </ListItemLocation>
  )
}

export const useStyles = makeStyles(({ palette }) => ({
  text: ({ offline, enabled }: any) => ({
    opacity: offline ? 0.3 : 1,
    fontWeight: 400,
    whiteSpace: 'nowrap',
    '& span': {
      color: enabled ? palette.primary.main : palette.grayDarkest.main,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  }),
  connection: ({ offline, networkEnabled, connected }: any) => {
    let color = palette.grayDark.main
    if (networkEnabled || connected) color = palette.primary.main
    return {
      borderColor: color,
      borderBottomColor: offline ? palette.gray.main : color,
      borderWidth: '0 0 1px 1px',
      borderBottomWidth: 1,
      borderBottomStyle: connected ? 'solid' : 'dotted',
      borderStyle: 'solid',
      height: '2.7em',
      width: '1.5em',
      marginTop: '-2.7em',
      marginRight: '-1.5em',
    }
  },
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
  },
  connectIcon: {
    position: 'relative',
    '& > svg': { position: 'absolute', right: 6, transform: 'translate(0px, -55%)' },
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
