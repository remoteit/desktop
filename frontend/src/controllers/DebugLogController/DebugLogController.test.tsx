import React from 'react'
import { mount } from 'enzyme'
import { DebugLogController } from './DebugLogController'
import { Provider } from 'react-redux'
import { store } from '../../store'

describe('components/DebugLogController', () => {
  test('should not explode', () => {
    mount(
      <Provider store={store}>
        <DebugLogController />
      </Provider>
    )
  })
})
