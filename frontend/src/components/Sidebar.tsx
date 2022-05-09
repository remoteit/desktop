import React from 'react'
import { makeStyles } from '@material-ui/core'
import { SIDEBAR_WIDTH } from '../shared/constants'
import { isElectron, isMac } from '../services/Browser'
import { RemoteManagement } from './RemoteManagement'
import { ActiveOrganizationTitle } from './ActiveOrganizationTitle'
import { RegisterMenu } from './RegisterMenu'
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
        <ActiveOrganizationTitle />
        <RegisterMenu />
      </section>
      <SidebarNav />
      <RemoteManagement />
      <section className={css.footer}>
        <AvatarMenu />
      </section>
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
    footer: {
      position: 'fixed',
      bottom: spacing.lg,
      width: SIDEBAR_WIDTH - spacing.xl,
      zIndex: 3,
    },
  }))
