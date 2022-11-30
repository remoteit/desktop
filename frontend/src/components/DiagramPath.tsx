import React, { useContext } from 'react'
import { DiagramGroupType } from './DiagramGroup'
import { DiagramContext } from '../services/Context'
import { Divider, DividerProps } from '@mui/material'

type Props = {
  type?: DiagramGroupType
  flexGrow?: number
}

export const DiagramPath: React.FC<Props> = ({ type, flexGrow = 1 }) => {
  const { highlightTypes, activeTypes, state, proxy } = useContext(DiagramContext)
  const active = type ? activeTypes.includes(type) : false
  const highlight = type ? highlightTypes.includes(type) : false
  let sx: DividerProps['sx'] = {
    flexGrow,
    borderBottomWidth: 1,
    borderColor: 'grayDarkest.main',
    marginBottom: '8px',
    marginTop: '9px',
    maxWidth: 40,
    width: 40,
  }

  switch (type) {
    case 'tunnel':
      sx.flexGrow = 1
      sx.maxWidth = 'initial'
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
    case 'initiator':
      if (proxy) sx.borderStyle = 'dotted'
      break
    case 'relay':
      sx.width = 40
      break
    case 'target':
      sx.width = 40
      break
  }

  switch (state) {
    case 'ready':
      sx.borderColor = 'grayDarker.main'
      break
    case 'offline':
      if (type !== 'initiator') sx.borderColor = 'grayLight.main'
  }

  if (active) {
    sx.borderColor = 'primary.main'
  }

  if (highlight) {
    sx.borderColor = 'alwaysWhite.main'
  }

  return <Divider sx={sx} />
}
