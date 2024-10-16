import React from 'react'
import { DynamicButton, DynamicButtonProps } from './DynamicButton'
import { Color } from '../styling'

export type RunButtonProps = Omit<DynamicButtonProps, 'title' | 'onClick'> & {
  job?: IJob
  onRun?: () => void
  onRunAgain?: () => void
  onCancel?: () => void
}

export const RunButton: React.FC<RunButtonProps> = ({ job, disabled, onRun, onRunAgain, onCancel, ...props }) => {
  const [loading, setLoading] = React.useState<boolean>(false)

  let title = 'Run'
  let variant: 'text' | 'outlined' | 'contained' | undefined = 'text'
  let color: Color = 'primary'
  let icon: string | undefined
  let clickAction = onRunAgain

  switch (job?.status) {
    case 'WAITING':
      title = 'Cancel'
      color = 'grayDarker'
      clickAction = onCancel
      break
    case 'RUNNING':
      title = 'Cancel'
      clickAction = onCancel
      break
    case 'FAILED':
      color = 'danger'
      title = 'Retry'
      break
    case 'CANCELLED':
      title = 'Restart'
      break
    case 'SUCCESS':
      title = 'Run Again'
      variant = 'contained'
      break
    case 'READY':
      variant = 'contained'
      clickAction = onRun
      break
  }

  let clickHandler = async (event?: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
    event?.stopPropagation()
    event?.preventDefault()
    setLoading(true)
    await clickAction?.()
    setLoading(false)
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
