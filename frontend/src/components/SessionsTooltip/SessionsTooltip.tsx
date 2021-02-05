import React from 'react'
import { attributeName } from '../../shared/nameHelper'
import { Tooltip, TooltipProps, Divider } from '@material-ui/core'

const MAX_SESSIONS_DISPLAY = 3

interface Props {
  service?: IService
  placement?: TooltipProps['placement']
  sessions?: ISession[]
  label?: boolean
  open?: boolean
  arrow?: boolean
  disabled?: boolean
}

export const SessionsTooltip: React.FC<Props> = ({ service, sessions, label, children, disabled, ...props }) => {
  if (!service) return null

  const list = sessions?.reduce((list: string[], session, index, all) => {
    if (index > MAX_SESSIONS_DISPLAY) return list
    if (index === MAX_SESSIONS_DISPLAY) list.push(`...and ${all.length - index} more`)
    else list.push(session.user.email)
    return list
  }, [])

  if (disabled) props.open = false

  return (
    <Tooltip
      {...props}
      title={
        <>
          {label && attributeName(service)}
          {!!list?.length && (
            <>
              {label && <Divider />}
              {list?.map((item, index) => (
                <span key={index}>
                  {item}
                  <br />
                </span>
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
