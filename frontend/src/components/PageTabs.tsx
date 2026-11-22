import React from 'react'
import { Tabs, TabsProps } from '@mui/material'

export const PageTabs: React.FC<TabsProps> = ({ sx, children, ...props }) => (
  <Tabs
    variant="scrollable"
    scrollButtons={false}
    {...props}
    sx={[
      theme => ({
        borderBottom: `1px solid ${theme.palette.grayLighter.main}`,
        '&::after': { display: 'none' },
        '& .MuiTabs-indicator': { height: 2, backgroundColor: theme.palette.primary.main },
        '& .MuiTab-root': {
          fontSize: theme.typography.body2.fontSize,
          color: theme.palette.grayDarker.main,
          padding: '6px 0 8px',
          marginRight: 3,
          borderRadius: 0,
          [theme.breakpoints.down('sm')]: { minHeight: 40 },
          '&:hover': { backgroundColor: 'transparent', color: theme.palette.black.main },
          '&.Mui-selected': { backgroundColor: 'transparent', color: theme.palette.black.main },
        },
      }),
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
  >
    {children}
  </Tabs>
)
