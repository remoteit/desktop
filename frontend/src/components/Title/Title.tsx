import React from 'react'
import { makeStyles, Typography } from '@material-ui/core'
import { spacing, colors } from '../../styling'

export const Title: React.FC<{ offline?: boolean; inline?: boolean }> = ({ children, offline, inline }) => {
  const css = useStyles(inline)()
  return <span className={css.title + (offline ? ' offline' : '')}>{children}</span>
}

const useStyles = inline =>
  makeStyles({
    title: {
      flexGrow: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      marginLeft: inline ? spacing.lg : 0,
      '& sup': { marginLeft: spacing.xs, marginRight: spacing.xxs, color: colors.grayDark },
      '&.offline': { color: colors.grayDark },
      '&.offline sup': { color: colors.gray },
    },
  })
