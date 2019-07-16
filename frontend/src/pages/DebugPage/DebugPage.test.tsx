import React from 'react'
import { mount } from 'enzyme'
import { DebugPage } from './DebugPage'
import { Provider } from 'react-redux'
import { store } from '../../store'

describe('components/DebugPage', () => {
  test('should not explode', () => {
    mount(
      <Provider store={store}>
        <DebugPage />
      </Provider>
    )
  })
})
