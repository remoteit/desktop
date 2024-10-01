import React, { useEffect } from 'react'
import browser from '../services/browser'
import { Stack } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { State, Dispatch } from '../store'
import { DynamicButton, DynamicButtonProps } from './DynamicButton'
import { JobStatusIcon } from '../components/JobStatusIcon'
import { useHistory } from 'react-router-dom'
import { Color } from '../styling'

export type RunButtonProps = Omit<DynamicButtonProps, 'title' | 'onClick'> & {
  // permissions?: IPermission[]
  job?: IJob
  onClick?: (event: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => void
}

export const RunButton: React.FC<RunButtonProps> = ({
  // permissions,
  job,
  disabled,
  onClick,
  ...props
}) => {
  const dispatch = useDispatch<Dispatch>()
  const history = useHistory()

  let title = 'Run'
  let variant: 'text' | 'outlined' | 'contained' | undefined = 'text'
  let loading = false
  let color: Color = 'primary'
  let clickAction = () => {}

  switch (job?.status) {
    case 'WAITING':
      color = 'grayDark'
      loading = true
      title = 'Cancel'
      clickAction = async () => await dispatch.jobs.cancel(job?.id)
      break
    case 'RUNNING':
      loading = true
      title = 'Cancel'
      clickAction = async () => await dispatch.jobs.cancel(job?.id)
      break
    case 'FAILED':
      color = 'danger'
      title = 'Retry'
      clickAction = async () => await dispatch.jobs.run(job?.id)
      break
    case 'CANCELLED':
      color = 'grayLight'
      variant = 'contained'
      title = 'Restart'
      clickAction = async () => await dispatch.jobs.run(job?.id)
      break
    case 'SUCCESS':
    case 'READY':
      title = 'Run'
      break
    default:
      variant = 'contained'
  }

  let clickHandler = async (event?: React.MouseEvent<HTMLButtonElement | HTMLDivElement>, forceStop?: boolean) => {
    event?.stopPropagation()
    event?.preventDefault()
    await clickAction()
    event && onClick?.(event)
  }

  props.loading = props.loading || loading
  if (disabled && props.size === 'icon') title = ''

  return (
    <DynamicButton
      title={title}
      variant={variant}
      color={color}
      icon={<JobStatusIcon status={job?.status} title={false} />}
      onClick={clickHandler}
      disabled={disabled}
      {...props}
    />
  )
}
