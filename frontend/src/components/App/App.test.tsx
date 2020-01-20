import React from 'react'
import { mount } from 'enzyme'
import { App } from './App'
import { Provider } from 'react-redux'
import { store } from '../../store'
import { MemoryRouter } from 'react-router-dom'

describe('components/App', () => {
  test('should not explode', () => {
    mount(
      <MemoryRouter>
        <Provider store={store}>
          <App />
        </Provider>
      </MemoryRouter>
    )
  })
})
