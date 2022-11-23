import React, { useContext } from 'react'
import { DiagramGroupType } from './DiagramGroup'
import { DiagramContext } from '../services/Context'
import { Divider, DividerProps } from '@mui/material'

type Props = {
  type?: DiagramGroupType
  flexGrow?: number
}

export const DiagramPath: React.FC<Props> = ({ type, flexGrow = 1 }) => {
  const { highlightTypes, state } = useContext(DiagramContext)
  const highlight = type ? highlightTypes.includes(type) : false
  let sx: DividerProps['sx'] = {
    flexGrow,
    borderBottomWidth: 1,
    borderColor: 'grayDarkest.main',
    marginBottom: '8px',
    marginTop: '9px',
  }

  switch (type) {
    case 'tunnel':
      if (state === 'connected') {
        sx.borderTopWidth = 1
        sx.borderBottomWidth = 1
        sx.minHeight = '5px'
        sx.marginBottom = '6px'
        sx.marginTop = '7px'
      } else {
        sx.borderStyle = 'dotted'
      }
      break
  }

  switch (state) {
    case 'ready':
      sx.borderColor = type === 'initiator' ? 'primary.main' : 'grayDarker.main'
      break
    case 'connected':
      sx.borderColor = 'primary.main'
      break
    case 'offline':
      if (type !== 'initiator') sx.borderColor = 'grayLight.main'
  }

  if (highlight) {
    sx.borderColor = 'alwaysWhite.main'
  }

  return <Divider sx={sx} />
}
