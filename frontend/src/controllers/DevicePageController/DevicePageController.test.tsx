import React from 'react'
import { mount } from 'enzyme'
import { DevicePageController } from './DevicePageController'

describe('components/DevicePageController', () => {
  test('should not explode', () => {
    mount(<DevicePageController />)
  })
})
