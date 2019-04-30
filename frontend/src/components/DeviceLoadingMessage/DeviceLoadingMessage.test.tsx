import React from 'react'
import { mount } from 'enzyme'
import { DeviceLoadingMessage } from './DeviceLoadingMessage'

describe('components/DeviceLoadingMessage', () => {
  test('should not explode', () => {
    mount(<DeviceLoadingMessage />)
  })
})
