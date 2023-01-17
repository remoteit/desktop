import React, { useContext } from 'react'
import { getAttribute } from './Attributes'
import { Tooltip, TooltipProps, Divider, Box } from '@mui/material'
import { DiagramContext, DeviceContext } from '../services/Context'
import { Icon, IconProps } from './Icon'
import { Link } from './Link'

type Props = { type: DiagramGroupType; end?: boolean }

export const DiagramIcon: React.FC<Props> = ({ type, end }) => {
  const [hover, setHover] = React.useState<boolean>(false)
  const { highlightTypes, activeTypes, errorTypes, state, proxy } = useContext(DiagramContext)
  const { device } = useContext(DeviceContext)
  const error = type ? errorTypes.includes(type) : false
  const active = type ? activeTypes.includes(type) : false
  const highlight = type ? highlightTypes.includes(type) : false
  let tooltip: TooltipProps['title'] = ''
  let link: string | undefined
  let props: IconProps = {
    type: hover ? 'solid' : 'regular',
    color: 'grayDarkest',
  }

  switch (type) {
    case 'initiator':
      props.name = 'circle'
      tooltip = 'Endpoint on this system'
      link = 'connect'
      break
    case 'proxy':
      props.name = 'cloud'
      tooltip = 'Proxy server'
      link = 'advanced'
      break
    case 'target':
      props.name = 'bullseye'
      link = 'edit'
      const location = getAttribute('location').value({ device })
      tooltip = (
        <>
          Remote endpoint
          {location && (
            <>
              <Divider />
              {location}
            </>
          )}
        </>
      )
      break
    case 'agent':
      props.name = 'diamond'
      link = 'advanced'
      tooltip = proxy ? 'Proxy agent' : 'Local agent'
      break
    case 'relay':
      props.name = 'diamond'
      link = 'edit'
      const isp = getAttribute('isp').value({ device })
      tooltip = (
        <>
          Remote agent
          {isp && (
            <>
              <Divider />
              {isp}
            </>
          )}
        </>
      )
      break
    case 'public':
      props.name = 'globe'
      link = 'connect'
      tooltip = 'Publicly available'
      break
    case 'lan':
      props.name = 'chart-network'
      link = 'lan'
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
      <Link to={link} sx={{ padding: 1, margin: -1 }}>
        <Icon {...props} />
      </Link>
    </Tooltip>
  )
}
