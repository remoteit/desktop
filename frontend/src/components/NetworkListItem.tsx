import React from 'react'
import { makeStyles } from '@mui/styles'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { selectConnection } from '../selectors/connections'
import { ListItemText, ListItemIcon } from '@mui/material'
import { ListItemLocation } from './ListItemLocation'
import { ApplicationState } from '../store'
import { TargetPlatform } from './TargetPlatform'
import { ConnectionName } from './ConnectionName'
import { useSelector } from 'react-redux'
import { selectById } from '../selectors/devices'
import { spacing } from '../styling'
import { Icon } from './Icon'

export interface Props {
  serviceId: string
  session?: ISession
  network?: INetwork
  connections?: boolean
  fallbackName?: string
  external?: boolean
  children?: React.ReactNode
}

export const NetworkListItem: React.FC<Props> = ({
  network,
  serviceId,
  session,
  fallbackName,
  external,
  connections,
  children,
}) => {
  const { service, device, foundSession, connection } = useSelector((state: ApplicationState) => {
    const [service, device] = selectById(state, undefined, serviceId)
    return {
      service,
      device,
      foundSession: state.sessions.all.find(s => s.target.id === serviceId),
      connection: selectConnection(state, service),
    }
  })
  session = session || foundSession
  const dispatch = useDispatch<Dispatch>()
  const connected = external || session?.state === 'connected' || connection.connected
  const offline = service?.state !== 'active' && !external
  const platform = device?.targetPlatform || session?.target.platform
  const enabled = external || connection.enabled
  const css = useStyles({ offline, networkEnabled: network?.enabled, enabled, connected })
  const name = connection.name || session?.target.name || fallbackName || serviceId
  const color = network?.enabled ? 'primary' : undefined

  let pathname = `/networks/${network?.id}/${serviceId}`
  if (connections) pathname = `/connections/${serviceId}`
  const matchname = pathname
  pathname += `/${session?.id || 'none'}`
  if (external) pathname += '/other'
  else pathname += '/connect'

  let icon: React.ReactNode | null = null
  if (connected) icon = <Icon color={color} name="play" size="sm" type="solid" />
  if (connection.connectLink) icon = <Icon color={color} name="circle-medium" type="solid" size="sm" />

  return (
    <ListItemLocation
      dense
      className={css.item}
      pathname={pathname}
      match={matchname}
      onClick={() =>
        dispatch.ui.setDefaultSelected({
          key: connections ? '/connections' : '/networks',
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
      <ListItemText
        className={css.text}
        primary={<ConnectionName name={name} port={connection.port} />}
        secondary={pathname}
      />
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
