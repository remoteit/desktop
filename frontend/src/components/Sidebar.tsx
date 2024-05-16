import React from 'react'
import browser from '../services/browser'
import { makeStyles } from '@mui/styles'
import { SIDEBAR_WIDTH } from '../constants'
import { OrganizationSidebar } from './OrganizationSidebar'
import { RemoteManagement } from './RemoteManagement'
import { RegisterMenu } from './RegisterMenu'
import { SidebarNav } from './SidebarNav'
import { AvatarMenu } from './AvatarMenu'
import { spacing } from '../styling'
import { Body } from './Body'

export const Sidebar: React.FC<{ layout: ILayout }> = ({ layout }) => {
  const addSpace = browser.isMac && browser.isElectron && !layout.showOrgs
  const css = useStyles({ insets: layout.insets, addSpace })

  return (
    <OrganizationSidebar insets={layout.insets} hide={!layout.showOrgs}>
      <Body className={css.sidebar} scrollbarBackground="grayLighter">
        <section className={css.header}>
          <AvatarMenu />
          <RegisterMenu buttonSize={38} sidebar type="solid" />
        </section>
        <SidebarNav />
        <RemoteManagement />
      </Body>
    </OrganizationSidebar>
  )
}

type StyleProps = {
  addSpace: boolean
  insets: ILayout['insets']
}

const useStyles = makeStyles(({ palette }) => ({
  sidebar: ({ insets, addSpace }: StyleProps) => ({
    display: 'flex',
    flexDirection: 'column',
    contain: 'layout',
    backgroundColor: palette.grayLighter.main,
    width: SIDEBAR_WIDTH,
    minWidth: SIDEBAR_WIDTH,
    maxWidth: SIDEBAR_WIDTH,
    '& section': { margin: `${spacing.xl}px ${spacing.md}px ${spacing.sm}px`, padding: 0 },
    '& section:first-of-type': { marginTop: spacing.sm },
    // for iOS mobile
    paddingTop: spacing.md + (insets.top ? insets.top : addSpace ? spacing.md : 0),
    paddingBottom: insets?.bottom,
  }),
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
}))
