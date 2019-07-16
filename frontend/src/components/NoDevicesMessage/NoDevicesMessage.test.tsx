import React from 'react'
import { mount } from 'enzyme'
import { NoDevicesMessage } from './NoDevicesMessage'

describe('components/NoDevicesMessage', () => {
  test('should not explode', () => {
    mount(<NoDevicesMessage />)
  })
})
