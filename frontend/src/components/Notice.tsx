import React from 'react'
import { Icon } from './Icon'
import { spacing, colors, fontSizes } from '../styling'
import { makeStyles, Paper, Box, Button, lighten, darken } from '@material-ui/core'

type Props = {
  severity?: 'info' | 'warning'
  link?: string
  gutterBottom?: boolean
  fullWidth?: boolean
  loading?: boolean
}

export const Notice: React.FC<Props> = ({
  severity = 'info',
  link,
  fullWidth = false,
  gutterBottom,
  loading,
  children,
}) => {
  const css = useStyles({ fullWidth, gutterBottom })()
  let icon, color

  switch (severity) {
    case 'info':
      icon = 'info-circle'
      color = colors.primary
      break
    case 'warning':
      icon = 'exclamation-triangle'
      color = colors.warning
  }

  return (
    <Paper
      elevation={0}
      style={{ backgroundColor: lighten(color, 0.9), color: darken(color, 0.2) }}
      className={css.notice}
    >
      {loading ? (
        <Icon name="spinner-third" spin size="md" fixedWidth />
      ) : (
        <Icon name={icon} size="md" type="regular" />
      )}
      <Box>{children}</Box>
      {link && (
        <Button color="primary" variant="contained" href={link} size="small" target="_blank">
          Upgrade
        </Button>
      )}
    </Paper>
  )
}

const useStyles = ({ fullWidth, gutterBottom }) =>
  makeStyles({
    notice: {
      flexGrow: 1,
      alignItems: 'center',
      margin: `${spacing.xxs}px ${fullWidth ? 0 : spacing.xs}px`,
      marginBottom: gutterBottom ? spacing.md : 'inherit',
      padding: `${spacing.sm}px ${spacing.md}px`,
      display: 'flex',
      fontWeight: 500,
      '& .MuiBox-root': { flexGrow: 1 },
      '& .MuiButton-root': { minWidth: 90, marginLeft: spacing.md },
      '& .far, & .fal': { marginTop: spacing.xxs, marginRight: spacing.md, width: 21, alignSelf: 'flex-start' },
      '& em': { display: 'block', fontWeight: 400, fontSize: fontSizes.sm, fontStyle: 'normal' },
    },
  })
