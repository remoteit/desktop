import React from 'react'
import browser from '../services/browser'
import { Box } from '@mui/material'
import { SIDEBAR_WIDTH } from '../constants'
import { OrganizationSidebar } from './OrganizationSidebar'
import { RemoteManagement } from './RemoteManagement'
import { RegisterMenu } from './RegisterMenu'
import { SidebarNav } from './SidebarNav'
import { AdminSidebarNav } from './AdminSidebarNav'
import { AvatarMenu } from './AvatarMenu'
import { spacing } from '../styling'
import { Body } from './Body'
import { useSelector } from 'react-redux'
import { State } from '../store'
import { useLocation } from 'react-router-dom'
import { selectIsAdminRouteMode } from '../selectors/ui'

export const Sidebar: React.FC<{ layout: ILayout }> = ({ layout }) => {
  const addSpace = browser.isMac && browser.isElectron && !layout.showOrgs
  const location = useLocation()
  const adminMode = useSelector((state: State) => selectIsAdminRouteMode(state, location.pathname))
  const insets = layout.insets

  return (
    <OrganizationSidebar insets={layout.insets} hide={!layout.showOrgs || adminMode}>
      <Body
        scrollbarBackground="grayLighter"
        sx={theme => ({
          display: 'flex',
          flexDirection: 'column',
          contain: 'layout',
          backgroundColor: theme.palette.grayLighter.main,
          width: SIDEBAR_WIDTH,
          minWidth: SIDEBAR_WIDTH,
          maxWidth: SIDEBAR_WIDTH,
          '& section': { margin: `${spacing.xl}px ${spacing.md}px ${spacing.sm}px`, padding: 0 },
          '& section:first-of-type': { marginTop: `${spacing.sm}px` },
          // for iOS mobile
          paddingTop: `${spacing.md + (insets.top ? insets.top : addSpace ? spacing.md : 0)}px`,
          paddingBottom: `${insets?.bottom ?? 0}px`,
        })}
      >
        {adminMode ? (
          <AdminSidebarNav />
        ) : (
          <>
            <Box
              component="section"
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: `${spacing.sm}px`,
              }}
            >
              <AvatarMenu />
              <RegisterMenu buttonSize={38} sidebar type="solid" />
            </Box>
            <SidebarNav />
            <RemoteManagement />
          </>
        )}
      </Body>
    </OrganizationSidebar>
  )
}
