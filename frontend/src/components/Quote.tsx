import React from 'react'
import { colors, spacing } from '../styling'
import { makeStyles, Box } from '@material-ui/core'

export const Quote: React.FC = ({ children }) => {
  const css = useStyles()
  return <Box className={css.quote}>{children}</Box>
}

const useStyles = makeStyles({
  quote: {
    margin: `${spacing.lg}px 0`,
    paddingLeft: spacing.lg,
    borderLeft: `1px solid ${colors.grayLight}`,
  },
})
