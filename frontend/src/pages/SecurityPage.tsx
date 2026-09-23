import React from 'react'
import { Button, Typography, Divider } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import { Gutters } from '../components/Gutters'
import { ChangePassword } from '../components/ChangePassword'
import { MFASettings } from '../components/MFA/MFASettings'
import { PasskeysSettings } from '../components/MFA/PasskeysSettings'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { oidcActor } from '../services/oidc'

export const SecurityPage: React.FC = () => {
  const { t } = useTranslation()
  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1">
          <Title>{t('settings.security', 'Security')}</Title>
        </Typography>
      }
    >
      <ChangePassword />
      <Divider variant="inset" />
      <MFASettings />
      <Divider variant="inset" />
      <PasskeysSettings />
      {/* A SUPPORT session (an operator viewing as the person — the id_token says so) has nothing
          this button can do: no refresh token to mint the account-API audience with, and the AS
          refuses writes from an acted token regardless. Offering a "sign out everywhere" that
          could only clear this tab would misdescribe itself; the session ends from the operator's
          console or the person's account page. */}
      {!oidcActor() && (
        <>
          <Divider variant="inset" />
          <GlobalSignOut />
        </>
      )}
    </Container>
  )
}

function GlobalSignOut(): JSX.Element {
  const { auth } = useDispatch<Dispatch>()
  const { t } = useTranslation()
  const signedOut = () => {
    auth.globalSignOut()
  }
  return (
    <>
      <Typography variant="subtitle1" gutterBottom>
        {t('settings.signOutEverywhere', 'Sign out everywhere')}
      </Typography>
      <Gutters>
        <Typography variant="body2">
          {t('settings.signOutEverywhereDescription', "This logs you out of Remote.It everywhere you're logged in.")}
        </Typography>
      </Gutters>
      <Gutters>
        <Button color="primary" variant="outlined" size="small" onClick={signedOut}>
          {t('settings.signOutEverywhereButton', 'Sign Out Everywhere')}
        </Button>
      </Gutters>
    </>
  )
}
