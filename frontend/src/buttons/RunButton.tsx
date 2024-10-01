import React from 'react'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../store'
import { DynamicButton, DynamicButtonProps } from './DynamicButton'
import { Color } from '../styling'

export type RunButtonProps = Omit<DynamicButtonProps, 'title' | 'onClick'> & {
  job?: IJob
  onClick?: (event: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => void
}

export const RunButton: React.FC<RunButtonProps> = ({ job, disabled, onClick, ...props }) => {
  const dispatch = useDispatch<Dispatch>()

  let title = 'Run'
  let variant: 'text' | 'outlined' | 'contained' | undefined = 'text'
  let loading = false
  let color: Color = 'primary'
  let icon: string | undefined
  let clickAction = () => {}

  switch (job?.status) {
    case 'WAITING':
      title = 'Cancel'
      color = 'grayDarker'
      clickAction = async () => await dispatch.jobs.cancel(job?.id)
      break
    case 'RUNNING':
      title = 'Cancel'
      clickAction = async () => await dispatch.jobs.cancel(job?.id)
      break
    case 'FAILED':
      title = 'Retry'
      color = 'danger'
      clickAction = async () => await dispatch.jobs.run(job?.id)
      break
    case 'CANCELLED':
      title = 'Restart'
      clickAction = async () => await dispatch.jobs.run(job?.id)
      break
    case 'SUCCESS':
    case 'READY':
      title = 'Run Script'
      variant = 'contained'
      break
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
      icon={icon}
      iconType="solid"
      onClick={clickHandler}
      disabled={disabled}
      {...props}
    />
  )
}
