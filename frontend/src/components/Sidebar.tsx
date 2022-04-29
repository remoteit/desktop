import React from 'react'
import { makeStyles } from '@material-ui/core'
import { SIDEBAR_WIDTH } from '../shared/constants'
import { isElectron, isMac } from '../services/Browser'
import { RemoteManagement } from './RemoteManagement'
import { RegisterMenu } from './RegisterMenu'
import { AccountSelect } from './AccountSelect'
import { SidebarNav } from './SidebarNav'
import { AvatarMenu } from './AvatarMenu'
import { spacing } from '../styling'
import { Body } from './Body'

export const Sidebar: React.FC = () => {
  const addSpace = isMac() && isElectron()
  const css = useStyles(addSpace)()

  return (
    <Body className={css.sidebar} scrollbarBackground="grayLighter" insetShadow={false}>
      <section className={css.header}>
        <AvatarMenu />
        <RegisterMenu />
      </section>
      <AccountSelect />
      <SidebarNav />
      <RemoteManagement />
    </Body>
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
      maxWidth: SIDEBAR_WIDTH,
      '& section': { margin: `${spacing.xl}px ${spacing.md}px ${spacing.sm}px`, padding: 0 },
      '& section:first-child': { marginTop: addSpace ? spacing.xxl : spacing.md },
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
    },
  }))
