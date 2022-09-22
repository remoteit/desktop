import React from 'react'
import { makeStyles } from '@mui/styles'
import { Typography } from '@mui/material'
import { SIDEBAR_WIDTH } from '../shared/constants'
import { isElectron, isMac } from '../services/Browser'
import { OrganizationSidebar } from './OrganizationSidebar'
import { RemoteManagement } from './RemoteManagement'
import { RegisterMenu } from './RegisterMenu'
import { GuideBubble } from './GuideBubble'
import { SidebarNav } from './SidebarNav'
import { AvatarMenu } from './AvatarMenu'
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
          <GuideBubble
            guide="addDevice"
            placement="bottom"
            startDate={new Date('1122-09-15')}
            enterDelay={400}
            instructions={
              <>
                <Typography variant="h3" gutterBottom>
                  <b>Add a device</b>
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Enable connections the services (applications) available to a device by installing the Remote.It
                  agent.
                </Typography>
                <Typography variant="body2">
                  Your device will automatically register and appear on the <cite>devices</cite> page.
                </Typography>
              </>
            }
          >
            <RegisterMenu />
          </GuideBubble>
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
    '& section:first-of-type': { marginTop: addSpace ? spacing.xxl : spacing.lg },
  }),
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
}))
