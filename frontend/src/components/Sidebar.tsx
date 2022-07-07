import React from 'react'
import { makeStyles } from '@material-ui/core'
import { SIDEBAR_WIDTH } from '../shared/constants'
import { isElectron, isMac } from '../services/Browser'
import { OrganizationSidebar } from './OrganizationSidebar'
import { RemoteManagement } from './RemoteManagement'
import { RegisterMenu } from './RegisterMenu'
import { SidebarNav } from './SidebarNav'
import { AvatarMenu } from './AvatarMenu'
import { GuideStep } from './GuideStep'
import { spacing } from '../styling'
import { Body } from './Body'

export const Sidebar: React.FC<{ layout: ILayout }> = ({ layout }) => {
  const addSpace = isMac() && isElectron() && !layout.showOrgs
  const css = useStyles({ addSpace })

  return (
    <OrganizationSidebar hide={!layout.showOrgs}>
      <Body className={css.sidebar} scrollbarBackground="grayLighter">
        <section className={css.header}>
          <AvatarMenu />
          <GuideStep guide="guideAWS" step={6} instructions="Now add your own first device!" autoNext>
            <RegisterMenu />
          </GuideStep>
        </section>
        <SidebarNav />
        <RemoteManagement />
      </Body>
    </OrganizationSidebar>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  sidebar: ({ addSpace }: { addSpace: boolean }) => ({
    display: 'flex',
    flexDirection: 'column',
    contain: 'layout',
    backgroundColor: palette.grayLighter.main,
    width: SIDEBAR_WIDTH,
    minWidth: SIDEBAR_WIDTH,
    maxWidth: SIDEBAR_WIDTH,
    '& section': { margin: `${spacing.xl}px ${spacing.md}px ${spacing.sm}px`, padding: 0 },
    '& section:first-child': { marginTop: addSpace ? spacing.xxl : spacing.lg },
  }),
  header: {
    display: 'flex',
    justifyContent: 'space-between',
  },
}))
