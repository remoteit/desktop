import React from 'react'
import { mount } from 'enzyme'
import { DevicesPage } from './DevicesPage'

describe('components/DevicesPage', () => {
  test('should not explode', () => {
    mount(<DevicesPage />)
  })
})
