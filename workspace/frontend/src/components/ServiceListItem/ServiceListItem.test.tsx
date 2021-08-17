import React from 'react'
import { mount } from 'enzyme'
import { ServiceListItem } from './ServiceListItem'
import { connection } from '../../helpers/mockData'
import { MemoryRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from '../../store'

describe('components/ServiceListItem', () => {
  test('should not explode', () => {
    mount(
      <Provider store={store}>
        <MemoryRouter>
          <ServiceListItem connection={connection()} />
        </MemoryRouter>
      </Provider>
    )
  })
})
