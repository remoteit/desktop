import React from 'react'
import { mount } from 'enzyme'
import { MemoryRouter } from 'react-router-dom'
import { ServiceList } from './ServiceList'
import { service, connection } from '../../helpers/mockData'
import { Provider } from 'react-redux'
import { store } from '../../store'

describe('components/ServiceList', () => {
  test('should not explode', () => {
    mount(
      <Provider store={store}>
        <MemoryRouter>
          <ServiceList services={[service(), service({ name: 'Foo' })]} connections={{ id: connection() }} />
        </MemoryRouter>
      </Provider>
    )
  })
})
