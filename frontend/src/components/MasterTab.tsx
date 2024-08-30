import React from 'react'
import { Divider, Tab, TabProps } from '@mui/material'

export const MasterTab = (props: TabProps) => (
  <>
    <Tab {...props} />
    <Divider
      orientation="vertical"
      sx={{
        height: '1.3em',
        alignSelf: 'center',
        bgcolor: 'grayLight.main',
        marginRight: 1.5,
        marginLeft: 1.5,
      }}
    />
  </>
)
