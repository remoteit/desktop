import React from 'react'
import { Typography, Box } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { spacing } from '../styling'
import { Icon } from '../components/Icon'

export const NoConnectionPage: React.FC = () => {
  const css = useStyles()
  return (
    <Box className={css.container}>
      <Box className={css.box}>
        <Icon name="mouse-pointer" type="solid" size="lg" className={css.icon} />
        <Typography variant="body2" color="primary">
          Select a <br />
          connection to
          <br /> view its details.
        </Typography>
      </Box>
    </Box>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  container: {
    display: 'flex',
    justifyContent: 'center',
  },
  box: {
    backgroundColor: palette.primaryHighlight.main,
    borderRadius: spacing.md,
    padding: spacing.xl,
    marginTop: '5vw',
  },
  icon: { marginBottom: spacing.md },
}))
