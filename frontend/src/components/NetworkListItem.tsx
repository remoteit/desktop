import React from 'react'
import reactStringReplace from 'react-string-replace'
import { makeStyles } from '@mui/styles'
import { useLocation } from 'react-router-dom'
import { selectConnection } from '../helpers/connectionHelper'
import { ListItemText, ListItemIcon } from '@mui/material'
import { ListItemLocation } from './ListItemLocation'
import { ApplicationState } from '../store'
import { TargetPlatform } from './TargetPlatform'
import { ConnectionName } from './ConnectionName'
import { useSelector } from 'react-redux'
import { selectById } from '../models/devices'
import { spacing } from '../styling'
import { Icon } from './Icon'

export interface Props {
  serviceId: string
  session?: ISession
  network?: INetwork
  children?: React.ReactNode
  external?: boolean
}

export const NetworkListItem: React.FC<Props> = ({ network, serviceId, session, external, children }) => {
  const { service, device, foundSession, connection } = useSelector((state: ApplicationState) => {
    const [service, device] = selectById(state, serviceId)
    return {
      service,
      device,
      foundSession: state.sessions.all.find(s => s.target.id === serviceId),
      connection: selectConnection(state, service),
    }
  })
  session = session || foundSession
  const location = useLocation()
  const tab = location.pathname.split('/')[1]
  const connected = external || session?.state === 'connected' || connection.connected
  const offline = service?.state !== 'active' && !external
  const platform = device?.targetPlatform || session?.target.platform
  const enabled = external || connection.enabled
  const css = useStyles({ offline, networkEnabled: network?.enabled, enabled, connected })
  const name = connection.name || session?.target.name || serviceId

  let pathname = `/${tab}/${serviceId}`
  if (session) pathname += `/${session.id}`
  if (external) pathname += '/other'

  let icon: React.ReactNode | null = null
  if (connected) icon = <Icon color="primary" name="chevron-right" size="md" type="light" />

  return (
    <ListItemLocation className={css.item} pathname={pathname} exactMatch dense>
      <ListItemIcon className={css.connectIcon}>
        <div className={css.connection} />
        {icon}
      </ListItemIcon>
      <ListItemIcon className={css.platform}>
        <TargetPlatform id={platform} size="md" tooltip />
      </ListItemIcon>
      <ListItemText className={css.text} primary={<ConnectionName name={name} port={connection.port} />} />
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
      borderBottomStyle: connected ? 'solid' : 'dashed',
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
    '& > svg': { position: 'absolute', right: 6, bottom: -7.5 },
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
