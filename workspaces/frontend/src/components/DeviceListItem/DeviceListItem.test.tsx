import React from 'react'
import { mount } from 'enzyme'
import { DeviceListItem } from './DeviceListItem'
import { MemoryRouter } from 'react-router-dom'
import { device } from '../../helpers/mockData'
import { Provider } from 'react-redux'
import { store } from '../../store'

describe('components/DeviceListItem', () => {
  test('should not explode', () => {
    mount(
      <Provider store={store}>
        <MemoryRouter>
          <DeviceListItem device={device()} />
        </MemoryRouter>
      </Provider>
    )
  })
})
