import React from 'react'
import { makeStyles, ListItemText, ListItemIcon } from '@material-ui/core'
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
}

export const NetworkListItem: React.FC<Props> = ({ network, serviceId, children }) => {
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

  if (!connection && !service) return null

  let icon: React.ReactElement | null = null
  if (connected) icon = <Icon color="primary" name="chevron-right" type="light" size="md" />

  return (
    <ListItemLocation className={css.item} pathname={`/networks/${serviceId}`} exactMatch dense>
      <ListItemIcon className={css.connectIcon}>
        <div className={css.connection} />
        {icon}
      </ListItemIcon>
      <ListItemIcon className={css.platform + ' ' + css.text}>
        <TargetPlatform id={device?.targetPlatform} size="md" tooltip />
      </ListItemIcon>
      <ListItemText
        className={css.text}
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

export const useStyles = makeStyles(({ palette }) => ({
  text: ({ state }: any) => ({
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
      borderBottomWidth: offline ? 0 : 1,
      borderBottomStyle: state === 'connected' ? 'solid' : 'dashed',
      borderStyle: 'solid',
      height: '2.7em',
      width: '1.5em',
      marginTop: '-2.7em',
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
  platform: { minWidth: 48 },
  mergeIcon: {
    zIndex: 2,
    backgroundImage: `radial-gradient(${palette.white.main}, transparent)`,
  },
  icon: { marginTop: spacing.xxs, marginRight: spacing.md, marginLeft: spacing.sm },
  title: {
    // position: 'sticky',
  },
}))
