import React from 'react'
import { Center } from '../Center'
import { LoadingMessage, LoadingMessageProps } from '../LoadingMessage/LoadingMessage'
import { fontSize, colors } from '../../styles/variables'

export type LoadingScreenProps = LoadingMessageProps & {
  message?: string
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps): JSX.Element {
  return (
    <Center textAlign="center" color={colors.grayLight}>
      <LoadingMessage message={message} />
    </Center>
  )
}
