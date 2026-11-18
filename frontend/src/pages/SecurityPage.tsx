import React, { useEffect, useState } from 'react'
import { Button, Typography, Divider } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import { Gutters } from '../components/Gutters'
import { ChangePassword } from '../components/ChangePassword'
import { FactorSettings } from '../components/MFA/FactorSettings'
import { CredentialStanding, credentialStanding, setPasswordUrl } from '../services/accountSecurity'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'
import { oidcActor } from '../services/oidc'

export const SecurityPage: React.FC = () => {
  const { t } = useTranslation()
  // Whether the AS holds a password for this account at all: somebody who signs in with an identity
  // provider (Google, their organization) has none to change until they set one.
  const [credential, setCredential] = useState<CredentialStanding>()
  useEffect(() => {
    credentialStanding().then(r => r.ok && setCredential(r.data))
  }, [])
  const readOnly = !!oidcActor()
  return (
    <Container
      gutterBottom
      header={
        <Typography variant="h1">
          <Title>{t('settings.security', 'Security')}</Title>
        </Typography>
      }
    >
      {credential?.held === false ? <NoPassword /> : !readOnly && <ChangePassword />}
      <Divider variant="inset" />
      <FactorSettings readOnly={readOnly} />
      {/* A SUPPORT session (an operator viewing as the person — the id_token says so) has nothing
          this button can do: no refresh token to mint the account-API audience with, and the AS
          refuses writes from an acted token regardless. Offering a "sign out everywhere" that
          could only clear this tab would misdescribe itself; the session ends from the operator's
          console or the person's account page. */}
      {!readOnly && (
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

function NoPassword(): JSX.Element {
  const { t } = useTranslation()
  return (
    <>
      <Typography variant="subtitle1" gutterBottom>
        {t('changePassword.title', 'Change Password')}
      </Typography>
      <Gutters bottom="xl">
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {t(
            'mfa.federated',
            'You sign in with an identity provider (like Google), so there is no Remote.It password to change. You can set one up to use alongside your provider.'
          )}
        </Typography>
        <Button variant="contained" size="small" href={setPasswordUrl()} target="_blank">
          {t('mfa.setPassword', 'Set a Password')}
        </Button>
      </Gutters>
    </>
  )
}
