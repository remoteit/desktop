import React from 'react'
import { mount } from 'enzyme'
import { DeviceList } from './DeviceList'

describe('components/DeviceList', () => {
  test('should not explode', () => {
    mount(<DeviceList />)
  })
})
