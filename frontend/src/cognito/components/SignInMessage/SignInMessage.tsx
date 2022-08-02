import React from 'react'
import { useTranslation } from 'react-i18next'
import { LoadingScreen } from '../LoadingScreen'

export function SignInMessage(): JSX.Element {
  const { t } = useTranslation()
  return <LoadingScreen message={t('global.actions.signing-in')} />
}
