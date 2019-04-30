import React from 'react'
import { mount } from 'enzyme'
import { DeviceListController } from './DeviceListController'

describe('components/DeviceListController', () => {
  test('should not explode', () => {
    mount(<DeviceListController />)
  })
})
