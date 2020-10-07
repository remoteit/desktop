import React from 'react'
import { Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { Logo } from '../../components/Logo'
import { Body } from '../Body'
import { Icon } from '../Icon'
import { spacing, colors } from '../../styling'

export interface LoadingMessageProps {
  message?: string
  spinner?: boolean
  logo?: boolean
}

export function LoadingMessage({ message, logo, spinner = true }: LoadingMessageProps) {
  const css = useStyles()

  return (
    <Body center>
      {logo && <Logo className={css.margin} />}
      {spinner && <Icon className={css.margin} name="spinner-third" spin size="xxl" color="gray" />}
      {message && (
        <Typography className={css.text} variant="body2">
          {message}
        </Typography>
      )}
    </Body>
  )
}

const useStyles = makeStyles({
  margin: { marginBottom: spacing.lg },
  text: { color: colors.gray },
})
