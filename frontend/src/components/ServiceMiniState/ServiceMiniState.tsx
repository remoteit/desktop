import React from 'react'
import { IUser } from 'remote.it'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@material-ui/core/styles'
import { Tooltip, IconButton } from '@material-ui/core'
import { colors, spacing, Color } from '../../styling'
import { Icon } from '../Icon'

interface Props {
  connection?: IConnection
  service?: IService
  pathname: string
  disabled?: boolean
  user?: IUser
}

export const ServiceMiniState: React.FC<Props> = ({ connection, service, pathname, disabled, user }) => {
  const history = useHistory()
  const css = useStyles()

  let colorName: Color = 'warning'
  let state = service ? service.state : 'unknown'
  let title = state
  let sessions = service?.sessions?.reduce((count, session) => {
    return session.email === user?.email ? count : ++count
  }, 0)

  if (connection) {
    if (connection.pid && !connection.active) state = 'connecting'
    if (connection.active) state = 'connected'
  }

  switch (state) {
    case 'active':
      colorName = 'success'
      break
    case 'inactive':
      colorName = 'grayLight'
      break
    case 'connected':
      colorName = 'primary'
      break
    case 'connecting':
      colorName = 'grayLight'
      break
    case 'restricted':
      colorName = 'danger'
      break
    case 'unknown':
      colorName = 'grayLight'
  }

  if (service) {
    const list = service?.sessions?.reduce((list: string[], session, index, all) => {
      console.log('SESSION', session.email)
      if (index > 3) return list
      if (index === 3) list.push(`and ${all.length - index} more`)
      else session.email === user?.email ? list.unshift('You') : list.push(session.email)
      return list
    }, [])

    title = (
      <>
        {service.name}
        <br />
        {list?.map(item => (
          <>
            {item}
            <br />
          </>
        ))}
        {sessions ? `${sessions} connected` : state}
      </>
      // <>
      //   {service.name}
      //   <br />
      //   {sessions ? `${sessions} connected` : state}
      // </>
    )
  }

  return (
    <Tooltip title={title}>
      <span>
        <IconButton
          className={sessions ? css.icon : css.button}
          onClick={() => history.push(pathname)}
          disabled={disabled}
        >
          {sessions ? (
            <Icon name="user-friends" weight="solid" size="xs" color={colorName} fixedWidth />
          ) : (
            <span className={css.indicator} style={{ backgroundColor: colors[colorName] }} />
          )}
        </IconButton>
      </span>
    </Tooltip>
  )
}

const useStyles = makeStyles({
  button: { padding: '8px 0' },
  icon: { padding: '2px 0 8px' },
  indicator: {
    height: 2,
    borderRadius: 2,
    width: spacing.sm,
    display: 'inline-block',
    marginLeft: 2,
    marginRight: 2,
  },
})

/* 

One that has them all instead of one each.
replace your username with you.

List of people connected on service detail page

*/
