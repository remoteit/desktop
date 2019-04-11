import React from 'react'
import { mount } from 'enzyme'
import { DeviceListPage } from './DeviceListPage'

describe('components/DeviceListPage', () => {
  test('should not explode', () => {
    mount(<DeviceListPage />)
  })
})
