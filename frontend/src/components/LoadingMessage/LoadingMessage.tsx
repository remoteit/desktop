import React from 'react'
import { Box, Typography, CircularProgress, LinearProgress } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { Gutters } from '../Gutters'
import { Body } from '../Body'

export interface LoadingMessageProps {
  message?: React.ReactNode
  spinner?: boolean
  logo?: React.ReactNode
  inline?: boolean
  invert?: boolean
  children?: React.ReactNode
}

export function LoadingMessage({ message, logo, invert, spinner = true, inline, children }: LoadingMessageProps) {
  const css = useStyles()
  const Container = inline ? Gutters : Body
  return (
    <Container className={invert ? css.invert : undefined} center>
      <Box position="relative" marginBottom={5}>
        {logo}
        {spinner && logo ? (
          <LinearProgress
            className={css.fadeIn}
            sx={{
              position: 'absolute',
              width: '100%',
              height: '1px',
              marginTop: 2,
            }}
          />
        ) : (
          spinner && <CircularProgress size={50} thickness={1.5} color="info" />
        )}
      </Box>
      {message && (
        <Typography color="grayDark.main" variant="body2" gutterBottom>
          {message}
        </Typography>
      )}
      {children}
    </Container>
  )
}

const useStyles = makeStyles(({ palette }) => ({
  invert: { backgroundColor: palette.brandSecondary.main },
  fadeIn: { animation: '$fadeIn 600ms ease-in' },
  '@keyframes fadeIn': {
    '0%': { opacity: 0 },
    '100%': { opacity: 1 },
  },
}))
