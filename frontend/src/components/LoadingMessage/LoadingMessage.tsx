import React from 'react'
import { Typography } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { Logo } from '../../components/Logo'
import { Body } from '../Body'
import { Icon } from '../Icon'
import { spacing } from '../../styling'

export interface LoadingMessageProps {
  message?: React.ReactNode
  spinner?: boolean
  logo?: boolean
}

export function LoadingMessage({ message, logo, spinner = true }: LoadingMessageProps) {
  const css = useStyles()

  return (
    <Body center>
      {logo && <Logo className={css.margin} />}
      {spinner && !logo && (
        <Icon className={css.margin} name="spinner-third" spin size="xxl" type="light" color="primary" />
      )}
      {message && (
        <Typography className={css.text} variant="body2">
          {message}
        </Typography>
      )}
    </Body>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  margin: { marginBottom: spacing.lg },
  text: { color: palette.gray.main },
}))
