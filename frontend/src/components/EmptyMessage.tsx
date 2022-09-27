import React from 'react'
import { Typography, Box } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { spacing } from '../styling'
import { Icon } from './Icon'

type Props = {
  message: string | React.ReactNode
}

export const EmptyMessage: React.FC<Props> = ({ message }) => {
  const css = useStyles()
  return (
    <Box className={css.box}>
      <Icon name="mouse-pointer" type="solid" size="lg" className={css.icon} />
      <Typography variant="body2" color="GrayText">
        {message}
      </Typography>
    </Box>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  box: {
    backgroundColor: palette.grayLightest.main,
    borderRadius: spacing.md,
    padding: spacing.xl,
  },
  icon: { marginBottom: spacing.md },
}))
