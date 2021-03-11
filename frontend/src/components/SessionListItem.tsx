import React from 'react'
import { makeStyles, Divider, ListItemText, ListItemIcon } from '@material-ui/core'
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
  const css = useStyles(recent)()
  const pathname = `/connections/${session.target.id}/${session.id}` + (other ? '/other' : '')

  if (!session) return null

  return (
    <ListItemLocation pathname={pathname} dense>
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
            <Icon name="arrow-right" color={recent ? 'gray' : 'primary'} size="md" type="regular" fixedWidth />
            <Title enabled={!recent}>
              {session.target.name}
              <sup>
                <TargetPlatform id={session.target.platform} tooltip />
              </sup>
            </Title>
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
      '& > svg': { marginTop: spacing.xxs, marginRight: spacing.lg, marginLeft: spacing.lg },
    },
    from: { width: '20%' },
    vertical: {
      height: '2.8em',
      backgroundColor: recent ? colors.grayLight : colors.primaryLight,
      marginTop: -spacing.sm,
      marginBottom: -spacing.sm,
    },
  })
