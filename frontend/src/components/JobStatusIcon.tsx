import React from 'react'
import { Box, Tooltip } from '@mui/material'
import { Sizes } from '../styling'
import { Icon, IconProps } from './Icon'

type JobStatusIconProps = IconProps & {
  status?: IJobStatus
  size?: Sizes
  device?: boolean
  title?: boolean
  padding?: number
}

export const JobStatusIcon: React.FC<JobStatusIconProps> = ({
  status,
  title = true,
  padding = 0.7,
  device,
  ...props
}) => {
  const icon = (
    <Box padding={padding}>
      {status === 'READY' ? (
        <Icon name="circle-play" type="solid" color="primary" {...props} />
      ) : status === 'SUCCESS' ? (
        <Icon name="badge-check" type="solid" color="primary" {...props} />
      ) : status === 'FAILED' || status === 'CANCELLED' ? (
        <Icon name="octagon-xmark" type="solid" color="error" {...props} />
      ) : status === 'WAITING' ? (
        <Icon name="circle-dot" type="solid" color="info" {...props} />
      ) : status === 'RUNNING' ? (
        <Icon name="ellipsis" type="solid" color="primary" {...props} />
      ) : device ? (
        <Icon platform={65535} platformIcon {...props} />
      ) : (
        <Icon name="circle-small" type="solid" color="grayLight" {...props} />
      )}
    </Box>
  )

  return title ? (
    <Tooltip
      arrow
      placement="top"
      title={status?.toLowerCase() || (device ? 'Device' : 'No job')}
      slotProps={{ tooltip: { sx: { textTransform: 'capitalize' } } }}
    >
      {icon}
    </Tooltip>
  ) : (
    icon
  )
}
