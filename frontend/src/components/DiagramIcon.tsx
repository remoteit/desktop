import React, { useContext } from 'react'
import { getAttribute } from './Attributes'
import { Tooltip, TooltipProps, Divider, Box } from '@mui/material'
import { DiagramContext, DeviceContext } from '../services/Context'
import { Icon, IconProps } from './Icon'

type Props = { type: DiagramGroupType; end?: boolean }

export const DiagramIcon: React.FC<Props> = ({ type, end }) => {
  const [hover, setHover] = React.useState<boolean>(false)
  const { highlightTypes, activeTypes, errorTypes, state, proxy } = useContext(DiagramContext)
  const { device } = useContext(DeviceContext)
  const error = type ? errorTypes.includes(type) : false
  const active = type ? activeTypes.includes(type) : false
  const highlight = type ? highlightTypes.includes(type) : false
  let tooltip: TooltipProps['title'] = ''
  let props: IconProps = {
    type: hover ? 'solid' : 'regular',
    color: 'grayDarkest',
  }

  switch (type) {
    case 'initiator':
      props.name = 'circle'
      tooltip = 'Endpoint on this system'
      break
    case 'proxy':
      props.name = 'cloud'
      tooltip = 'Proxy server'
      break
    case 'target':
      props.name = 'bullseye'
      tooltip = (
        <>
          Remote endpoint
          <Divider />
          {getAttribute('location').value({ device })}
        </>
      )
      break
    case 'agent':
      props.name = 'diamond'
      tooltip = proxy ? 'Proxy agent' : 'Local agent'
      break
    case 'relay':
      props.name = 'diamond'
      tooltip = (
        <>
          Remote agent
          <Divider />
          {getAttribute('isp').value({ device })}
        </>
      )
      break
    case 'public':
      props.name = 'globe'
      tooltip = 'Publicly available'
      break
    case 'lan':
      props.name = 'chart-network'
      tooltip = 'The local network'
      break
  }

  switch (state) {
    case 'offline':
      if (!['initiator', 'lan'].includes(type)) props.color = 'gray'
      break
    case 'connected':
      props.type = hover ? 'regular' : 'solid'
      break
  }

  if (active) {
    props.color = 'primary'
  }

  if (highlight) {
    props.color = 'primary'
  }

  if (error) {
    props.color = 'danger'
  }

  return (
    <Tooltip title={tooltip} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} arrow>
      <Box padding={1} margin={-1}>
        <Icon {...props} />
      </Box>
    </Tooltip>
  )
}
