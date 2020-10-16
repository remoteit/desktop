import React from 'react'
import { Icon } from './Icon'
import { DynamicButton } from '../buttons/DynamicButton'
import { spacing, colors, fontSizes, Color } from '../styling'
import { makeStyles, Paper, Box, Button, lighten, darken } from '@material-ui/core'
import classnames from 'classnames'

type Props = {
  severity?: 'info' | 'warning'
  link?: string
  gutterBottom?: boolean
}

export const Notice: React.FC<Props> = ({ severity = 'info', link, gutterBottom, children }) => {
  const css = useStyles()
  let icon, color, colorName

  switch (severity) {
    case 'info':
      icon = 'info-circle'
      color = colors.primary
      colorName = 'primary'
      break
    case 'warning':
      icon = 'exclamation-triangle'
      color = colors.warning
      colorName = 'warning'
  }

  return (
    <Paper
      elevation={0}
      style={{ backgroundColor: lighten(color, 0.9), color: darken(color, 0.2) }}
      className={classnames(css.notice, gutterBottom && css.gutter)}
    >
      <Icon name={icon} size="md" type="regular" />
      <Box>{children}</Box>
      {link && (
        <Button style={{ color }} href={link} size="small" target="_blank">
          Learn More
        </Button>
      )}
    </Paper>
  )
}

const useStyles = makeStyles({
  notice: {
    flexGrow: 1,
    alignItems: 'center',
    margin: `${spacing.xxs}px ${spacing.xs}px`,
    padding: `${spacing.sm}px ${spacing.md}px`,
    display: 'flex',
    fontWeight: 500,
    '& .MuiBox-root': { flexGrow: 1 },
    '& .MuiButton-root': { minWidth: 110, marginLeft: spacing.md },
    '& .far': { marginTop: spacing.xxs, marginRight: spacing.md, width: 21, alignSelf: 'flex-start' },
    '& em': { display: 'block', fontWeight: 400, fontSize: fontSizes.sm, fontStyle: 'normal' },
    '& a:hover': { backgroundColor: colors.screen },
  },
  gutter: {
    marginBottom: spacing.md,
  },
})
