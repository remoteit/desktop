import React, { useContext } from 'react'
import { DiagramGroupType } from './DiagramGroup'
import { DiagramContext } from '../services/Context'
import { Icon, IconProps } from './Icon'

// export type DiagramIconType = 'listener' | 'proxy' | 'service' | 'entrance' | 'exit' | 'forward'

type Props = { type: DiagramGroupType }

// @TODO add other custom icon types and rename CustomIcon? SpecialIcon?
export const DiagramIcon: React.FC<Props> = ({ type }) => {
  const { highlightTypes, state } = useContext(DiagramContext)
  const highlight = type ? highlightTypes.includes(type) : false
  let props: IconProps = {
    type: 'regular',
    color: 'grayDarkest',
  }

  switch (type) {
    case 'initiator':
      props.name = 'play'
      break
    case 'proxy':
      props.name = 'cloud'
      break
    case 'target':
      props.name = 'circle'
      break
    case 'forward':
      props.name = 'play'
      break
    case 'lan':
      props.name = 'play'
      props.rotate = 180
      break
    // case 'entrance':
    //   props.name = 'play'
    //   break
    // case 'exit':
    //   props.name = 'play'
    //   props.rotate = 180
    //   break
  }

  switch (state) {
    case 'ready':
      props.color = type === 'initiator' ? 'primary' : 'grayDarkest'
      break
    case 'connected':
      props.color = 'primary'
      props.type = 'solid'
      break
    case 'offline':
      props.color = type === 'initiator' ? undefined : 'grayLight'
      break
  }

  if (highlight) {
    props.color = 'alwaysWhite'
  }

  return <Icon {...props} />
}
