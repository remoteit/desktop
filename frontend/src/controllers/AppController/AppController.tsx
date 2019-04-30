import React from 'react'
import { App } from '../../components/App/App'
import { StateProvider } from '../../store'

export function AppController() {
  return (
    <StateProvider>
      <App />
    </StateProvider>
  )
}
