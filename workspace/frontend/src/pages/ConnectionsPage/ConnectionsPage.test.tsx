import React from 'react'
import { mount } from 'enzyme'
import { MemoryRouter } from 'react-router-dom'
import { ConnectionsPage } from './ConnectionsPage'
import { Provider } from 'react-redux'
import { store } from '../../store'

describe('components/ConnectionsPage', () => {
  test('should not explode', () => {
    mount(
      <Provider store={store}>
        <MemoryRouter>
          <ConnectionsPage />
        </MemoryRouter>
      </Provider>
    )
  })
})
