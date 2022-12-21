import React, { useContext } from 'react'
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
    borderBottomWidth: 1.5,
    borderStyle: 'dotted',
    borderColor: 'grayDarkest.main',
    maxWidth: 50,
    width: 50,
  }

  switch (type) {
    case 'proxy':
      break
    case 'tunnel':
      sx.maxWidth = type === 'tunnel' ? 'initial' : 70
      sx.borderTopWidth = 1
      sx.borderBottomWidth = 1
      sx.minHeight = '6px'
      sx.marginLeft = '-2px'
      sx.marginRight = '-2px'
      if (state === 'connected') {
        sx.borderTopWidth = 1.5
        sx.borderBottomWidth = 1.5
        sx.borderStyle = 'solid'
      }
      break
    case 'initiator':
      if (!proxy) sx.borderStyle = 'solid'
      break
    case 'relay':
      break
    case 'target':
      sx.borderStyle = 'solid'
      break
    case 'public':
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
    sx.borderColor = 'primary.main'
  }

  return <Divider sx={sx} />
}
