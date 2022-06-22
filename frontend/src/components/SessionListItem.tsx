import React from 'react'
import { ListItem, ListItemText, ListItemIcon } from '@material-ui/core'
import { ApplicationState, Dispatch } from '../store'
import { useSelector, useDispatch } from 'react-redux'
import { InitiatorPlatform } from './InitiatorPlatform'
import { ListItemLocation } from './ListItemLocation'
import { TargetPlatform } from './TargetPlatform'
import { attributeName } from '../shared/nameHelper'
import { ClearButton } from '../buttons/ClearButton'
import { selectById } from '../models/devices'
import { useStyles } from './NetworkListItem'
import { Title } from './Title'
import { Icon } from './Icon'

export interface Props {
  session: ISession
  merge?: boolean
  other?: boolean
  inactive?: boolean
  isNew?: boolean
}

export const SessionListItem: React.FC<Props> = ({ session, merge, other, inactive, isNew }) => {
  const dispatch = useDispatch<Dispatch>()
  const [service, device] = useSelector((state: ApplicationState) => selectById(state, session.target.id))
  const connected = session.state === 'connected'
  const css = useStyles({ state: session.state, offline: session.state === 'offline' })

  let pathname = `/networks/${session.target.id}`
  if (session.id) pathname += `/${session.id}`
  if (other) pathname += '/other'

  if (!session) return null

  let icon: React.ReactElement | null = null
  if (connected) icon = <Icon color="primary" name="chevron-right" type="light" size="md" />

  return (
    <>
      {merge || (
        <ListItem dense>
          <ListItemIcon className={css.mergeIcon}>
            <InitiatorPlatform id={session.platform} connected={!inactive} thisDevice={!other} />
          </ListItemIcon>
          <ListItemText primary={<Title enabled={!inactive}>{other ? session.user?.email : 'This system'}</Title>} />
        </ListItem>
      )}
      <ListItemLocation
        className={css.item}
        pathname={pathname}
        match={isNew ? '/connections/new' : pathname}
        exactMatch
        dense
      >
        <ListItemIcon className={css.connectIcon}>
          <div className={css.connection} />
          {icon}
        </ListItemIcon>
        <ListItemIcon className={css.platform + ' ' + css.text}>
          <TargetPlatform id={session.target.platform} size="md" tooltip />
        </ListItemIcon>
        <ListItemText
          className={css.text}
          primary={
            <Title>
              {service ? (
                <>
                  {attributeName(service)} - <span className={css.name}>{attributeName(device)}</span>
                </>
              ) : (
                session.target.name
              )}
            </Title>
          }
        />
        {inactive && (
          <ClearButton id={session.target.id} onClick={() => dispatch.connections.clear(session.target.id)} />
        )}
      </ListItemLocation>
    </>
  )
}
