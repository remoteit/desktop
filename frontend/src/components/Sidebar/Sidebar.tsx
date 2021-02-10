import React from 'react'
import { SIDEBAR_WIDTH } from '../../shared/constants'
import { makeStyles, Typography, Box } from '@material-ui/core'
import { colors } from '../../styling'
import { isElectron, isMac } from '../../services/Browser'
import { RemoteManagement } from '../RemoteManagement'

export const Sidebar: React.FC = () => {
  const addSpace = isMac() && isElectron()
  const css = useStyles(addSpace)()

  return (
    <Box className={css.sidebar}>
      <section>
        <Typography variant="h2">Sidebar</Typography>
      </section>
      <RemoteManagement />
    </Box>
  )
}

const useStyles = addSpace =>
  makeStyles({
    sidebar: {
      backgroundColor: colors.grayLighter,
      width: SIDEBAR_WIDTH,
      minWidth: SIDEBAR_WIDTH,
      height: '100%',
      zIndex: -1,
      paddingTop: addSpace ? 40 : 0,
      // boxShadow: 'inset -5px 0px 3px -4px rgba(0,0,0,0.1)',
    },
  })
