import React from 'react'
import { useSelector } from 'react-redux'
import { makeStyles, Box, lighten } from '@material-ui/core'
import { spacing, colors, fontSizes, Color } from '../../styling'
import { selectSessionsByService } from '../../models/sessions'
import { ApplicationState } from '../../store'
import { connectionState } from '../../helpers/connectionHelper'
import { SessionsTooltip } from '../SessionsTooltip'
import { Icon } from '../Icon'
import classnames from 'classnames'

interface Props {
  connection?: IConnection
  service?: IService
  setContextMenu?: React.Dispatch<React.SetStateAction<IContextMenu>>
  showConnected?: boolean
}

export const ServiceMiniState: React.FC<Props> = ({ connection, service, setContextMenu, showConnected = true }) => {
  const [openTooltip, setOpenTooltip] = React.useState<boolean>(false)
  const sessions = useSelector((state: ApplicationState) =>
    selectSessionsByService(state, service?.id || connection?.id)
  )
  const cState = connectionState(service, connection)
  const connected = showConnected && !!sessions.length
  const css = useStyles()

  let colorName: Color = 'warning'
  let state = service ? service.state : 'unknown'
  let failover: boolean = false

  if (connection) {
    failover = connection.isP2P === false
    if (cState === 'connecting' || cState === 'stopping') state = 'transition'
    if (cState === 'connected') state = 'connected'
    if (connection.error?.message) state = 'error'
  }

  if (!service) return null

  switch (state) {
    case 'error':
      colorName = 'danger'
      break
    case 'active':
      colorName = 'success'
      if (service.license === 'EVALUATION') colorName = 'warning'
      break
    case 'inactive':
      colorName = 'grayLight'
      break
    case 'connected':
      colorName = 'primary'
      break
    case 'transition':
      colorName = 'grayLight'
      break
    case 'restricted':
      colorName = 'danger'
      break
    case 'unknown':
      colorName = 'grayLight'
  }

  if (service.license === 'UNLICENSED') colorName = 'grayLight'

  const color = colors[colorName]

  return (
    <>
      <SessionsTooltip service={service} open={openTooltip} sessions={sessions} placement="top" arrow label>
        <Box
          component="span"
          className={classnames(setContextMenu && css.hasMenu, css.indicator)}
          onMouseEnter={() => setOpenTooltip(true)}
          onMouseLeave={() => setOpenTooltip(false)}
          onMouseDown={event => {
            setContextMenu &&
              setContextMenu({
                el: event.currentTarget,
                serviceID: service.id,
              })
            setOpenTooltip(false)
          }}
        >
          <span style={{ color, backgroundColor: lighten(color, 0.9) }}>
            {connected && <Icon name="user" type="solid" size="xxxs" color={colorName} fixedWidth />}
            {failover && <Icon name="cloud" type="solid" size="xxxs" color={colorName} fixedWidth />}
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
    '& > span': {
      borderRadius: 3,
      fontSize: fontSizes.xxs,
      fontWeight: 500,
      padding: 1,
      paddingLeft: 3,
      paddingRight: 3,
      marginLeft: 2,
      marginRight: 2,
      '& svg': { marginRight: 2 },
    },
  },
  hasMenu: {
    cursor: 'pointer',
    '&:hover > span': {
      boxShadow: `0px 1px 2px ${colors.darken}`,
    },
  },
})
