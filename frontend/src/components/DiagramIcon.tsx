import React, { useContext } from 'react'
import { DiagramGroupType } from './DiagramGroup'
import { Tooltip, Box } from '@mui/material'
import { DiagramContext } from '../services/Context'
import { Icon, IconProps } from './Icon'

// export type DiagramIconType = 'listener' | 'proxy' | 'service' | 'entrance' | 'exit' | 'forward'

type Props = { type: DiagramGroupType; rotate?: IconProps['rotate'] }

// @TODO add other custom icon types and rename CustomIcon? SpecialIcon?
export const DiagramIcon: React.FC<Props> = ({ type, rotate }) => {
  const [hover, setHover] = React.useState<boolean>(false)
  const { highlightTypes, state } = useContext(DiagramContext)
  const highlight = type ? highlightTypes.includes(type) : false
  let tooltip = ''
  let props: IconProps = {
    type: hover ? 'solid' : 'regular',
    color: 'grayDarkest',
    rotate,
  }

  switch (type) {
    case 'initiator':
      props.name = 'circle'
      tooltip = 'Local endpoint on this system'
      break
    case 'proxy':
      props.name = 'cloud'
      tooltip = 'Agent in the cloud'
      break
    case 'target':
      props.name = 'bullseye'
      tooltip = 'Remote target endpoint'
      break
    case 'relay':
      props.name = 'play'
      tooltip = 'Remote agent'
      break
    case 'lan':
      props.name = 'play'
      tooltip = 'Any system on the local network'
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
      props.type = hover ? 'regular' : 'solid'
      break
    case 'offline':
      props.color = type === 'initiator' ? undefined : 'grayLight'
      break
  }

  if (highlight) {
    props.color = 'alwaysWhite'
  }

  return (
    <Tooltip title={tooltip} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <Box padding={1} margin={-1}>
        <Icon {...props} />
      </Box>
    </Tooltip>
  )
}
