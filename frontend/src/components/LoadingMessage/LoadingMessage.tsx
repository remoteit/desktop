import React from 'react'
import { Typography, CircularProgress, LinearProgress } from '@mui/material'
import { spacing, Color } from '../../styling'
import { ResellerLogo } from '../ResellerLogo'
import { makeStyles } from '@mui/styles'
import { Gutters } from '../Gutters'
import { Logo } from '../Logo'
import { Body } from '../Body'

export interface LoadingMessageProps {
  message?: React.ReactNode
  spinner?: boolean
  logo?: boolean
  logoColor?: Color
  reseller?: IResellerRef | null
  inline?: boolean
  invert?: boolean
}

export function LoadingMessage({
  message,
  logo,
  logoColor,
  reseller,
  invert,
  spinner = true,
  inline,
}: LoadingMessageProps) {
  const css = useStyles()
  const Container = inline ? Gutters : Body
  return (
    <Container className={invert ? css.invert : undefined} center>
      {reseller && <ResellerLogo reseller={reseller} marginBottom={8} />}
      {logo && <Logo color={invert ? 'alwaysWhite' : logoColor} className={css.margin} />}
      {spinner && (logo || reseller) ? (
        <LinearProgress
          className={css.fadeIn}
          sx={{ position: 'absolute', width: '160px', height: '1px', marginTop: 5 }}
        />
      ) : (
        spinner && <CircularProgress size={50} thickness={1.5} className={css.margin} />
      )}
      {message && (
        <Typography className={css.text} variant="body2">
          {message}
        </Typography>
      )}
    </Container>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  invert: { backgroundColor: palette.primary.dark },
  margin: { marginBottom: spacing.xl, color: palette.primary.main },
  text: { color: palette.grayDark.main },
  fadeIn: { animation: '$fadeIn 600ms ease-in' },
  '@keyframes fadeIn': {
    '0%': { opacity: 0 },
    '100%': { opacity: 1 },
  },
}))
