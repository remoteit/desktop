import { Box, Typography, Container } from '@mui/material'
import React from 'react'
import airbrake from '../../services/airbrake'
import { Link } from '../Link'
import { Center } from '../Center'

export type Props = {
  children: React.ReactNode
}

interface State {
  error: Error | null
}

export class ErrorHandler extends React.Component<Props, State> {
  state: State = { error: null }

  componentDidCatch(error: Error, info: any) {
    if (process.env.NODE_ENV === 'test') throw error
    console.error('[CAUGHT ERROR]:', error)
    this.setState({ error })
    airbrake.notify({ error, params: { info } })
  }

  render() {
    const { error } = this.state
    if (error) {
      return (
        <Center>
          <Container maxWidth="sm">
            <Box mb={4}>
              <Typography variant="h1">Something went wrong</Typography>
            </Box>
            <Box lineHeight={1.6} my={4}>
              <Typography>
                Something on the page has gone wrong. Please try <strong>reloading the page</strong> and trying again.
              </Typography>
            </Box>
            <Box lineHeight={1.6} my={4}>
              <Typography>
                If you continue to experience problems, please contact support at{' '}
                <Link href="mailto:support@remote.it">support@remote.it</Link>.
              </Typography>
            </Box>
            <Box my={4}>Sorry for the inconvenience!</Box>
            <Box display="none">
              <pre>{error.message}</pre>
            </Box>
          </Container>
        </Center>
      )
    }

    return this.props.children
  }
}
