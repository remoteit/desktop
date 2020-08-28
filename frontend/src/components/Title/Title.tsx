import React from 'react'
import { makeStyles } from '@material-ui/core'
import { spacing, colors } from '../../styling'

export const Title: React.FC<{ online?: boolean }> = ({ children, online }) => {
  const css = useStyles()
  return <span className={css.title + (online ? ' online' : '')}>{children}</span>
}

const useStyles = makeStyles({
  title: {
    flexGrow: 1,
    color: colors.grayDark,
    '&.online': { color: colors.grayDarkest },
    '& sup': { marginLeft: spacing.xs, marginRight: spacing.xxs, color: colors.gray },
    '&.online sup': { color: colors.grayDarker },
  },
})
