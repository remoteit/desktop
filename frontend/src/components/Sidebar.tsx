import React from 'react'
import { SIDEBAR_WIDTH } from '../shared/constants'
import { makeStyles, Box, ListItem } from '@material-ui/core'
import { isElectron, isMac } from '../services/Browser'
import { RemoteManagement } from './RemoteManagement'
import { RegisterButton } from '../buttons/RegisterButton'
import { AccountSelect } from './AccountSelect'
import { SidebarNav } from './SidebarNav'
import { AvatarMenu } from './AvatarMenu'
import { spacing } from '../styling'

export const Sidebar: React.FC = () => {
  const addSpace = isMac() && isElectron()
  const css = useStyles(addSpace)()

  return (
    <Box className={css.sidebar}>
      <section className={css.header}>
        <AvatarMenu />
        <span className={css.header}>
          <RegisterButton />
        </span>
      </section>
      <ListItem className={css.select} dense>
        <AccountSelect fullWidth />
      </ListItem>
      <SidebarNav />
      <RemoteManagement />
    </Box>
  )
}

const useStyles = addSpace =>
  makeStyles(({ palette }) => ({
    sidebar: {
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: palette.grayLighter.main,
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
    select: {
      marginTop: spacing.md,
    },
  }))
