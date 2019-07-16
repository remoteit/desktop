import React from 'react'
import { mount } from 'enzyme'
import { ServiceListItem } from './ServiceListItem'
import { service } from '../../helpers/mockData'
import { Provider } from 'react-redux'
import { store } from '../../store'

describe('components/ServiceListItem', () => {
  test('should not explode', () => {
    mount(
      <Provider store={store}>
        <ServiceListItem service={service()} />
      </Provider>
    )
  })
})
