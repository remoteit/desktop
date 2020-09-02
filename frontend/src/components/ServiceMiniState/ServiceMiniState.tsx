import React from 'react'
import { useHistory } from 'react-router-dom'
import { makeStyles } from '@material-ui/core'
import { colors, Color } from '../../styling'
import { SessionsTooltip } from '../SessionsTooltip'
import { Icon } from '../Icon'

interface Props {
  connection?: IConnection
  service?: IService
  setContextMenu: React.Dispatch<React.SetStateAction<IContextMenu>>
}

export const ServiceMiniState: React.FC<Props> = ({ connection, service, setContextMenu }) => {
  const [openTooltip, setOpenTooltip] = React.useState<boolean>(false)
  const css = useStyles()
  const connected = !!service?.sessions.length

  let colorName: Color = 'warning'
  let state = service ? service.state : 'unknown'

  if (connection) {
    if (connection.connecting && !connection.active) state = 'connecting'
    if (connection.active) state = 'connected'
    if (connection.error?.message) state = 'error'
  }

  if (!service) return null

  switch (state) {
    case 'error':
      colorName = 'danger'
      break
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

  const color = colors[colorName]

  return (
    <>
      <SessionsTooltip service={service} open={openTooltip} placement="top" arrow label>
        {connected && <Icon name="user" type="solid" size="xs" color={colorName} fixedWidth />}
        <span
          className={css.indicator}
          style={{ color, borderColor: color }}
          onMouseEnter={() => setOpenTooltip(true)}
          onMouseLeave={() => setOpenTooltip(false)}
          onMouseDown={event => {
            setContextMenu({
              el: event.currentTarget,
              serviceID: service.id,
            })
            setOpenTooltip(false)
          }}
        >
          {service.type}
        </span>
      </SessionsTooltip>
    </>
  )
}

const useStyles = makeStyles({
  button: { padding: '8px 0' },
  icon: { padding: '0 0 8px' },
  indicator: {
    opacity: 0.6,
    borderRadius: 3,
    fontSize: 8,
    fontWeight: 600,
    padding: 1,
    paddingLeft: 3,
    paddingRight: 3,
    marginLeft: 2,
    marginRight: 2,
    borderWidth: 1,
    borderStyle: 'solid',
    '&:hover': {
      cursor: 'pointer',
      opacity: 1,
    },
  },
})
