import React, { useContext } from 'react'
import { DiagramGroupType } from './DiagramGroup'
import { Tooltip, Box } from '@mui/material'
import { DiagramContext } from '../services/Context'
import { Icon, IconProps } from './Icon'

type Props = { type: DiagramGroupType; end?: boolean }

export const DiagramIcon: React.FC<Props> = ({ type, end }) => {
  const [hover, setHover] = React.useState<boolean>(false)
  const { highlightTypes, activeTypes, state } = useContext(DiagramContext)
  const active = type ? activeTypes.includes(type) : false
  const highlight = type ? highlightTypes.includes(type) : false
  let tooltip = ''
  let props: IconProps = {
    type: hover ? 'solid' : 'regular',
    color: 'grayDarkest',
    rotate: end ? 180 : undefined,
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
      tooltip = end ? 'End agent' : 'Start agent'
      break
    case 'lan':
      props.name = 'chart-network'
      tooltip = 'Any system on the local network'
      break
  }

  switch (state) {
    case 'connected':
      props.type = hover ? 'regular' : 'solid'
      break
  }

  if (active) {
    props.color = 'primary'
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
