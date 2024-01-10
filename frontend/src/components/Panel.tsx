import React from 'react'
import { Box } from '@mui/material'
import { Header } from './Header'

type Props = { layout: ILayout; children?: React.ReactNode }

export const Panel: React.FC<Props> = ({ layout, children }) => {
  return (
    <Box
      sx={{
        flexGrow: 1,
        height: '100%',
        maxWidth: `calc(100% - ${layout.sidePanelWidth}px)`,
        display: 'flex',
        flexDirection: 'column',
        contain: 'content',
        // for iOS mobile
        paddingTop: layout.insets?.topPx,
        paddingBottom: layout.showBottomMenu ? 0 : layout.insets?.bottomPx,
        paddingLeft: layout.hideSidebar ? layout.insets?.leftPx : 0,
        paddingRight: layout.insets?.rightPx,
      }}
    >
      <Header />
      {children}
    </Box>
  )
}