import React from 'react'
import { Divider, DividerProps } from '@mui/material'

// export type DiagramPathType = 'basic' | 'tunnel'

type Props = {
  // type?: DiagramPathType
  active?: boolean
  state?: IConnectionState //'connected' | 'disconnected' | 'active'
}

// @TODO add other custom icon types and rename CustomIcon? SpecialIcon?
export const DiagramPath: React.FC<Props> = ({ state = 'disconnected', active }) => {
  let sx: DividerProps['sx'] = {
    flexGrow: 1,
    borderBottomWidth: 1,
    borderColor: 'grayDarkest.main',
  }

  // switch (type) {
  //   case 'basic':
  //     break
  //   case 'tunnel':
  //     break
  // }
  switch (state) {
    case 'connected':
      sx.borderColor = 'primary.main'
      break
    case 'disconnected':
      sx.borderBottomStyle = 'dotted'
      sx.borderColor = 'gray.main'
      break
  }
  // console.log('DIAGRAM PATH', sx, state, active)

  return <Divider sx={sx} />
}
