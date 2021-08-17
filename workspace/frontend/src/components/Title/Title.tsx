import React from 'react'
import { makeStyles } from '@material-ui/core'
import { spacing, colors } from '../../styling'

export const Title: React.FC<{ offline?: boolean; inline?: boolean; enabled?: boolean }> = ({
  children,
  offline,
  inline,
  enabled,
}) => {
  const css = useStyles(inline, offline, enabled)()
  return <span className={css.title + (offline ? ' offline' : '')}>{children}</span>
}

const useStyles = (inline, offline, enabled) =>
  makeStyles({
    title: {
      display: 'block',
      flexGrow: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      marginLeft: inline ? spacing.lg : 0,
      color: enabled ? colors.primary : undefined,
      opacity: offline ? 0.3 : undefined,
      '& sup': {
        marginLeft: spacing.xs,
        marginRight: spacing.xxs,
        color: enabled ? colors.primary : colors.grayDark,
      },
    },
  })
