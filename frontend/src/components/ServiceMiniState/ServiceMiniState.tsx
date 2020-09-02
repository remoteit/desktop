import React from 'react'
import { makeStyles, Box } from '@material-ui/core'
import { spacing, colors, Color } from '../../styling'
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
        <Box
          component="span"
          className={css.indicator}
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
          <span style={{ color, borderColor: color }}>
            {connected && <Icon name="user" type="solid" size="xxxs" color={colorName} fixedWidth />}
            {service.type}
          </span>
        </Box>
      </SessionsTooltip>
    </>
  )
}

const useStyles = makeStyles({
  button: { padding: '8px 0' },
  icon: { padding: '0 0 8px' },
  indicator: {
    height: spacing.xl,
    display: 'inline-flex',
    alignItems: 'center',
    cursor: 'pointer',
    '& > span': {
      borderRadius: 3,
      fontSize: 9,
      fontWeight: 500,
      padding: 1,
      paddingLeft: 3,
      paddingRight: 3,
      marginLeft: 2,
      marginRight: 2,
      borderWidth: 1,
      borderStyle: 'solid',
      '& .fas': { marginRight: 2 },
    },
    '&:hover > span': {
      boxShadow: `1px 1px 1px 0 ${colors.darken}`,
      borderColor: `${colors.grayDarkest} !important`,
      color: `${colors.grayDarkest} !important`,
      '& .fas': { color: `${colors.grayDarkest} !important` },
    },
  },
})
