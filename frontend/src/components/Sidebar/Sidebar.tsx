import React from 'react'
import { SIDEBAR_WIDTH } from '../../shared/constants'
import { makeStyles, Box } from '@material-ui/core'
import { isElectron, isMac } from '../../services/Browser'
import { RemoteManagement } from '../RemoteManagement'
import { RegisterButton } from '../../buttons/RegisterButton'
import { RefreshButton } from '../../buttons/RefreshButton'
import { SidebarNav } from '../SidebarNav'
import { AvatarMenu } from '../AvatarMenu'
import { colors, spacing } from '../../styling'

export const Sidebar: React.FC = () => {
  const addSpace = isMac() && isElectron()
  const css = useStyles(addSpace)()

  return (
    <Box className={css.sidebar}>
      <section className={css.header}>
        <AvatarMenu />
        <span className={css.header}>
          <RegisterButton />
          <RefreshButton />
        </span>
      </section>
      <SidebarNav />
      <RemoteManagement />
    </Box>
  )
}

const useStyles = addSpace =>
  makeStyles({
    sidebar: {
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: colors.grayLighter,
      width: SIDEBAR_WIDTH,
      minWidth: SIDEBAR_WIDTH,
      height: '100%',
      position: 'relative',
      '& section': { margin: `${spacing.xl}px ${spacing.md}px ${spacing.sm}px` },
      '& section:first-child': { marginTop: addSpace ? spacing.xxl : spacing.md },
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
    },
  })
