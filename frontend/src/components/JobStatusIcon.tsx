import React from 'react'
import { CircularProgress, Box } from '@mui/material'
import { Sizes, fontSizes } from '../styling'
import { Icon } from './Icon'

type JobStatusIconProps = {
  status?: IJobStatus
  size?: Sizes
}

export const JobStatusIcon: React.FC<JobStatusIconProps> = ({ status, size = 'base' }) => {
  return status === 'SUCCESS' ? (
    <Icon name="badge-check" type="solid" color="primary" size={size} />
  ) : status === 'FAILED' || status === 'CANCELLED' ? (
    <Icon name="octagon-xmark" type="solid" color="error" size={size} />
  ) : status === 'RUNNING' || status === 'WAITING' ? (
    <CircularProgress color="primary" size={fontSizes[size]} />
  ) : (
    <Icon platform={65535} platformIcon size={size} />
  )
}
