import React from 'react'
import { Box } from '@mui/material'
import { Header } from './Header'

type Props = { layout: ILayout; header?: boolean; children?: React.ReactNode }

export const Panel: React.FC<Props> = ({ layout, header = true, children }) => {
  return (
    <Box
      sx={{
        flexGrow: 1,
        height: '100%',
        width: `calc(100% - ${layout.sidePanelWidth}px)`,
        display: 'flex',
        flexDirection: 'column',
        contain: 'content',
        margin: 'auto',
        // for iOS mobile
        paddingTop: layout.insets?.topPx,
        paddingBottom: layout.showBottomMenu ? 0 : layout.insets?.bottomPx,
        paddingLeft: layout.hideSidebar ? layout.insets?.leftPx : 0,
        paddingRight: layout.insets?.rightPx,
      }}
    >
      {header && <Header />}
      {children}
    </Box>
  )
}