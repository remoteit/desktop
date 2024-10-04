import React from 'react'
import { Box, Tooltip } from '@mui/material'
import { Sizes } from '../styling'
import { Icon } from './Icon'

type JobStatusIconProps = {
  status?: IJobStatus
  size?: Sizes
  device?: boolean
  title?: boolean
  padding?: number
}

export const JobStatusIcon: React.FC<JobStatusIconProps> = ({ status, size = 'md', title = true, padding = 0.7, device }) => {
  const icon = (
    <Box padding={padding}>
      {status === 'READY' ? (
        <Icon name="chevron-right" type="solid" color="primary" size={size} />
      ) : status === 'SUCCESS' ? (
        <Icon name="badge-check" type="solid" color="primary" size={size} />
      ) : status === 'FAILED' || status === 'CANCELLED' ? (
        <Icon name="octagon-xmark" type="solid" color="error" size={size} />
      ) : status === 'WAITING' ? (
        <Icon name="ellipsis" type="solid" color="info" size={size} />
      ) : status === 'RUNNING' ? (
        <Icon name="ellipsis" type="solid" color="primary" size={size} />
      ) : device ? (
        <Icon platform={65535} platformIcon size={size} />
      ) : (
        <Icon name="circle-small" type="solid" color="grayLight" size={size} />
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
