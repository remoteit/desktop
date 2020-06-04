import React from 'react'
import { colors } from '../../styling'
import { makeStyles, Box, Typography } from '@material-ui/core'

export const Subtitle: React.FC<{ primary: string; secondary?: string }> = ({ primary, secondary }) => {
  const css = useStyles()

  return (
    <Box className={css.box}>
      <Typography variant="subtitle1">{primary}</Typography>
      {secondary && <Typography variant="caption">{secondary}</Typography>}
    </Box>
  )
}

const useStyles = makeStyles({
  box: {
    display: 'flex',
    alignItems: 'baseline',
    '& span': { letterSpacing: 1, color: colors.success, fontWeight: 500 },
  },
})
