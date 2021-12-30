import React, { useEffect } from 'react'
import { Box, Button, Typography } from '@material-ui/core'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import analyticsHelper from '../helpers/analyticsHelper'
import { ChangePassword } from '../components/ChangePassword'
import { MFAPreference } from '../components/MFAPreference'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'

export const SecurityPage: React.FC = () => {

  useEffect(() => {
    analyticsHelper.page('SecurityPage')
  }, [])

  return (
    <Container
      gutterBottom
      header={
        <>
          <Typography variant="h1">
            <Title>Security & Login</Title>

          </Typography>

        </>
      }
    >
      <ChangePassword />
      <MFAPreference />
      <GlobalSignOut />

    </Container>
  )
}

function GlobalSignOut(): JSX.Element {
  const { auth } = useDispatch<Dispatch>()
  const signedOut = () => {
    auth.globalSignOut()
  }
  return (
    <Box m={4} >
      <Typography variant="subtitle1" gutterBottom style={{ padding: 0 }}>
        Sign out everywhere
      </Typography>
      <Box mt={3}>
        <Typography variant='body2'>
          This Logs you out of remote.it everywhere you're logged in.
        </Typography>
      </Box>

      <Box mt={3}>
        <Button variant='outlined' color='primary' style={{ borderRadius: 3 }} onClick={signedOut}>Sign Out Everywhere</Button>
      </Box>
    </Box>
  )
}
