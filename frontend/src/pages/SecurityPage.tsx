import React from 'react'
import { Button, Typography, Divider } from '@mui/material'
import { useTranslation } from 'react-i18next'
import { Container } from '../components/Container'
import { Title } from '../components/Title'
import { Gutters } from '../components/Gutters'
import { ChangePassword } from '../components/ChangePassword'
import { MFAPreference } from '../components/MFA/MFAPreference'
import { Dispatch } from '../store'
import { useDispatch } from 'react-redux'

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
      <MFAPreference />
      <Divider variant="inset" />
      <GlobalSignOut />
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
