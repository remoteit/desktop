import React from 'react'
import { Tooltip } from '@mui/material'
import { Icon, IconProps } from './Icon'

export type DiagramIconType = 'listener' | 'service' | 'entrance' | 'exit'

type Props = { type: DiagramIconType; state?: IConnectionState }

// @TODO add other custom icon types and rename CustomIcon? SpecialIcon?
export const DiagramIcon: React.FC<Props> = ({ type, state }) => {
  let props: IconProps = { type: 'light', color: 'grayDarkest.main' }

  switch (type) {
    case 'listener':
      props.name = 'circle-half'
      props.rotate = 180
      props.scale = 0.9

      break
    case 'service':
      props.name = 'circle'
      props.scale = 0.8
      props.type = 'regular'
      break
    case 'entrance':
      props.name = 'play'
      break
    case 'exit':
      props.name = 'play'
      props.rotate = 180
      break
  }

  return (
    <Tooltip title={type} placement="top" arrow>
      <Icon {...props} size="lg" />
    </Tooltip>
  )
}
