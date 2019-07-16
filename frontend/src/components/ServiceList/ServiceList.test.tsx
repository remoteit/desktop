import React from 'react'
import { mount } from 'enzyme'
import { ServiceList } from './ServiceList'
import { service } from '../../helpers/mockData'
import { Provider } from 'react-redux'
import { store } from '../../store'

describe('components/ServiceList', () => {
  test('should not explode', () => {
    mount(
      <Provider store={store}>
        <ServiceList services={[service(), service({ name: 'Foo' })]} />
      </Provider>
    )
  })
})
