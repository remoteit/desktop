import React, { useContext } from 'react'
import { DiagramContext } from '../services/Context'
import { Divider, DividerProps } from '@mui/material'

type Props = {
  start?: boolean
  end?: boolean
  type?: DiagramGroupType
}

export const DiagramDivider: React.FC<Props> = ({ start, end, type }) => {
  const { highlightTypes, state } = useContext(DiagramContext)
  const highlight = type ? highlightTypes.includes(type) : false

  let sx: DividerProps['sx'] = {
    borderColor: 'grayDarkest.main',
    borderStyle: 'dotted',
    height: '24px',
    marginLeft: start ? 1 : undefined,
    marginRight: end ? 1 : undefined,
  }

  switch (state) {
    case 'ready':
    case 'online':
      sx.borderColor = 'grayDarker.main'
      break
    case 'connected':
      sx.borderColor = 'primary.main'
      sx.borderRightWidth = 2
      break
    case 'offline':
      sx.borderColor = 'grayLight.main'
  }

  if (highlight) {
    sx.borderColor = 'alwaysWhite.main'
  }

  return <Divider orientation="vertical" sx={sx} />
}
