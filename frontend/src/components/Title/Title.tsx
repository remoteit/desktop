import React from 'react'
import { makeStyles } from '@material-ui/core'
import { spacing, colors } from '../../styling'

export const Title: React.FC<{ offline?: boolean }> = ({ children, offline }) => {
  const css = useStyles()
  return <span className={css.title + (offline ? ' offline' : '')}>{children}</span>
}

const useStyles = makeStyles({
  title: {
    flexGrow: 1,
    '& sup': { marginLeft: spacing.xs, marginRight: spacing.xxs, color: colors.grayDark },
    '&.offline': { color: colors.grayDark },
    '&.offline sup': { color: colors.gray },
  },
})
