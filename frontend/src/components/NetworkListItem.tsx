import React from 'react'
import classnames from 'classnames'
import { makeStyles } from '@mui/styles'
import { ListItemText, ListItemIcon } from '@mui/material'
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
      connection: state.connections.all.find(c => c.id === serviceId),
    }
  })
  session = session || foundSession
  const connected = external || session?.state === 'connected'
  const offline = service?.state !== 'active' && !external
  const platform = device?.targetPlatform || session?.target.platform
  const css = useStyles({ state: session?.state, offline, enabled: network?.enabled, connected })

  let pathname = `/networks/${serviceId}`
  if (session) pathname += `/${session.id}`
  if (external) pathname += '/other'

  let icon: React.ReactNode | null = null
  if (connected) icon = <Icon color="primary" name="chevron-right" size="md" />

  return (
    <ListItemLocation className={classnames(css.item, css.hoverIcon)} pathname={pathname} exactMatch dense>
      <ListItemIcon className={css.connectIcon}>
        <div className={css.connection} />
        {icon}
      </ListItemIcon>
      <ListItemIcon className={css.platform + ' ' + css.text}>
        <TargetPlatform id={platform} size="md" tooltip />
      </ListItemIcon>
      <ListItemText
        className={css.text}
        primary={
          <Title enabled={external || connection?.enabled}>
            {service ? (
              <>
                {attributeName(service)} - <span className={css.name}>{attributeName(device)}</span>
              </>
            ) : (
              connection?.name || session?.target.name
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
  connection: ({ offline, enabled, connected, state }: any) => {
    let color = palette.grayDark.main
    if (enabled || connected) color = palette.primary.main
    return {
      borderColor: color,
      borderBottomColor: color,
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
    '& .MuiButtonBase-root': {
      padding: spacing.xs,
      marginRight: spacing.xs,
      color: palette.grayDark.main,
    },
  },
  hoverIcon: {
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
}))
