import React from 'react'
import { mount } from 'enzyme'
import { SettingsPage } from './SettingsPage'
import { Provider } from 'react-redux'
import { store } from '../../store'

describe('components/SettingsPage', () => {
  test('should not explode', () => {
    mount(
      <Provider store={store}>
        <SettingsPage />
      </Provider>
    )
  })
})
