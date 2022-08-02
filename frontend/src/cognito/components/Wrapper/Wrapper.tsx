import React from 'react'
import i18n from '../../i18n'
import { I18nextProvider } from 'react-i18next'

export type WrapperProps = {
  children: React.ReactNode
}

export function Wrapper({ children }: WrapperProps): JSX.Element {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
