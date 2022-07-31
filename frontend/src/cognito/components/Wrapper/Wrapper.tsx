import React from 'react'
import { I18nextProvider } from 'react-i18next'
// import { HashRouter } from 'react-router-dom'
import i18n from '../../i18n'

export type WrapperProps = {
  children: React.ReactNode
}

export function Wrapper({ children }: WrapperProps): JSX.Element {
  return (
    <I18nextProvider i18n={i18n}>
      {/* <HashRouter> */}
      {children}
      {/* </HashRouter> */}
    </I18nextProvider>
  )
}
