import React from 'react'
import { IUser } from 'remote.it'
import { Tooltip, Divider } from '@material-ui/core'

const MAX_SESSIONS_DISPLAY = 3

interface Props {
  service?: IService
  user?: IUser
  label?: boolean
}

export const SessionsTooltip: React.FC<Props> = ({ service, user, label, children }) => {
  if (!service) return null

  const list = service?.sessions?.reduce((list: string[], session, index, all) => {
    if (index > MAX_SESSIONS_DISPLAY) return list
    if (index === MAX_SESSIONS_DISPLAY) list.push(`...and ${all.length - index} more`)
    else session.email === user?.email ? list.unshift('You') : list.push(session.email)
    return list
  }, [])

  return (
    <Tooltip
      title={
        <>
          {label && service.name}
          {!!list?.length && (
            <>
              {label && <Divider />}
              {list?.map(item => (
                <>
                  {item}
                  <br />
                </>
              ))}
            </>
          )}
        </>
      }
    >
      <span>{children}</span>
    </Tooltip>
  )
}
