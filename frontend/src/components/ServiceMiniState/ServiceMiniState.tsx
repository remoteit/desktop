import React from 'react'
import { useSelector } from 'react-redux'
import { makeStyles, Box, lighten } from '@material-ui/core'
import { spacing, colors, fontSizes, Color, radius } from '../../styling'
import { selectSessionsByService } from '../../models/sessions'
import { ApplicationState } from '../../store'
import { connectionState } from '../../helpers/connectionHelper'
import { SessionsTooltip } from '../SessionsTooltip'
import { getLicenseChip } from '../LicenseChip'
import { Icon } from '../Icon'
import classnames from 'classnames'

interface Props {
  connection?: IConnection
  service?: IService
  onClick?: (IContextMenu) => void
  showConnected?: boolean
}

export const ServiceMiniState: React.FC<Props> = ({ connection, service, onClick, showConnected = true }) => {
  const [openTooltip, setOpenTooltip] = React.useState<boolean>(false)
  const { sessions } = useSelector((state: ApplicationState) => ({
    sessions: selectSessionsByService(state, service?.id || connection?.id),
  }))
  const cState = connectionState(service, connection)
  const connected = showConnected && !!sessions.length
  const css = useStyles()

  let colorName: Color = 'grayDarker'
  let state = service ? service.state : 'unknown'
  let proxy: boolean = false
  let opacity: number = 1
  let label: string = ''

  if (connection) {
    proxy = !!connection.connected && connection.isP2P === false
    if (cState === 'connecting' || cState === 'stopping') state = 'transition'
    if (cState === 'connected' || cState === 'ready') state = 'connected'
    if (connection.error?.message) state = 'error'
  }

  if (!service) return null

  switch (state) {
    case 'error':
      colorName = 'danger'
      break
    case 'active':
      colorName = 'grayDarker'
      break
    case 'inactive':
      opacity = 0.3
      break
    case 'connected':
      colorName = 'primary'
      break
    case 'transition':
      colorName = 'grayDarkest'
      break
    case 'restricted':
      colorName = 'danger'
      break
    case 'unknown':
      colorName = 'grayLight'
  }

  const chip = getLicenseChip(service.license)

  if (chip.show) {
    colorName = chip.colorName
    label = chip.name
  }

  const color = colors[colorName]

  return (
    <>
      <SessionsTooltip
        service={service}
        open={openTooltip}
        sessions={sessions}
        secondaryLabel={label}
        placement="top"
        arrow
        label
      >
        <Box
          component="span"
          className={classnames(onClick && css.clickable, css.indicator)}
          onMouseEnter={() => setOpenTooltip(true)}
          onMouseLeave={() => setOpenTooltip(false)}
          onMouseDown={event => {
            event.stopPropagation()
            onClick && onClick({ el: event.currentTarget, serviceID: service.id })
            setOpenTooltip(false)
          }}
        >
          <span
            style={{
              color,
              opacity,
              backgroundColor: lighten(color, 0.94),
              textDecoration: state === 'inactive' ? 'line-through' : '',
            }}
          >
            {connected && <Icon name="user" type="solid" size="xxxs" color="primary" fixedWidth />}
            {proxy && <Icon name="cloud" type="solid" size="xxxs" color={colorName} fixedWidth />}
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
      borderRadius: radius,
      fontSize: fontSizes.xxs,
      fontWeight: 500,
      padding: 1,
      paddingLeft: spacing.xs,
      paddingRight: spacing.xs,
      marginLeft: 1,
      marginRight: 1,
      '& svg': { marginRight: 2 },
    },
  },
  clickable: {
    cursor: 'pointer',
    '&:hover > span': {
      boxShadow: `0px 1px 2px ${colors.darken}`,
    },
  },
})
