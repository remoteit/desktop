import React from 'react'
import { mount } from 'enzyme'
import { DevicesPage } from './DevicesPage'
import { Provider } from 'react-redux'
import { store } from '../../store'

describe('components/DevicesPage', () => {
  test('should not explode', () => {
    mount(
      <Provider store={store}>
        <DevicesPage />
      </Provider>
    )
  })
})
