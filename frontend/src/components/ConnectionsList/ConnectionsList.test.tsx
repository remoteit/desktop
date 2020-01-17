import React from 'react'
import { mount } from 'enzyme'
import { ConnectionsList } from './ConnectionsList'
import { connection } from '../../helpers/mockData'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from '../../store'

describe('components/ConnectionsList', () => {
  test('should not explode', () => {
    mount(
      <Provider store={store}>
        <MemoryRouter>
          <ConnectionsList connections={[connection(), connection('Another connection', 33001)]} services={[]} />
        </MemoryRouter>
      </Provider>
    )
  })
})
