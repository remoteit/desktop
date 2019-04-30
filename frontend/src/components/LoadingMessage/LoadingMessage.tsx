import React from 'react'
import { Icon } from '../Icon'

export interface Props {
  message?: string
}

export function LoadingMessage({ message, ...props }: Props) {
  return (
    <div className="h-100 df fd-col ai-center jc-center center">
      <Icon name="spinner-third" spin size="xxl" color="gray-dark" />
      {message && <div className="mt-lg gray">{message}</div>}
    </div>
  )
}
