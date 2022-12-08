import React from 'react'
import { makeStyles } from '@mui/styles'
import { Box, alpha } from '@mui/material'
import { spacing, fontSizes, Color, radius } from '../../styling'
import { getLicenseChip } from '../LicenseChip'
import classnames from 'classnames'

interface Props {
  connection?: IConnection
  service?: IService
  onClick?: (IContextMenu) => void
  className?: string
}

export const ServiceMiniState: React.FC<Props> = ({ connection, service, onClick, className }) => {
  let colorName: Color = 'grayDarker'
  let state = service ? service.state : 'unknown'

  if (connection) {
    if (connection.connecting || connection.stopping) state = 'transition'
    if (connection.connected || connection.enabled) state = 'connected'
    if (connection.error?.message) state = 'error'
  }

  switch (state) {
    case 'error':
      colorName = 'danger'
      break
    case 'active':
      colorName = 'grayDarker'
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

  const css = useStyles({ colorName, textDecoration: state === 'inactive' ? 'line-through' : undefined })

  if (!service) return null

  const chip = getLicenseChip(service.license)

  if (chip.show) {
    colorName = chip.colorName
  }

  const onMouseDown = event => {
    event.stopPropagation()
    onClick && onClick({ el: event.currentTarget, serviceID: service.id })
  }

  return (
    <Box
      component="span"
      className={classnames(onClick && css.clickable, css.indicator, className)}
      onMouseDown={onMouseDown}
    >
      <span className={css.background}>{service.type}</span>
    </Box>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  button: { padding: '8px 0' },
  icon: { padding: '0 0 8px' },
  indicator: {
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
  background: ({ colorName, textDecoration }: { colorName: Color; textDecoration?: string }) => ({
    color: palette[colorName].main,
    backgroundColor: alpha(palette[colorName].main, 0.1),
    textDecoration,
  }),
  clickable: {
    cursor: 'pointer',
    '&:hover > span': {
      boxShadow: `0px 1px 2px ${palette.darken.main}`,
    },
  },
}))
