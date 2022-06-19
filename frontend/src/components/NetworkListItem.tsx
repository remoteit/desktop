import React from 'react'
import { makeStyles, Tooltip, ListItemText, ListItemIcon } from '@material-ui/core'
import { ListItemLocation } from './ListItemLocation'
import { ApplicationState } from '../store'
import { TargetPlatform } from './TargetPlatform'
import { attributeName } from '../shared/nameHelper'
import { useSelector } from 'react-redux'
import { selectById } from '../models/devices'
import { spacing } from '../styling'
import { Title } from './Title'
import { Icon } from './Icon'

export interface Props {
  serviceId?: string
  network?: INetwork
  title?: boolean
}

export const NetworkListItem: React.FC<Props> = ({ network, serviceId, title, children }) => {
  const { service, device, session, connection } = useSelector((state: ApplicationState) => {
    const [service, device] = selectById(state, serviceId)
    return {
      service,
      device,
      session: state.sessions.all.find(s => s.target.id === serviceId),
      connection: state.connections.all.find(c => c.id === serviceId),
    }
  })
  const connected = session?.state === 'connected'
  const offline = service?.state !== 'active'
  const css = useStyles({ state: session?.state, offline, enabled: network?.enabled })

  let icon: React.ReactElement | null = null
  if (connected) icon = <Icon color="primary" name="chevron-right" type="light" size="md" />

  if (title)
    return (
      <ListItemLocation
        icon={<Icon className={css.mergeIcon} name={network?.icon} color={network?.enabled ? 'primary' : undefined} />}
        pathname={`/networks/view/${network?.id}`}
        title={<Title enabled={network?.enabled}>{network?.name}</Title>}
        dense
      >
        {children}
      </ListItemLocation>
    )

  return (
    <ListItemLocation className={css.item} pathname={`/networks/${serviceId}`} exactMatch dense>
      <Tooltip title={offline ? 'Disconnected' : connected ? 'Connected' : 'Idle'} placement="left" arrow>
        <ListItemIcon className={css.connectIcon}>
          <div className={css.connection} />
          {icon}
        </ListItemIcon>
      </Tooltip>
      <ListItemIcon className={css.platform + ' ' + css.title}>
        <TargetPlatform id={device?.targetPlatform} size="md" tooltip />
      </ListItemIcon>
      <ListItemText
        className={css.title}
        primary={
          <Title enabled={connection?.enabled}>
            {service ? (
              <>
                {attributeName(service)} - <span className={css.name}>{attributeName(device)}</span>
              </>
            ) : (
              connection?.name
            )}
          </Title>
        }
      />
      {children}
    </ListItemLocation>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  title: ({ state }: any) => ({
    opacity: state === 'offline' ? 0.5 : 1,
    '& > span': {
      fontWeight: 500,
      overflow: 'hidden',
      whiteSpace: 'nowrap',
    },
  }),
  connection: ({ offline, enabled, state }: any) => {
    let color = palette.grayDark.main
    if (enabled) color = palette.primary.main
    return {
      borderColor: color,
      borderWidth: '0 0 1px 1px',
      borderBottomWidth: 1,
      borderBottomColor: offline ? palette.white.main : color,
      borderBottomStyle: state === 'connected' ? 'solid' : 'dashed',
      borderStyle: 'solid',
      height: '2.6em',
      width: '1.5em',
      marginTop: '-2.6em',
      marginRight: '-1.5em',
    }
  },
  name: {
    fontWeight: 400,
    opacity: 0.8,
  },
  item: {
    '& .MuiIconButton-root': { visibility: 'hidden' },
    '&:hover .MuiIconButton-root': { visibility: 'visible' },
  },
  connectIcon: {
    position: 'relative',
    '& > svg': { position: 'absolute', right: 6, bottom: -7 },
  },
  platform: {
    minWidth: 48,
  },
  mergeIcon: {
    zIndex: 2,
    backgroundImage: `radial-gradient(${palette.white.main}, transparent)`,
  },
  icon: { marginTop: spacing.xxs, marginRight: spacing.md, marginLeft: spacing.sm },
}))
