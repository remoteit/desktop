import React from 'react'
import { LoadingMessage } from '../LoadingMessage'

export function DeviceLoadingMessage() {
  return (
    <div className="df ai-center jc-center h-100">
      <LoadingMessage message="Loading devices..." />
    </div>
  )
}
