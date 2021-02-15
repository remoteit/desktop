import React from 'react'
import { SIDEBAR_WIDTH } from '../../shared/constants'
import { makeStyles, Typography, Box } from '@material-ui/core'
import { isElectron, isMac } from '../../services/Browser'
import { RemoteManagement } from '../RemoteManagement'
import { RefreshButton } from '../../buttons/RefreshButton'
import { colors, spacing } from '../../styling'
import { SidebarNav } from '../SidebarNav'
import { AvatarMenu } from '../AvatarMenu'

export const Sidebar: React.FC = () => {
  const addSpace = isMac() && isElectron()
  const css = useStyles(addSpace)()

  return (
    <Box className={css.sidebar}>
      <section>
        <AvatarMenu />
        <RefreshButton />
        {/* <Typography variant="h2">Sidebar</Typography> */}
      </section>
      <SidebarNav />
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
      paddingTop: addSpace ? 40 : 0,
      '-webkit-app-region': 'drag',
      // '-webkit-user-select': 'none',
      // boxShadow: 'inset -5px 0px 3px -4px rgba(0,0,0,0.1)',
      // zIndex: -1,
      '& section': {
        padding: spacing.lg,
      },
    },
  })
