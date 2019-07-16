import React from 'react'
import { mount } from 'enzyme'
import { App } from './App'
import { Provider } from 'react-redux'
import { store } from '../../store'

describe('components/App', () => {
  test('should not explode', () => {
    mount(
      <Provider store={store}>
        <App />
      </Provider>
    )
  })
})
