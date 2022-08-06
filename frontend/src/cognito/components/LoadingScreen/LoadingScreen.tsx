import React from 'react'
import { LoadingMessage, LoadingMessageProps } from '../LoadingMessage/LoadingMessage'
import { Body } from '../../../components/Body'

export type LoadingScreenProps = LoadingMessageProps & {
  message?: string
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps): JSX.Element {
  return (
    <Body center>
      <LoadingMessage message={message} />
    </Body>
  )
}
