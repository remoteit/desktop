import React from 'react'
import { makeStyles, Tooltip, ListItem, ListItemText, ListItemIcon } from '@material-ui/core'
import { InitiatorPlatform } from './InitiatorPlatform'
import { ListItemLocation } from './ListItemLocation'
import { TargetPlatform } from './TargetPlatform'
import { spacing } from '../styling'
import { ApplicationState } from '../store'
import { attributeName } from '../shared/nameHelper'
import { ClearButton } from '../buttons/ClearButton'
import { useSelector } from 'react-redux'
import { selectById } from '../models/devices'
import { Title } from './Title'
import { Icon } from './Icon'

export interface Props {
  session: ISession
  merge?: boolean
  other?: boolean
  offline?: boolean
  isNew?: boolean
}

export const SessionListItem: React.FC<Props> = ({ session, merge, other, offline, isNew }) => {
  const [service, device] = useSelector((state: ApplicationState) => selectById(state, session.target.id))
  const connected = session.state === 'connected'
  const css = useStyles({ state: session.state, offline })

  let pathname = `/connections/${session.target.id}`
  if (session.id) pathname += `/${session.id}`
  if (other) pathname += '/other'

  if (!session) return null

  let icon: React.ReactElement | null = null
  if (connected) {
    icon = <Icon color="primary" name="chevron-right" type="light" size="md" />
    // if (session.public) icon = <Icon color="primary" name="chevron-double-right" type="light" size="md" />
  }

  return (
    <>
      {merge || (
        <ListItem dense>
          <ListItemIcon className={css.mergeIcon}>
            <InitiatorPlatform id={session.platform} connected={!offline} />
          </ListItemIcon>
          <ListItemText primary={<Title enabled={!offline}>{other ? session.user?.email : 'This device'}</Title>} />
        </ListItem>
      )}
      <ListItemLocation
        className={css.item}
        pathname={pathname}
        match={isNew ? '/connections/new' : `/connections/${session.target.id}`}
        dense
      >
        <Tooltip title={offline ? 'Disconnected' : connected ? 'Connected' : 'Idle'} placement="left" arrow>
          <ListItemIcon className={css.connectIcon}>
            <div className={css.connection} />
            {icon}
          </ListItemIcon>
        </Tooltip>
        <ListItemIcon className={css.platform + ' ' + css.title}>
          <TargetPlatform id={session.target.platform} size="md" color={offline ? 'gray' : 'primary'} tooltip />
        </ListItemIcon>
        <ListItemText
          className={css.title}
          primary={
            <Title>
              {service ? (
                <>
                  <span className={css.service}>{attributeName(service)}</span> - {attributeName(device)}
                </>
              ) : (
                session.target.name
              )}
            </Title>
          }
        />
        {offline && <ClearButton id={session.target.id} />}
      </ListItemLocation>
    </>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  title: ({ state, offline }: any) => ({
    opacity: state === 'offline' ? 0.5 : 1,
    '& > span': {
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      color: offline ? palette.grayDark.main : palette.primaryLight.main,
    },
  }),
  connection: ({ offline, state }: any) => ({
    borderColor: offline ? palette.grayLight.main : palette.primary.main,
    borderWidth: '0 0 1px 1px',
    borderBottomWidth: 1,
    borderBottomColor:
      state === 'connected' ? palette.primary.main : offline ? palette.grayLight.main : palette.primary.main,
    borderBottomStyle: state === 'connected' ? 'solid' : 'dashed',
    borderStyle: 'solid',
    height: '2.6em',
    marginTop: '-2.6em',
    width: '1.5em',
    marginRight: '-1.5em',
  }),
  service: ({ offline }: any) => ({
    color: offline ? palette.grayDarker.main : palette.primary.main,
    fontWeight: 500,
  }),
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
  mergeIcon: { zIndex: 2, backgroundColor: palette.white.main },
  icon: { marginTop: spacing.xxs, marginRight: spacing.md, marginLeft: spacing.sm },
}))
