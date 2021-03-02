import React from 'react'
import { SIDEBAR_WIDTH } from '../../shared/constants'
import { makeStyles, Box } from '@material-ui/core'
import { isElectron, isMac } from '../../services/Browser'
import { RemoteManagement } from '../RemoteManagement'
import { NewConnectionButton } from '../../buttons/NewConnectionButton'
import { RegisterButton } from '../../buttons/RegisterButton'
import { RefreshButton } from '../../buttons/RefreshButton'
import { colors, spacing } from '../../styling'
import { SidebarNav } from '../SidebarNav'
import { AvatarMenu } from '../AvatarMenu'

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
      <section>
        <NewConnectionButton />
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
      paddingTop: addSpace ? spacing.md : 0,
      '& section': { margin: `${spacing.xl}px ${spacing.md}px` },
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
    },
  })
