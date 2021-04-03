import React from 'react'
import { makeStyles, Divider, Tooltip, ListItemText, ListItemIcon } from '@material-ui/core'
import { InitiatorPlatform } from './InitiatorPlatform'
import { ListItemLocation } from './ListItemLocation'
import { TargetPlatform } from './TargetPlatform'
import { Title } from './Title'
import { Icon } from './Icon'
import { spacing, colors } from '../styling'

export interface Props {
  session: ISession
  merge?: boolean
  other?: boolean
  recent?: boolean
}

export const SessionListItem: React.FC<Props> = ({ session, merge, other, recent }) => {
  const connected = session.state === 'connected'
  const css = useStyles(recent)()

  let pathname = `/connections/${session.target.id}`
  if (session.id) pathname += `/${session.id}`
  if (other) pathname += '/other'

  if (!session) return null

  return (
    <ListItemLocation pathname={pathname} match={`/connections/${session.target.id}`} dense>
      <ListItemIcon>
        {merge ? (
          <Divider orientation="vertical" className={css.vertical} />
        ) : (
          <InitiatorPlatform id={session.platform} connected={!recent} />
        )}
      </ListItemIcon>
      <ListItemText
        classes={{ primary: css.title }}
        primary={
          <>
            <span className={css.from}>
              {merge || (
                <Title enabled={!recent}>
                  {other ? session.user?.email : 'This device'}
                  {/* {session.id} */}
                </Title>
              )}
            </span>
            <Tooltip title={recent ? 'Disconnected' : connected ? 'Connected' : 'Idle'} placement="top" arrow>
              <span className={css.icon}>
                <Icon
                  name={recent ? 'minus' : connected ? 'arrow-right' : 'ellipsis-h'}
                  color={recent ? 'gray' : connected ? 'primary' : 'primaryLight'}
                  size="md"
                  type="regular"
                  fixedWidth
                />
              </span>
            </Tooltip>
            <span className={css.to}>
              <Title enabled={!recent}>
                {session.target.name}
                <sup className={css.targetPlatform}>
                  <TargetPlatform id={session.target.platform} tooltip />
                </sup>
              </Title>
            </span>
          </>
        }
      />
    </ListItemLocation>
  )
}

const useStyles = recent =>
  makeStyles({
    title: {
      display: 'flex',
      alignItems: 'flex-start',
      '& > span': { overflow: 'hidden', whiteSpace: 'nowrap' },
    },
    from: { width: '25%' },
    to: { width: '60%' },
    vertical: {
      height: '2.8em',
      backgroundColor: recent ? colors.grayLight : colors.primaryLight,
      marginTop: -spacing.sm,
      marginBottom: -spacing.sm,
    },
    icon: { marginTop: spacing.xxs, marginRight: spacing.md, marginLeft: spacing.sm },
    targetPlatform: { opacity: 0.8 },
  })
