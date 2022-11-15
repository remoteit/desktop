import React, { useContext } from 'react'
import { DiagramGroupType } from './DiagramGroup'
import { DiagramContext } from '../services/Context'
// import { Tooltip } from '@mui/material'
import { Icon, IconProps } from './Icon'

export type DiagramIconType = 'listener' | 'proxy' | 'service' | 'entrance' | 'exit' | 'forward'

type Props = { type: DiagramGroupType; icon: DiagramIconType }

// @TODO add other custom icon types and rename CustomIcon? SpecialIcon?
export const DiagramIcon: React.FC<Props> = ({ type, icon }) => {
  const { activeTypes, selectedTypes, state } = useContext(DiagramContext)
  const selected = type ? selectedTypes.includes(type) : false
  const active = type ? activeTypes.includes(type) : false
  let props: IconProps = { type: 'regular', color: 'grayDarkest.main' }

  switch (icon) {
    case 'listener':
      props.name = 'circle-half'
      props.rotate = 180
      break
    case 'proxy':
      props.name = 'cloud'
      break
    case 'service':
      props.name = 'circle'
      break
    case 'forward':
      props.name = 'diamond'
      break
    case 'entrance':
      props.name = 'play'
      break
    case 'exit':
      props.name = 'play'
      props.rotate = 180
      break
  }

  switch (state) {
    case 'ready':
      props.color = 'grayDark'
      break
    case 'connected':
      props.color = 'primary'
      props.type = 'solid'
      break
    case 'online':
      props.color = 'grayDark'
      break
    case 'offline':
      props.color = 'grayLight'
      break
  }

  if (active) {
    props.color = 'primary'
  }

  if (selected) {
    props.color = 'alwaysWhite'
  }

  return (
    // <Tooltip title={type} placement="top" arrow>
    <Icon {...props} size="md" />
    // </Tooltip>
  )
}
