import React from 'react'
import { Box } from '@mui/material'
import { Header } from './Header'

type Props = { layout: ILayout; children?: React.ReactNode }

export const Panel: React.FC<Props> = ({ layout, children }) => {
  console.log('render panel', { sidePanelWidth: layout.sidePanelWidth })
  return (
    <Box
      sx={{
        flexGrow: 1,
        height: '100%',
        maxWidth: `calc(100% - ${layout.sidePanelWidth}px)`,
        display: 'flex',
        flexDirection: 'column',
        contain: 'content',
      }}
    >
      <Header breadcrumbs={layout.singlePanel && !layout.mobile} />
      {children}
    </Box>
  )
}