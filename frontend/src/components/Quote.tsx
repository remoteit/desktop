import React from 'react'
import { colors, spacing } from '../styling'
import { makeStyles, Box } from '@material-ui/core'

export const Quote: React.FC<{ margin?: number }> = ({ children, margin = spacing.lg }) => {
  const css = useStyles(margin)()
  return <Box className={css.quote}>{children}</Box>
}

const useStyles = margin =>
  makeStyles({
    quote: {
      margin: `${margin}px 0`,
      paddingLeft: spacing.lg,
      borderLeft: `1px solid ${colors.grayLight}`,
    },
  })
