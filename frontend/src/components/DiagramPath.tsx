import React from 'react'
import { Divider, DividerProps } from '@mui/material'

// export type DiagramPathType = 'basic' | 'tunnel'

type Props = {
  // type?: DiagramPathType
  state?: 'connected' | 'disconnected' | 'active'
}

// @TODO add other custom icon types and rename CustomIcon? SpecialIcon?
export const DiagramPath: React.FC<Props> = ({ state = 'disconnected' }) => {
  let sx: DividerProps['sx'] = {
    flexGrow: 1,
    borderBottomWidth: 1,
    borderBottomColor: 'grayDarkest.main',
  }

  // switch (type) {
  //   case 'basic':
  //     break
  //   case 'tunnel':
  //     break
  // }

  switch (state) {
    case 'connected':
      break
    case 'disconnected':
      sx.borderBottomStyle = 'dotted'
      sx.borderBottomColor = 'gray.main'
      break
    case 'active':
      sx.borderBottomColor = 'primary'
      break
  }

  return <Divider sx={sx} />
}
