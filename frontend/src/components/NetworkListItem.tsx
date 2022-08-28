import React from 'react'
import { makeStyles } from '@mui/styles'
import { useLocation } from 'react-router-dom'
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
  const location = useLocation()
  const tab = location.pathname.split('/')[1]
  const connected = external || session?.state === 'connected' || connection?.connected
  const offline = service?.state !== 'active' && !external
  const platform = device?.targetPlatform || session?.target.platform
  const css = useStyles({ offline, enabled: network?.enabled, connected })

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
              connection?.name || session?.target.name || serviceId
            )}
          </Title>
        }
      />
      {children}
    </ListItemLocation>
  )
}

export const useStyles = makeStyles(({ palette }) => ({
  text: ({ offline }: any) => ({
    opacity: offline ? 0.3 : 1,
    '& > span': {
      fontWeight: 500,
      overflow: 'hidden',
      whiteSpace: 'nowrap',
    },
  }),
  connection: ({ offline, enabled, connected }: any) => {
    let color = palette.grayDark.main
    if (enabled || connected) color = palette.primary.main
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
  name: {
    fontWeight: 400,
    opacity: 0.8,
  },
  item: {
    marginTop: 0,
    marginBottom: 0,
    '& .tooltip': { position: 'absolute', right: spacing.xl, marginTop: -2 },
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
