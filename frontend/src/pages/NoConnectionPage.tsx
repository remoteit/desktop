import React from 'react'
import { Body } from '../components/Body'
import { makeStyles, Typography, Box } from '@material-ui/core'
import { colors, spacing } from '../styling'
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

const useStyles = makeStyles({
  container: {
    display: 'flex',
    justifyContent: 'center',
  },
  box: {
    backgroundColor: colors.primaryHighlight,
    borderRadius: spacing.md,
    padding: spacing.xl,
    marginTop: '5vw',
  },
  icon: { marginBottom: spacing.md },
})
