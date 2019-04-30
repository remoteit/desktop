import React from 'react'
import { mount } from 'enzyme'
import { DeviceListItem } from './DeviceListItem'

describe('components/DeviceListItem', () => {
  test('should not explode', () => {
    mount(<DeviceListItem />)
  })
})
