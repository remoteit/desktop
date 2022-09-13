import React from 'react'
import { Button, Typography, Divider } from '@mui/material'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import { Gutters } from '../components/Gutters'
import { ChangePassword } from '../components/ChangePassword'
import { MFAPreference } from '../components/MFA/MFAPreference'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'

export const SecurityPage: React.FC = () => {
  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1">
          <Title>Security</Title>
        </Typography>
      }
    >
      <ChangePassword />
      <Divider variant="inset" />
      <MFAPreference />
      <Divider variant="inset" />
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
    <>
      <Typography variant="subtitle1" gutterBottom>
        Sign out everywhere
      </Typography>
      <Gutters>
        <Typography variant="body2">This logs you out of remote.it everywhere you're logged in.</Typography>
      </Gutters>
      <Gutters>
        <Button color="primary" variant="outlined" size="small" onClick={signedOut}>
          Sign Out Everywhere
        </Button>
      </Gutters>
    </>
  )
}
