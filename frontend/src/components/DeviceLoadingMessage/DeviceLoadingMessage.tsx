import React from 'react'
import { LoadingMessage } from '../LoadingMessage'

export interface Props {}

export function DeviceLoadingMessage({ ...props }: Props) {
  return <LoadingMessage message="Loading devices..." />
}
