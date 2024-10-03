import React from 'react'
import sleep from '../helpers/sleep'
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
  const [loading, setLoading] = React.useState<boolean>(false)

  let title = 'Run'
  let variant: 'text' | 'outlined' | 'contained' | undefined = 'text'
  let color: Color = 'primary'
  let icon: string | undefined
  let clickAction = async () => await dispatch.jobs.run(job?.id)

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
      break
    case 'CANCELLED':
      title = 'Restart'
      break
    case 'SUCCESS':
      title = 'Run Again'
      variant = 'contained'
      break
    case 'READY':
      title = 'Run'
      variant = 'contained'
      break
  }

  let clickHandler = async (event?: React.MouseEvent<HTMLButtonElement | HTMLDivElement>, forceStop?: boolean) => {
    event?.stopPropagation()
    event?.preventDefault()
    setLoading(true)
    await clickAction()
    await sleep(1000)
    await dispatch.jobs.fetch()
    setLoading(false)
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
      disabled={disabled || loading}
      loading={loading}
      {...props}
    />
  )
}
