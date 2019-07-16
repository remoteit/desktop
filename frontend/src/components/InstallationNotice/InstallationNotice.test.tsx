import React from 'react'
import { mount } from 'enzyme'
import { InstallationNotice } from './InstallationNotice'
import { Provider } from 'react-redux'
import { store } from '../../store'

describe('components/InstallationNotice', () => {
  test('should not explode', () => {
    mount(
      <Provider store={store}>
        <InstallationNotice />
      </Provider>
    )
  })
})
