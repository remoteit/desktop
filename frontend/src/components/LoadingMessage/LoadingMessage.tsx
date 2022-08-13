import React from 'react'
import { Typography, CircularProgress } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { Logo } from '../../components/Logo'
import { Body } from '../Body'
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
      {spinner && !logo && <CircularProgress size={75} thickness={1} className={css.margin} />}
      {message && (
        <Typography className={css.text} variant="body2">
          {message}
        </Typography>
      )}
    </Body>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  margin: { marginBottom: spacing.xl, color: palette.gray.main },
  text: { color: palette.grayDark.main, paddingBottom: spacing.xl },
}))
