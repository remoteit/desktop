import React from 'react'
import { mount } from 'enzyme'
import { DeviceListItem } from './DeviceListItem'
import { device } from '../../helpers/mockData'

describe('components/DeviceListItem', () => {
  test('should not explode', () => {
    mount(<DeviceListItem device={device()} />)
  })
})
