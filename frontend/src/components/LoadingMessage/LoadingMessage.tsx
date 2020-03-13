import React from 'react'
import { Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { Body } from '../Body'
import { Icon } from '../Icon'
import { spacing } from '../../styling'

export interface LoadingMessageProps {
  message?: string
}

export function LoadingMessage({ message }: LoadingMessageProps) {
  const css = useStyles()

  return (
    <Body center>
      <Icon className={css.spinner} name="spinner-third" spin size="xxl" color="gray" />
      {message && <Typography variant="body2">{message}</Typography>}
    </Body>
  )
}

const useStyles = makeStyles({
  spinner: { marginBottom: spacing.lg },
})
