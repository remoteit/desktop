import React from 'react'
import { useTranslation } from 'react-i18next'
import { LoadingMessage } from '../../../components/LoadingMessage'

export function SignInMessage(): JSX.Element {
  const { t } = useTranslation()
  return <LoadingMessage message={t('global.actions.signing-in')} />
}
