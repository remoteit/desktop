import React from 'react'
import browser from '../services/Browser'
import { makeStyles } from '@mui/styles'
import { Typography } from '@mui/material'
import { SIDEBAR_WIDTH } from '../constants'
import { OrganizationSidebar } from './OrganizationSidebar'
import { RemoteManagement } from './RemoteManagement'
import { RegisterMenu } from './RegisterMenu'
import { GuideBubble } from './GuideBubble'
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
          <GuideBubble
            guide="addDevice"
            placement="bottom"
            startDate={new Date('2022-09-20')}
            enterDelay={400}
            instructions={
              <>
                <Typography variant="h3" gutterBottom>
                  <b>Add a device</b>
                </Typography>
                <Typography variant="body2" gutterBottom>
                  First step is to install our agent on any device you would like to connect to.
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Your device will automatically register and appear on the <cite>devices</cite> page.
                </Typography>
              </>
            }
          >
            <RegisterMenu buttonSize={38} size="md" type="light" />
          </GuideBubble>
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
    paddingTop: insets.top ? insets.top - spacing.xs : addSpace ? spacing.xl : spacing.md,
  }),
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
}))
