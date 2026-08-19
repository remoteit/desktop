import React from 'react'
import browser from '../services/browser'
import { Box } from '@mui/material'
import { ORGANIZATION_BAR_WIDTH } from '../constants'
import { OrganizationSelect } from './OrganizationSelect'
import { spacing } from '../styling'

type Props = { hide?: boolean; insets: ILayout['insets']; children?: React.ReactNode }

export const OrganizationSidebar: React.FC<Props> = ({ hide, insets, children }) => {
  const addSpace = browser.isMac && browser.isElectron

  return hide ? (
    <>{children}</>
  ) : (
    <Box
      className="sidebar"
      sx={theme => ({
        backgroundColor: theme.palette.grayLighter.main,
        display: 'flex',
        height: '100%',
        contain: 'layout',
        // for iOS mobile
        paddingLeft: insets.left ? `${insets.left}px` : undefined,
      })}
    >
      <Box
        sx={theme => ({
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: ORGANIZATION_BAR_WIDTH,
          minWidth: ORGANIZATION_BAR_WIDTH,
          maxWidth: ORGANIZATION_BAR_WIDTH,
          borderRight: `1px solid ${theme.palette.grayLight.main}`,
          position: 'relative',
          overflow: 'hidden',
          // for iOS mobile
          paddingTop: `${spacing.md + (insets.top ? insets.top : addSpace ? spacing.md : 0)}px`,
          paddingBottom: `${insets?.bottom ?? 0}px`,
        })}
      >
        <OrganizationSelect />
      </Box>
      {children}
    </Box>
  )
}
