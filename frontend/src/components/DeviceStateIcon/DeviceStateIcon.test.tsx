import React from 'react'
import { mount } from 'enzyme'
import { DeviceStateIcon } from './DeviceStateIcon'

describe('components/DeviceStateIcon', () => {
  test('should not explode', () => {
    mount(<DeviceStateIcon />)
  })
})
