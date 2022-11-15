import React, { useContext } from 'react'
import { DiagramGroupType } from './DiagramGroup'
import { DiagramContext } from '../services/Context'
import { Divider, DividerProps } from '@mui/material'

type Props = {
  type?: DiagramGroupType
}

export const DiagramPath: React.FC<Props> = ({ type }) => {
  const { activeTypes, state } = useContext(DiagramContext)
  const active = type ? activeTypes.includes(type) : false
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
    case 'ready':
      sx.borderColor = 'gray.main'
      if (active) {
        sx.borderColor = 'primary.main'
        sx.borderBottomWidth = 2
      }
      break
    case 'connected':
      sx.borderColor = 'primary.main'
      sx.borderBottomWidth = 2
      break
    case 'online':
      sx.borderColor = 'gray.main'
      break
    case 'offline':
      sx.borderColor = 'grayLight.main'
  }

  console.log('line', { active, activeTypes, state })
  return <Divider sx={sx} />
}