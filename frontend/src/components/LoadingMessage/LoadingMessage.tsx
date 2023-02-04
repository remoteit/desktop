import React from 'react'
import { Typography, CircularProgress } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { Gutters } from '../Gutters'
import { Logo } from '../../components/Logo'
import { Body } from '../Body'
import { spacing, Color } from '../../styling'

export interface LoadingMessageProps {
  message?: React.ReactNode
  spinner?: boolean
  logo?: boolean
  logoColor?: Color
  inline?: boolean
}

export function LoadingMessage({ message, logo, logoColor, spinner = true, inline }: LoadingMessageProps) {
  const css = useStyles()
  const Container = inline ? Gutters : Body
  return (
    <Container center>
      {logo && <Logo color={logoColor} className={css.margin} />}
      {spinner && !logo && <CircularProgress size={50} thickness={1.5} className={css.margin} />}
      {message && (
        <Typography className={css.text} variant="body2">
          {message}
        </Typography>
      )}
    </Container>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  margin: { marginBottom: spacing.xl, color: palette.primary.main },
  text: { color: palette.grayDark.main },
}))
