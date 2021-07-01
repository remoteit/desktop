import React from 'react'
import { Icon } from './Icon'
import { spacing, colors, fontSizes } from '../styling'
import { makeStyles, Paper, Box, lighten, darken } from '@material-ui/core'

type Props = {
  severity?: 'info' | 'warning' | 'success'
  button?: React.ReactElement
  gutterTop?: boolean
  gutterBottom?: boolean
  fullWidth?: boolean
  loading?: boolean
}

export const Notice: React.FC<Props> = ({
  severity = 'info',
  button,
  fullWidth = false,
  gutterTop,
  gutterBottom,
  loading,
  children,
}) => {
  const css = useStyles({ fullWidth, gutterBottom, gutterTop })()
  let icon, color

  switch (severity) {
    case 'info':
      icon = 'info-circle'
      color = colors.primary
      break
    case 'warning':
      icon = 'exclamation-triangle'
      color = colors.warning
      break
    case 'success':
      icon = 'check-circle'
      color = colors.success
      break
  }

  return (
    <Paper
      elevation={0}
      style={{ backgroundColor: lighten(color, 0.9), color: darken(color, 0.1) }}
      className={css.notice}
    >
      {loading ? (
        <Icon name="spinner-third" spin size="md" fixedWidth />
      ) : (
        <Icon name={icon} size="md" type="regular" />
      )}
      <Box>{children}</Box>
      {button}
    </Paper>
  )
}

const useStyles = ({ fullWidth, gutterBottom, gutterTop }) =>
  makeStyles({
    notice: {
      flexGrow: 1,
      alignItems: 'center',
      margin: `${spacing.xxs}px ${fullWidth ? 0 : spacing.md}px`,
      marginBottom: gutterBottom ? spacing.md : 'inherit',
      marginTop: gutterTop ? spacing.md : 'inherit',
      padding: `${spacing.sm}px ${spacing.md}px`,
      display: 'flex',
      fontWeight: 500,
      '& .MuiBox-root': { flexGrow: 1, alignSelf: 'flex-start', marginTop: spacing.xxs },
      '& .MuiButton-root': { minWidth: 90, marginLeft: spacing.md },
      '& > svg': { marginTop: spacing.xxs, marginRight: spacing.md, width: 21, alignSelf: 'flex-start' },
      '& em': { display: 'block', fontWeight: 400, fontSize: fontSizes.sm, fontStyle: 'normal' },
    },
  })
